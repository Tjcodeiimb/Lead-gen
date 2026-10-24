"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditLog, settings } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function setSetting(key: string, value: unknown) {
  const user = await requireUser();
  await db.insert(settings).values({ key, value: value as object }).onConflictDoUpdate({ target: settings.key, set: { value: value as object } });
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "settings.set", details: { key, value } });
  revalidatePath("/settings"); revalidatePath("/");
}

/** Removes the demo campaign and fictional leads created by `pnpm db:seed`. Real data is untouched. */
export async function deleteDemoData(): Promise<{ people: number; companies: number; campaigns: number }> {
  const user = await requireUser();
  const { people, companies, campaigns } = await import("@/db/schema");
  const { eq, like, sql } = await import("drizzle-orm");
  const p = await db.delete(people).where(eq(people.source, "seed")).returning({ id: people.id });
  const c = await db.delete(companies).where(like(companies.domain, "%.example")).returning({ id: companies.id });
  const k = await db.delete(campaigns).where(sql`${campaigns.name} like '%(demo)'`).returning({ id: campaigns.id });
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "demo.delete", details: { people: p.length, companies: c.length, campaigns: k.length } });
  revalidatePath("/"); revalidatePath("/leads"); revalidatePath("/campaigns"); revalidatePath("/settings");
  return { people: p.length, companies: c.length, campaigns: k.length };
}

export async function saveIntegrationKey(key: string, value: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const { INTEGRATIONS } = await import("@/lib/integrations/keys");
  if (!INTEGRATIONS.some((i) => i.key === key)) return { ok: false, error: "Unknown key" };
  const v = value.trim();
  if (!v) return { ok: false, error: "Paste a key first" };
  await db.insert(settings).values({ key, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "integration.key_saved", details: { key } });
  revalidatePath("/settings/integrations");
  return { ok: true };
}
