import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return _pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get: (_target, prop) => {
    const realPool = getPool();
    const val = (realPool as any)[prop];
    return typeof val === "function" ? val.bind(realPool) : val;
  }
});

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get: (_target, prop) => {
    const realDb = getDb();
    const val = (realDb as any)[prop];
    return typeof val === "function" ? val.bind(realDb) : val;
  }
});
