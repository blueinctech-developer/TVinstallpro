import "server-only";
import { connect, type Db } from "./core.ts";

// One connection per server process. Kept on globalThis so dev hot-reloads don't open
// a second handle on the local PGlite folder.
const g = globalThis as unknown as { __tvipDb?: Promise<Db> };

export function db(): Promise<Db> {
  g.__tvipDb ??= connect().catch((err) => {
    g.__tvipDb = undefined;
    throw err;
  });
  return g.__tvipDb;
}

export type { Db };
