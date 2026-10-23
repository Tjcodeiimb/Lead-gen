import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type SessionUser = { id: string; email: string };

/**
 * Call at the top of every server action and page that needs a signed-in user.
 * Wrapped in React cache() so a page and its layout share one check per request.
 */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = (claims?.email as string | undefined)?.toLowerCase();
  if (!claims?.sub || !email) redirect("/login");
  if (env.allowedEmails.length && !env.allowedEmails.includes(email)) redirect("/login?denied=1");
  return { id: claims.sub, email };
});
