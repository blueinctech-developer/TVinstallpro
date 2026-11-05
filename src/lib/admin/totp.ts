import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/*
 * Time-based one-time passwords (RFC 6238), the 6-digit codes from Google Authenticator,
 * Microsoft Authenticator, 1Password and similar apps. SHA-1, 30-second steps, 6 digits:
 * the settings every authenticator app supports.
 */

const STEP = 30;
const DIGITS = 6;
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string) {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new 160-bit secret, base32 as authenticator apps expect. */
export const newSecret = () => base32Encode(randomBytes(20));

export function codeAt(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const n = (mac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return String(n).padStart(DIGITS, "0");
}

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP);

/**
 * Checks a code against the current step and one step either side (phones drift).
 * Returns the matching step, or null. Pass the last step used so a code can't be replayed.
 */
export function verifyCode(secret: string, code: string, lastStep: number | null, now = Date.now()) {
  const given = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(given)) return null;
  const step = currentStep(now);
  for (const s of [step - 1, step, step + 1]) {
    if (lastStep !== null && s <= lastStep) continue;
    const want = codeAt(secret, s);
    if (timingSafeEqual(Buffer.from(want), Buffer.from(given))) return s;
  }
  return null;
}

/** What the QR code holds: the app shows "TV Install Pro (email)". */
export const otpauthUri = (secret: string, account: string, issuer = "TV Install Pro") =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;

/* ---------- Recovery codes: one-time, stored only as SHA-256 hashes ---------- */

const RC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
export function newRecoveryCodes(n = 10) {
  return Array.from({ length: n }, () => {
    const bytes = randomBytes(10);
    const chars = [...bytes].map((b) => RC[b % RC.length]).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5, 10)}`;
  });
}

export const hashRecoveryCode = (code: string) =>
  createHash("sha256").update(code.toUpperCase().replace(/[^A-Z0-9]/g, "")).digest("hex");
