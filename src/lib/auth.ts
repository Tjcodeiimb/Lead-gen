import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type SessionUser = { id: string; email: string };

/** Call at the top of every server action and page that needs a signed-in user. */
export async function requireUser(): Promise<SessionUser> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!data.user || !email) redirect("/login");
  if (env.allowedEmails.length && !env.allowedEmails.includes(email)) redirect("/login?denied=1");
  return { id: data.user.id, email };
}
