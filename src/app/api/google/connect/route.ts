import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authUrl } from "@/lib/gmail";

export async function GET(request: Request) {
  await requireUser();
  try {
    const state = randomBytes(16).toString("hex");
    const url = await authUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set("g_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(e instanceof Error ? e.message : "error")}`, request.url));
  }
}
