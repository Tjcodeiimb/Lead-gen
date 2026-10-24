import { cache } from "react";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

/**
 * Loads the whole settings table once per request (React cache) and keeps it for a second
 * in-process, so keys, flags, limits and the Claude key cost one database trip, not dozens.
 * Writers call invalidateSettings() so a change is visible on the next read.
 */
let memo: { at: number; promise: Promise<Map<string, unknown>> } | null = null;
const TTL_MS = 1500;

function fetchAll(): Promise<Map<string, unknown>> {
  // Share the in-flight promise too, so parallel callers in one request make one query.
  if (memo && Date.now() - memo.at < TTL_MS) return memo.promise;
  const promise = db.select().from(settings)
    .then((rows) => new Map<string, unknown>(rows.map((r) => [r.key, r.value])))
    .catch(() => { memo = null; return new Map<string, unknown>(); });
  memo = { at: Date.now(), promise };
  return promise;
}

export const loadSettings = cache(fetchAll);
export function invalidateSettings() { memo = null; }

export async function settingString(key: string): Promise<string> {
  const v = (await loadSettings()).get(key);
  return typeof v === "string" ? v : "";
}
