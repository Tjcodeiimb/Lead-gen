/**
 * Finder 2: Apollo.io.
 * - api_search is free (0 credits) but returns obfuscated last names and no contact data.
 * - people/match reveals one person (full name, email, LinkedIn, domain) for 1 credit. Free plan: 75 a month.
 * We search for free and let you choose who to reveal.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { candidates } from "@/db/schema";
import { getKey, isExhausted, markExhausted, recordCall } from "@/lib/integrations/keys";
import { countryName, roleSeniorities } from "@/lib/targeting";
import { campaignOrThrow, describeTarget, failRun, finishRun, mockMode, saveCandidates, startRun, type CandidateInput } from "./common";

const BASE = "https://api.apollo.io/api/v1";

async function apollo<T>(path: string, params: Record<string, string | string[] | number | boolean | undefined>, key: string): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(`${k}[]`, x));
    else url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { method: "POST", headers: { "x-api-key": key, "Content-Type": "application/json", Accept: "application/json" }, cache: "no-store" });
  if (res.status === 429) throw new Error("Apollo rate limit reached. Wait a minute and try again.");
  if (res.status === 401 || res.status === 403) throw new Error("Apollo rejected the API key. Check Settings → Integrations.");
  if (!res.ok) throw new Error(`Apollo error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

type SearchPerson = { id: string; first_name?: string; last_name_obfuscated?: string; title?: string | null; has_email?: boolean; organization?: { name?: string } };

export async function runApolloFinder(campaignId: string, opts: { perPage?: number; page?: number } = {}) {
  const c = await campaignOrThrow(campaignId);
  const t = describeTarget(c);
  const key = await getKey("apollo_api_key");
  const query = {
    person_titles: t.titles.slice(0, 10),
    person_seniorities: roleSeniorities(c.roles ?? []),
    organization_locations: [[c.companyCity, countryName(c.companyCountry)].filter(Boolean).join(", ")].filter(Boolean),
    organization_num_employees_ranges: c.companySizes ?? [],
    q_keywords: t.keywords.slice(0, 4).join(" "),
    page: opts.page ?? 1, per_page: opts.perPage ?? 25,
  };
  const run = await startRun(campaignId, "apollo", query);
  try {
    let items: CandidateInput[] = [];
    if ((await mockMode()) || !key) {
      if (!key && !(await mockMode())) throw new Error("Add your Apollo API key in Settings → Integrations first.");
      await new Promise((r) => setTimeout(r, 700));
      items = ["Meera", "Arjun", "Sana", "Vikram", "Nisha"].map((n, i) => ({
        companyName: `${["Aarna", "Bloom", "Cedar", "Dune", "Ember"][i]} Brands (sample)`, companyCountry: c.companyCountry, companyCity: c.companyCity,
        fullName: `${n} ${"ABCDE"[i]}•••••`, firstName: n, title: t.titles[i % Math.max(1, t.titles.length)] ?? "Founder", externalId: `mock-${i}`, confidence: 0.5,
        signal: "Matched Apollo search (title, location, size)", sourceUrl: "https://app.apollo.io",
      }));
    } else {
      const data = await apollo<{ people?: SearchPerson[]; total_entries?: number }>("mixed_people/api_search", query, key);
      items = (data.people ?? []).map((p) => ({
        companyName: p.organization?.name ?? "Unknown company", companyCountry: c.companyCountry, companyCity: c.companyCity,
        fullName: [p.first_name, p.last_name_obfuscated].filter(Boolean).join(" ") || null, firstName: p.first_name ?? null,
        title: p.title ?? null, externalId: p.id, confidence: 0.5,
        signal: "Matched Apollo search (title, location, size). Reveal to get full name and email (1 credit).", sourceUrl: "https://app.apollo.io",
      }));
    }
    const found = await saveCandidates(campaignId, run.id, "apollo", items);
    await finishRun(run.id, { found, creditsUsed: 0, log: `${items.length} matches, ${found} new. Search is free; reveals cost 1 credit each.` });
    return { found };
  } catch (e) {
    await failRun(run.id, e);
    throw e;
  }
}

type MatchPerson = { name?: string; first_name?: string; last_name?: string; title?: string; email?: string | null; email_status?: string | null; linkedin_url?: string | null; city?: string | null; country?: string | null; organization?: { name?: string; website_url?: string; primary_domain?: string; estimated_num_employees?: number; industry?: string } };

/** Spends 1 Apollo credit to reveal a candidate's full name, email, LinkedIn and company domain. */
export async function revealApolloCandidate(candidateId: string) {
  const [cand] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
  if (!cand) throw new Error("Candidate not found");
  if (cand.email) return cand;
  const key = await getKey("apollo_api_key");
  let person: MatchPerson;
  if ((await mockMode()) || !key) {
    if (!key && !(await mockMode())) throw new Error("Add your Apollo API key in Settings → Integrations first.");
    const first = cand.firstName ?? "Sample";
    person = { name: `${first} Sharma`, first_name: first, last_name: "Sharma", title: cand.title ?? "Founder", email: `${first.toLowerCase()}@${cand.companyName.toLowerCase().replace(/[^a-z]/g, "")}.example`, email_status: "verified", linkedin_url: `https://www.linkedin.com/in/${first.toLowerCase()}-sharma`, organization: { name: cand.companyName, primary_domain: `${cand.companyName.toLowerCase().replace(/[^a-z]/g, "")}.example`, estimated_num_employees: 120, industry: cand.industry ?? undefined } };
  } else {
    if (await isExhausted("apollo")) throw new Error("Apollo's 75 free reveals for this month are used up. The Integrations page shows the meter.");
    let data: { person?: MatchPerson };
    try { data = await apollo<{ person?: MatchPerson }>("people/match", { id: cand.externalId ?? undefined, reveal_personal_emails: false }, key); }
    catch (e) { if (/rate limit|402/i.test(String(e))) await markExhausted("apollo"); throw e; }
    await recordCall("apollo", "reveal", Boolean(data.person?.email), Boolean(data.person));
    if (!data.person) throw new Error("Apollo found no match for this person.");
    person = data.person;
  }
  const status = person.email ? (person.email_status === "verified" ? "valid" : "unknown") : "unknown";
  const [updated] = await db.update(candidates).set({
    fullName: person.name ?? [person.first_name, person.last_name].filter(Boolean).join(" ") ?? cand.fullName,
    firstName: person.first_name ?? cand.firstName, title: person.title ?? cand.title,
    email: person.email ?? null, emailStatus: status, linkedinUrl: person.linkedin_url ?? cand.linkedinUrl,
    domain: person.organization?.primary_domain ?? cand.domain, companyCountry: person.country?.slice(0, 2).toUpperCase() ?? cand.companyCountry,
    industry: person.organization?.industry ?? cand.industry,
    employeeRange: person.organization?.estimated_num_employees ? String(person.organization.estimated_num_employees) : cand.employeeRange,
    confidence: 0.8, signal: cand.signal?.replace(" Reveal to get full name and email (1 credit).", "") ?? cand.signal,
  }).where(eq(candidates.id, candidateId)).returning();
  return updated;
}
