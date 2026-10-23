import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __upforgeDb: Db | undefined;
}

function connect(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in (SETUP.md step 2).");
  // Supabase's transaction pooler (port 6543) does not support prepared statements.
  const client = postgres(url, {
    prepare: false,
    max: 5,
    // Close idle connections before routers/NAT silently drop them (that caused 60s hangs + ECONNRESET).
    idle_timeout: 20,
    // Recycle every connection after 5 minutes regardless.
    max_lifetime: 60 * 5,
    // Fail fast instead of hanging if the database is unreachable.
    connect_timeout: 10,
    // TCP keepalive every 10s so home/office routers don't silently kill the socket.
    keep_alive: 10,
  });
  return drizzle(client, { schema });
}

function instance(): Db {
  if (!globalThis.__upforgeDb) globalThis.__upforgeDb = connect();
  return globalThis.__upforgeDb;
}

/**
 * Lazy proxy: the real connection is opened on first query, not at import time.
 * This lets `next build` and the login page work before the database is configured.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = instance();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
