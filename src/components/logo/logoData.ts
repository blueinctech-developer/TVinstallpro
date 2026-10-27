/*
 * Vector rebuild of the TVInstallPro wordmark (traced from the original 500×83 PNG).
 *
 * Every letter is a centre-line stroke so it can be *drawn*. Strokes are listed in
 * drawing order: the letters left to right, then the frame (the "track") in one
 * loop that closes where it started. Heavy geometric terminals come from clipping
 * the strokes to the cap band rather than from filled outlines.
 */

export type Tone = "ink" | "blue";
export type Clip = "cap" | "v" | "a";

export type LogoStroke = {
  d: string;
  /** stroke width in viewBox units */
  w: number;
  tone: Tone;
  clip?: Clip;
  /** frame segments are drawn faster than letterforms */
  rail?: boolean;
};

export const LOGO_VIEWBOX = { x: 0, y: 2, w: 501, h: 74 };

const STEM = 11.5;
const BAR = 8.5;
const BOWL = 9;
const RAIL = 5.5;

export const LOGO_STROKES: LogoStroke[] = [
  // T
  { d: "M21 26.25H62", w: BAR, tone: "ink", clip: "cap" },
  { d: "M41.5 24V60", w: STEM, tone: "ink", clip: "cap" },
  // V (right arm rises into the frame)
  { d: "M57 27L73 53.5L94.5 8.5", w: STEM, tone: "ink", clip: "v" },
  // I
  { d: "M114 20V60", w: STEM, tone: "blue", clip: "cap" },
  // N
  { d: "M132 60V22L159 58V20", w: 11, tone: "blue", clip: "cap" },
  // S
  {
    d: "M198.5 31.5C195.5 28.4 191.6 27 186 27C178.6 27 173.6 29.6 173.6 33.6C173.6 37.8 178.4 39.1 186 40C193.8 40.9 199 42.4 199 46.6C199 50.6 193.9 53 186 53C179.6 53 175 51.4 172.4 48.2",
    w: 10,
    tone: "blue",
    clip: "cap",
  },
  // T
  { d: "M207 26.25H243", w: BAR, tone: "blue", clip: "cap" },
  { d: "M225 24V60", w: STEM, tone: "blue", clip: "cap" },
  // A (no crossbar; right leg runs down into the frame)
  { d: "M244 60L262.5 22L280 70.5", w: 11, tone: "blue", clip: "a" },
  // L
  { d: "M291 20V60", w: STEM, tone: "blue", clip: "cap" },
  { d: "M291 53.75H318.5", w: BAR, tone: "blue", clip: "cap" },
  // L
  { d: "M330 20V60", w: STEM, tone: "blue", clip: "cap" },
  { d: "M330 53.75H357.5", w: BAR, tone: "blue", clip: "cap" },
  // P
  { d: "M377.75 20V60", w: STEM, tone: "ink", clip: "cap" },
  { d: "M377.75 26.25H388C395.5 26.25 400 30.6 400 35.9C400 41.2 395.5 45.5 388 45.5H377.75", w: BOWL, tone: "ink", clip: "cap" },
  // R
  { d: "M414 20V60", w: STEM, tone: "ink", clip: "cap" },
  { d: "M414 26.25H421C427.5 26.25 431 30.4 431 35.9C431 41.4 427.5 45.5 421 45.5H414", w: BOWL, tone: "ink", clip: "cap" },
  { d: "M421 44L429.5 60", w: 11, tone: "ink", clip: "cap" },
  // O
  { d: "M465 27.25A15.75 12.75 0 1 0 465 52.75A15.75 12.75 0 1 0 465 27.25", w: 10.5, tone: "ink", clip: "cap" },
  // Frame: right side and bottom (blue) → bottom, left side and top (black) → top (blue)
  { d: "M495 5.75V70.5H276", w: RAIL, tone: "blue", rail: true },
  { d: "M268 70.5H5.75V8.5H99", w: RAIL, tone: "ink", rail: true },
  { d: "M105 8.5H497.75", w: RAIL, tone: "blue", rail: true },
];

/** Clip regions in viewBox units. */
export const LOGO_CLIPS: Record<Clip, { x: number; y: number; w: number; h: number }[]> = {
  // between cap height and baseline
  cap: [{ x: 0, y: 22, w: 501, h: 36 }],
  // V may rise into the frame but stops at the baseline
  v: [{ x: 0, y: 0, w: 501, h: 58 }],
  // A: left leg stops at the baseline, right leg continues to the frame
  a: [
    { x: 230, y: 22, w: 32.5, h: 36 },
    { x: 262.5, y: 22, w: 30, h: 54 },
  ],
};
