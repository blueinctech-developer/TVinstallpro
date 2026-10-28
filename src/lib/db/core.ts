/*
 * Database connection, shared by the app (via ./index.ts) and the CLI scripts in /scripts.
 *
 * - DATABASE_URL set: any Postgres (production: Neon/Supabase). Uses postgres.js.
 * - Not set: an embedded PGlite database in .data/pglite for local development.
 *   It holds real customer data once imported, and is git-ignored. Only one process can
 *   open it at a time: stop `npm run dev` before running a script against it.
 *
 * Plain, type-strippable TS with relative imports, so Node can run the scripts directly.
 */
import { migrations } from "./migrations.ts";

export type Db = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs `fn` in one transaction; everything rolls back if it throws. */
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  /** Multiple statements, no parameters (migrations). */
  exec(text: string): Promise<void>;
  close(): Promise<void>;
};

/** PGLITE_DIR lets a second local server (e.g. `next start` beside `next dev`) use its own copy. */
export const localDataDir = process.env.PGLITE_DIR || ".data/pglite";

async function connectPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, onnotice: () => {} });
  type Conn = { unsafe: (text: string, params?: never[]) => Promise<unknown> };
  const wrap = (conn: Conn): Omit<Db, "transaction" | "close"> => ({
    query: async <T,>(text: string, params: unknown[] = []) => [...((await conn.unsafe(text, params as never[])) as T[])],
    exec: async (text: string) => {
      await conn.unsafe(text);
    },
  });
  const db: Db = {
    ...wrap(sql),
    // Nested transaction() calls run inside the outer one.
    transaction: async <T,>(fn: (tx: Db) => Promise<T>) =>
      (await sql.begin((tx) => {
        const inner: Db = { ...wrap(tx as unknown as Conn), transaction: (f) => f(inner), close: async () => {} };
        return fn(inner);
      })) as T,
    close: () => sql.end(),
  };
  return db;
}

async function connectPglite(dir: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const pg = await PGlite.create(dir);
  type Conn = { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>; exec: (text: string) => Promise<unknown> };
  const wrap = (conn: Conn) => ({
    query: async <T,>(text: string, params: unknown[] = []) => (await conn.query(text, params)).rows as T[],
    exec: async (text: string) => {
      await conn.exec(text);
    },
  });
  const db: Db = {
    ...wrap(pg),
    transaction: <T,>(fn: (tx: Db) => Promise<T>) =>
      pg.transaction((tx) => {
        const inner: Db = { ...wrap(tx as unknown as Conn), transaction: (f) => f(inner), close: async () => {} };
        return fn(inner);
      }) as Promise<T>,
    close: () => pg.close(),
  };
  return db;
}

async function migrate(db: Db) {
  await db.exec(`create table if not exists schema_migrations (
    version integer primary key,
    name text not null,
    applied_at timestamptz not null default now()
  )`);
  const done = new Set((await db.query<{ version: number }>("select version from schema_migrations")).map((r) => Number(r.version)));
  for (const m of migrations) {
    if (done.has(m.version)) continue;
    await db.transaction(async (tx) => {
      // Two servers starting at once must not both apply the same migration.
      if (process.env.DATABASE_URL) await tx.query("select pg_advisory_xact_lock(724274)");
      const again = await tx.query("select 1 from schema_migrations where version = $1", [m.version]);
      if (again.length) return;
      await tx.exec(m.sql);
      await tx.query("insert into schema_migrations (version, name) values ($1, $2)", [m.version, m.name]);
    });
  }
}

/** Opens the database and brings its schema up to date. */
export async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  // Hosted servers have no writable disk to keep a local database on: fail loudly, never lose requests silently.
  if (!url && (process.env.VERCEL || process.env.REQUIRE_DATABASE_URL)) {
    throw new Error("DATABASE_URL is not set. Add your Postgres connection string in the host's environment variables.");
  }
  const db = url ? await connectPostgres(url) : await connectPglite(localDataDir);
  await migrate(db);
  return db;
}
