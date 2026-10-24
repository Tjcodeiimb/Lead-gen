/**
 * Gmail drafts via Google OAuth 2.0 (web server flow). No SDK: three HTTPS calls.
 * Scope gmail.compose lets us create drafts but not read mail or send on your behalf.
 */
import { getJsonSetting, getKey, setJsonSetting } from "@/lib/integrations/keys";
import { env } from "@/lib/env";

export const SCOPE = "https://www.googleapis.com/auth/gmail.compose";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleOAuth = { refresh_token: string; access_token?: string; expires_at?: number; email?: string };

export function redirectUri() { return `${env.appUrl.replace(/\/$/, "")}/api/google/callback`; }

export async function authUrl(state: string) {
  const clientId = await getKey("google_client_id");
  if (!clientId) throw new Error("Add the Google client ID in Settings → Integrations first.");
  const u = new URL(AUTH_URL);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", `${SCOPE} https://www.googleapis.com/auth/userinfo.email`);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeCode(code: string) {
  const [clientId, clientSecret] = await Promise.all([getKey("google_client_id"), getKey("google_client_secret")]);
  const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri(), grant_type: "authorization_code" }) });
  if (!res.ok) throw new Error(`Google token exchange failed: ${(await res.text()).slice(0, 200)}`);
  const t = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  if (!t.refresh_token) throw new Error("Google did not return a refresh token. Remove the app's access at myaccount.google.com/permissions and connect again.");
  const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${t.access_token}` } }).then((r) => r.json()) as { email?: string };
  const saved: GoogleOAuth = { refresh_token: t.refresh_token, access_token: t.access_token, expires_at: Date.now() + (t.expires_in - 60) * 1000, email: info.email };
  await setJsonSetting("google_oauth", saved);
  return saved;
}

async function accessToken(): Promise<string> {
  const g = await getJsonSetting<GoogleOAuth>("google_oauth");
  if (!g?.refresh_token) throw new Error("Google is not connected. Settings → Integrations → Connect Google.");
  if (g.access_token && g.expires_at && g.expires_at > Date.now()) return g.access_token;
  const [clientId, clientSecret] = await Promise.all([getKey("google_client_id"), getKey("google_client_secret")]);
  const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ refresh_token: g.refresh_token, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" }) });
  if (!res.ok) throw new Error("Google refresh failed. Reconnect Google in Settings → Integrations.");
  const t = (await res.json()) as { access_token: string; expires_in: number };
  await setJsonSetting("google_oauth", { ...g, access_token: t.access_token, expires_at: Date.now() + (t.expires_in - 60) * 1000 });
  return t.access_token;
}

function b64url(s: string) { return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }

/** Creates a draft in the connected Gmail. Returns the draft id. */
export async function createDraft(input: { to: string; subject: string; body: string; threadId?: string | null }) {
  const token = await accessToken();
  const g = await getJsonSetting<GoogleOAuth>("google_oauth");
  const from = g?.email ? `From: ${g.email}\r\n` : "";
  const encodedSubject = `=?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`;
  const raw = `${from}To: ${input.to}\r\nSubject: ${encodedSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${input.body}`;
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { raw: b64url(raw), ...(input.threadId ? { threadId: input.threadId } : {}) } }),
  });
  if (!res.ok) throw new Error(`Gmail draft failed: ${(await res.text()).slice(0, 200)}`);
  const d = (await res.json()) as { id: string; message?: { id: string; threadId?: string } };
  return { id: d.id, threadId: d.message?.threadId ?? null };
}
