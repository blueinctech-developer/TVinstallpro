// Password hashing with scrypt (Node's built-in crypto). Plain TS so the scripts can share it.
// Also verifies hashes imported from WordPress, so old users keep their passwords; they're
// re-hashed with scrypt on their first successful sign-in (see needsRehash).
import { compare as bcryptCompare } from "bcryptjs";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (pw: string, salt: Buffer, len: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(pw, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key))));

const N = 2 ** 15;
const r = 8;
const p = 1;
const KEYLEN = 64;
const maxmem = 64 * 1024 * 1024;

export const minPasswordLength = 12;

/** Format: scrypt$N$r$p$saltB64$hashB64, so parameters can be raised later without breaking old hashes. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r, p, maxmem });
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith("scrypt$")) return verifyWordPress(password, stored);
  const [algo, n, rr, pp, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
    maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** True for hashes imported from WordPress: replace them with scrypt once the password is known to be right. */
export const needsRehash = (stored: string) => !stored.startsWith("scrypt$");

// ---------- WordPress hash formats ----------

/*
 * WordPress 6.8+:  "$wp" + bcrypt(base64(HMAC-SHA384(password, "wp-sha384")))
 * Plugins / PHP:   "$2y$…" plain bcrypt
 * WordPress <6.8:  "$P$…" phpass portable hashes (iterated MD5)
 * Very old:        32-char hex MD5
 * WordPress trims the password before hashing in some versions, so both forms are tried.
 */
async function verifyWordPress(password: string, stored: string): Promise<boolean> {
  for (const pw of new Set([password, password.trim()])) {
    if (stored.startsWith("$wp$2")) {
      const pre = createHmac("sha384", "wp-sha384").update(pw, "utf8").digest("base64");
      if (await bcryptCompare(pre, toBcrypt(stored.slice(3)))) return true;
    } else if (/^\$2[aby]\$/.test(stored)) {
      if (await bcryptCompare(pw, toBcrypt(stored))) return true;
    } else if (stored.startsWith("$P$") || stored.startsWith("$H$")) {
      const out = phpass(pw, stored);
      if (out && out.length === stored.length && timingSafeEqual(Buffer.from(out), Buffer.from(stored))) return true;
    } else if (/^[a-f0-9]{32}$/i.test(stored)) {
      const md5 = createHash("md5").update(pw, "utf8").digest("hex");
      if (timingSafeEqual(Buffer.from(md5), Buffer.from(stored.toLowerCase()))) return true;
    }
  }
  return false;
}

// PHP writes $2y$, bcryptjs reads $2a$/$2b$: same algorithm, different label.
const toBcrypt = (h: string) => h.replace(/^\$2y\$/, "$2b$");

const ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** phpass "portable" hash, as WordPress used before 6.8. Returns the full hash string, or null. */
function phpass(password: string, setting: string): string | null {
  const countLog2 = ITOA64.indexOf(setting[3]);
  if (countLog2 < 7 || countLog2 > 30) return null;
  const salt = setting.slice(4, 12);
  if (salt.length !== 8) return null;
  const pw = Buffer.from(password, "utf8");
  let hash = createHash("md5").update(Buffer.concat([Buffer.from(salt, "binary"), pw])).digest();
  for (let count = 1 << countLog2; count > 0; count--) hash = createHash("md5").update(Buffer.concat([hash, pw])).digest();
  return setting.slice(0, 12) + encode64(hash, 16);
}

function encode64(input: Buffer, count: number) {
  let out = "";
  let i = 0;
  do {
    let value = input[i++];
    out += ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    out += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    out += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    out += ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return out;
}

/** A hash to compare against when the email is unknown, so timing doesn't reveal which emails exist. */
export const dummyHash = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(KEYLEN).toString("base64");
