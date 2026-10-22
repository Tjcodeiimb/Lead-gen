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
