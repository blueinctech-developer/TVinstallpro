"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type SceneState = {
  /** 0 → 1 as the hero scrolls out of view */
  scroll: number;
  /** pointer position, -1 → 1 */
  px: number;
  py: number;
  /** 0 before the entrance, 1 once the TV has swung into place */
  entered: number;
  still: boolean;
};

const W = 4.2; // 16:9 panel incl. a slim bezel
const H = 2.42;
const D = 0.07;

/* Screen: deep navy with a brand-blue bloom rising from below and a slow light sweep. */
const screenShader = {
  uniforms: { uTime: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vec3 abyss = vec3(0.012, 0.039, 0.086);
      vec3 deep  = vec3(0.027, 0.102, 0.2);
      vec3 brand = vec3(0.039, 0.486, 0.918);
      vec3 sky   = vec3(0.369, 0.69, 0.98);
      vec2 p = vUv - vec2(0.5, 0.0);
      p.x *= 1.78;
      float bloom = smoothstep(1.05, 0.0, length(p));
      vec3 col = mix(abyss, deep, vUv.y * 0.6 + 0.2);
      col = mix(col, brand, bloom * 0.75);
      col += sky * pow(bloom, 6.0) * 0.5;
      // axial beam
      float beam = exp(-pow((vUv.x - 0.5) * 38.0, 2.0)) * (0.35 + 0.65 * vUv.y);
      col += sky * beam * 0.35;
      // slow diagonal light sweep across the glass
      float s = fract(uTime * 0.06);
      float sweep = smoothstep(0.08, 0.0, abs((vUv.x + vUv.y * 0.6) - (s * 2.4 - 0.4)));
      col += vec3(1.0) * sweep * 0.06;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* The wall: a light plane that fades into the page, carrying the TV's soft shadow. Unlit, so it
   matches the hero background exactly; values are display (sRGB) colours. */
const WALL_W = 11;
const WALL_H = 6.4;
const wallShader = {
  uniforms: {
    uTv: { value: new THREE.Vector3(0, 0, 1) }, // TV centre x, y on the wall, and its distance from it
    uPlate: { value: new THREE.Vector2(0, 0) },
    uCentre: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vP;
    void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uTv;
    uniform vec2 uPlate;
    uniform vec2 uCentre;
    varying vec2 vP;
    float box(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
    void main() {
      vec3 wall = vec3(0.905, 0.925, 0.952);
      // the TV's shadow: light from upper left, softer and fainter the further the TV stands off the wall
      float d = uTv.z;
      vec2 sp = vP - (uTv.xy + vec2(0.22, -0.2) * (0.4 + d));
      float soft = 0.12 + d * 0.45;
      float sh = (1.0 - smoothstep(-soft, soft, box(sp, vec2(${(W / 2).toFixed(2)}, ${(H / 2).toFixed(2)}) * (1.0 + d * 0.04), 0.05)));
      sh *= 0.42 / (1.0 + d * 0.9);
      // the wall plate's contact shadow
      float ps = 1.0 - smoothstep(0.0, 0.14, box(vP - uPlate - vec2(0.05, -0.05), vec2(0.24, 0.55), 0.02));
      vec3 col = wall * (1.0 - sh - ps * 0.22);
      // fade into the page around the composition
      vec2 q = (vP - uCentre) * vec2(0.5, 1.15);
      float a = 1.0 - smoothstep(0.7, 2.2, length(q));
      gl_FragColor = vec4(col, a * 0.9);
    }
  `,
};

/* Pose, in wall space (x along the wall, z out of it). "out" = 1 is pulled out on the arm and swung
   toward the viewer; 0 is folded flush onto the wall, centred on the plate. */
const PLATE_X = 2.45;
const ARM = 1.28; // each of the two arm links
const pose = (out: number) => ({
  x: THREE.MathUtils.lerp(PLATE_X, 0.25, out),
  z: THREE.MathUtils.lerp(0.13, 1.25, out),
  yaw: 0.1 * out,
});

function ArmLink({ link }: { link: React.RefObject<THREE.Mesh | null> }) {
  return (
    <mesh ref={link}>
      <boxGeometry args={[0.12, 0.13, 1]} />
      <meshStandardMaterial color="#262c35" metalness={0.75} roughness={0.38} />
    </mesh>
  );
}

function Television({ state }: { state: React.RefObject<SceneState> }) {
  const rig = useRef<THREE.Group>(null);
  const tv = useRef<THREE.Group>(null);
  const screen = useRef<THREE.ShaderMaterial>(null);
  const link1 = useRef<THREE.Mesh>(null);
  const link2 = useRef<THREE.Mesh>(null);
  const elbow = useRef<THREE.Mesh>(null);
  const smooth = useRef({ out: 0, yaw: -1.6, tilt: 0 });

  const body = useMemo(() => new RoundedBoxGeometry(W, H, D, 6, 0.035), []);
  const screenMat = useMemo(() => new THREE.ShaderMaterial(screenShader), []);
  const wallMat = useMemo(
    () => new THREE.ShaderMaterial({ ...wallShader, transparent: true, depthWrite: false }),
    [],
  );
  useEffect(() => () => {
    body.dispose();
    screenMat.dispose();
    wallMat.dispose();
  }, [body, screenMat, wallMat]);

  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), e: new THREE.Vector3(), n: new THREE.Vector3(), w: new THREE.Vector3() }),
    [],
  );

  // Stretch a unit-length link between two points (rig space).
  const span = (m: THREE.Mesh | null, from: THREE.Vector3, to: THREE.Vector3) => {
    if (!m) return;
    m.position.copy(from).add(to).multiplyScalar(0.5);
    m.scale.set(1, 1, from.distanceTo(to));
    m.updateMatrixWorld();
    m.lookAt(tmp.w.copy(to).applyMatrix4(rig.current!.matrixWorld));
  };

  useFrame((frame, delta) => {
    const r = rig.current;
    const g = tv.current;
    const s = state.current;
    if (!r || !g || !s) return;
    const t = frame.clock.elapsedTime;
    if (screen.current) screen.current.uniforms.uTime.value = t;

    const idle = s.still ? 0 : 1;
    const enter = 1 - s.entered;
    const k = 1 - Math.pow(0.0025, delta); // frame-rate independent smoothing
    const m = smooth.current;
    // Out on the arm at rest; folds flush to the wall and squares up as the hero scrolls away.
    m.out += (Math.min(1, Math.max(0, 1 - s.scroll * 1.4)) - m.out) * k;
    m.yaw += (-0.82 + s.scroll * 0.6 + s.px * 0.12 * idle - enter * 0.9 - m.yaw) * k;
    m.tilt += (0.05 - s.scroll * 0.12 - s.py * 0.06 * idle - m.tilt) * k;

    const p = pose(m.out);
    r.rotation.set(m.tilt, m.yaw, 0);
    // Keep the TV, not the wall plate, near the centre of the frame.
    const cy = Math.cos(m.yaw);
    const sy = Math.sin(m.yaw);
    const tvX = p.x * cy + p.z * sy;
    const plateX = PLATE_X * cy;
    r.position.set(-(tvX * 0.78 + plateX * 0.22), -s.scroll * 0.35, s.scroll * 0.8 - enter * 1.5);
    r.updateMatrixWorld();

    g.position.set(p.x, Math.sin(t * 0.6) * 0.04 * idle * m.out, p.z);
    g.rotation.y = p.yaw;

    // Two-link arm: wall plate → elbow → back of the TV. The elbow folds sideways along the wall.
    const a = tmp.a.set(PLATE_X, 0, 0.06);
    const b = tmp.b.set(0, 0, -D / 2 - 0.08).applyAxisAngle(THREE.Object3D.DEFAULT_UP, p.yaw).add(g.position);
    const vx = b.x - a.x;
    const vz = b.z - a.z;
    const d = Math.min(Math.hypot(vx, vz), ARM * 2 - 0.001);
    const h = Math.sqrt(ARM * ARM - (d / 2) * (d / 2));
    const n = tmp.n.set(vz, 0, -vx).normalize();
    if (n.z < 0) n.negate();
    const e = tmp.e.copy(a).add(b).multiplyScalar(0.5).addScaledVector(n, h);
    if (elbow.current) elbow.current.position.copy(e);
    span(link1.current, a, e);
    span(link2.current, e, b);

    const u = wallMat.uniforms;
    u.uTv.value.set(p.x, g.position.y, p.z);
    u.uPlate.value.set(PLATE_X, 0);
    u.uCentre.value.set((p.x + PLATE_X) / 2 - 0.2, 0);
  });

  return (
    <group ref={rig}>
      {/* Wall */}
      <mesh renderOrder={-1}>
        <planeGeometry args={[WALL_W, WALL_H]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {/* Wall plate */}
      <mesh position={[PLATE_X, 0, 0.03]}>
        <boxGeometry args={[0.46, 1.08, 0.06]} />
        <meshStandardMaterial color="#20252d" metalness={0.7} roughness={0.42} />
      </mesh>
      {/* Full-motion arm */}
      <ArmLink link={link1} />
      <ArmLink link={link2} />
      <mesh ref={elbow}>
        <cylinderGeometry args={[0.1, 0.1, 0.17, 20]} />
        <meshStandardMaterial color="#323a45" metalness={0.8} roughness={0.3} />
      </mesh>

      <group ref={tv}>
        {/* Panel */}
        <mesh geometry={body}>
          <meshPhysicalMaterial color="#0c1018" metalness={0.6} roughness={0.32} clearcoat={1} clearcoatRoughness={0.18} />
        </mesh>
        <mesh position={[0, 0, D / 2 + 0.001]}>
          <planeGeometry args={[W - 0.1, H - 0.1]} />
          <primitive object={screenMat} ref={screen} attach="material" />
        </mesh>
        {/* Glass reflection over the screen */}
        <mesh position={[0, 0, D / 2 + 0.004]}>
          <planeGeometry args={[W - 0.1, H - 0.1]} />
          <meshPhysicalMaterial transparent opacity={0.16} roughness={0.05} metalness={0} clearcoat={1} color="#ffffff" />
        </mesh>
        {/* VESA bracket on the back of the TV */}
        <mesh position={[0, 0, -D / 2 - 0.035]}>
          <boxGeometry args={[1.1, 0.75, 0.05]} />
          <meshStandardMaterial color="#20252d" metalness={0.7} roughness={0.42} />
        </mesh>
      </group>
    </group>
  );
}

export default function TvScene({
  state,
  active,
  onReady,
}: {
  state: React.RefObject<SceneState>;
  /** render only while on screen */
  active: boolean;
  onReady?: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7.9], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        onReady?.();
      }}
    >
      <Environment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 5, 6]} intensity={1.3} />
      <pointLight position={[0, -1.2, 2.2]} intensity={6} distance={6} color="#0a7cea" />
      <pointLight position={[3, 2, -3]} intensity={18} distance={9} color="#5eb0fa" />
      <Television state={state} />
    </Canvas>
  );
}
