/*
 * Creates an admin account, or resets the password of an existing one.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name" [--role admin|staff|viewer]
 *
 * The password is typed at a hidden prompt (or read from ADMIN_PASSWORD for automation) and only
 * its scrypt hash is stored. There are no default accounts or passwords.
 * Local database: stop `npm run dev` first (only one process can open it).
 */
import { connect } from "../src/lib/db/core.ts";
import { hashPassword, minPasswordLength } from "../src/lib/admin/password.ts";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function hiddenPrompt(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return reject(new Error("No terminal for the password prompt. Set ADMIN_PASSWORD instead."));
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") process.exit(130); // Ctrl+C
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

const email = arg("email")?.trim().toLowerCase();
const name = arg("name")?.trim();
const role = arg("role") ?? "admin";
if (!email || !email.includes("@") || !name) {
  console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--role admin|staff|viewer]');
  process.exit(1);
}
if (!["admin", "staff", "viewer"].includes(role)) {
  console.error("--role must be admin, staff or viewer.");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD ?? "";
if (!password) {
  password = await hiddenPrompt(`Password for ${email} (min ${minPasswordLength} characters): `);
  const again = await hiddenPrompt("Repeat password: ");
  if (again !== password) {
    console.error("The passwords don't match.");
    process.exit(1);
  }
}
if (password.length < minPasswordLength) {
  console.error(`Use at least ${minPasswordLength} characters.`);
  process.exit(1);
}

const db = await connect();
const hash = await hashPassword(password);
const [row] = await db.query<{ id: number; created: boolean }>(
  `insert into admin_users (email, name, password_hash, role) values ($1, $2, $3, $4)
   on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash, role = excluded.role, disabled = false
   returning id, (xmax = 0) as created`,
  [email, name, hash, role],
);
// A password reset signs the account out everywhere.
if (!row.created) await db.query("delete from admin_sessions where user_id = $1", [row.id]);
await db.query("insert into activity_log (action, target, meta) values ($1, $2, $3)", [
  row.created ? "admin created (cli)" : "admin password reset (cli)",
  `user:${row.id}`,
  JSON.stringify({ role }),
]);
await db.close();
console.log(`${row.created ? "Created" : "Updated"} ${role} account for ${email}. Sign in at /admin/login.`);
