import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { exchangeCode } from "@/lib/gmail";

export async function GET(request: Request) {
  await requireUser();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = (await cookies()).get("g_state")?.value;
  if (!code || !state || state !== expected) return NextResponse.redirect(new URL("/settings/integrations?error=Google+sign-in+was+interrupted.+Try+again.", request.url));
  try {
    const g = await exchangeCode(code);
    return NextResponse.redirect(new URL(`/settings/integrations?connected=${encodeURIComponent(g.email ?? "")}`, request.url));
  } catch (e) {
    return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(e instanceof Error ? e.message : "error")}`, request.url));
  }
}
