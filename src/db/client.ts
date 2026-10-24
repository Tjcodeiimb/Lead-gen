import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { pickDatabaseUrl } from "@/lib/db-url";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __upforgeDb: Db | undefined;
}

function connect(): Db {
  const url = pickDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set. On your laptop: fill in .env.local. On Vercel: Settings → Environment Variables, then Redeploy.");
  // Supabase's transaction pooler (port 6543) does not support prepared statements.
  const client = postgres(url, {
    prepare: false,
    max: POOL_SIZE,
    // Keepalive (below) stops routers dropping idle sockets, so connections can be reused for a while.
    // Reconnecting to the Tokyo pooler costs ~1s, so avoid closing too eagerly.
    idle_timeout: 120,
    // Recycle every connection after 5 minutes regardless.
    max_lifetime: 60 * 5,
    // Fail fast instead of hanging if the database is unreachable.
    connect_timeout: 10,
    // TCP keepalive every 10s so home/office routers don't silently kill the socket.
    keep_alive: 10,
  });
  return drizzle(withReadRetry(client), { schema });
}

const POOL_SIZE = 5;
const TRANSIENT = new Set(["ECONNRESET", "EPIPE", "ETIMEDOUT", "CONNECTION_CLOSED", "CONNECTION_ENDED", "CONNECTION_DESTROYED", "CONNECT_TIMEOUT"]);

function isTransient(e: unknown) {
  const code = (e as { code?: string })?.code;
  return Boolean(code && TRANSIENT.has(code));
}

/**
 * Home and office networks sometimes drop a pooled connection without telling us. For read-only
 * queries (SELECT) we retry once on a fresh connection. Writes are never retried, so nothing can
 * be saved twice.
 */
function withReadRetry(sql: postgres.Sql): postgres.Sql {
  const unsafe = sql.unsafe.bind(sql);
  type Args = Parameters<typeof unsafe>;
  const wrapped = (...args: Args) => {
    const isRead = /^\s*(select|with)\b/i.test(String(args[0]));
    const run = async (values: boolean) => {
      for (let attempt = 0; ; attempt++) {
        try {
          const q = unsafe(...args);
          return await (values ? q.values() : q);
        } catch (e) {
          // A dropped network usually kills every idle connection at once, so allow one retry per pooled
          // connection plus one: each failed attempt discards a dead socket and the last gets a fresh one.
          if (!isRead || attempt >= POOL_SIZE || !isTransient(e)) throw e;
          if (attempt === 0) console.warn(`[db] ${(e as { code?: string }).code} on a read; reconnecting`);
        }
      }
    };
    return {
      values: () => run(true),
      then: (ok?: (v: unknown) => unknown, fail?: (e: unknown) => unknown) => run(false).then(ok, fail),
    };
  };
  return new Proxy(sql, {
    get(target, prop, receiver) {
      if (prop === "unsafe") return wrapped;
      return Reflect.get(target, prop, receiver);
    },
  });
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
