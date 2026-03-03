import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type pg from "pg";
import * as schema from "@shared/schema";

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;
let _initPromise: Promise<void> | null = null;

async function init() {
  if (_db) return;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  const pgModule = await import("pg");
  const PgPool = pgModule.default?.Pool || pgModule.Pool;
  _pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  const drizzleModule = await import("drizzle-orm/node-postgres");
  _db = drizzleModule.drizzle(_pool, { schema });
}

export async function getPool(): Promise<pg.Pool> {
  if (!_initPromise) _initPromise = init();
  await _initPromise;
  return _pool!;
}

export async function getDb(): Promise<NodePgDatabase<typeof schema>> {
  if (!_initPromise) _initPromise = init();
  await _initPromise;
  return _db!;
}
