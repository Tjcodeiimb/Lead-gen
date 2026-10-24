/**
 * Finder 3: expansion-signal watchers. Companies showing a public sign of entering the target market.
 *  - GDELT news (free, no key): press about expansion into the target market.
 *  - TheirStack jobs (key, free tier 200 credits): "Country Manager <target>" style job posts.
 *  - Companies House (key, free): new UK companies whose controlling owner is a foreign company.
 * Company-only rows are created; people are found later with Apollo, Hunter or the research step.
 */
import { getKey } from "@/lib/integrations/keys";
import { countryName } from "@/lib/targeting";
import { campaignOrThrow, describeTarget, failRun, finishRun, mockMode, saveCandidates, startRun, type CandidateInput } from "./common";

type Gdelt = { articles?: { url: string; title: string; seendate: string; domain: string; sourcecountry?: string }[] };
type TheirStack = { data?: { job_title: string; url?: string; final_url?: string; date_posted?: string; location?: string; country_code?: string; company_object?: { name?: string; domain?: string; country?: string; employee_count?: number; industry?: string }; hiring_team?: { full_name?: string; role?: string }[] }[] };
type CH = { items?: { company_name: string; company_number: string; date_of_creation?: string; registered_office_address?: { locality?: string }; sic_codes?: string[] }[] };

export async function runSignalsFinder(campaignId: string) {
  const c = await campaignOrThrow(campaignId);
  const t = describeTarget(c);
  const target = c.targetCity || countryName(c.targetCountry) || "";
  const run = await startRun(campaignId, "signals", { target, keywords: t.keywords.slice(0, 3) });
  const log: string[] = [];
  try {
    let items: CandidateInput[] = [];
    let credits = 0;
    if (mockMode()) {
      await new Promise((r) => setTimeout(r, 900));
      items = [
        { companyName: "Lumen Skincare (sample)", companyCountry: c.companyCountry, signal: `Press: "Lumen Skincare expands to ${target}" (2026-10-12)`, signalUrl: "https://news.example/lumen", confidence: 0.6 },
        { companyName: "Trellis Foods (sample)", companyCountry: c.companyCountry, signal: `Job post: Country Manager, ${target} (2026-10-08)`, signalUrl: "https://jobs.example/trellis", confidence: 0.7, fullName: "Kabir Rao", title: "Co-founder (hiring manager)" },
      ];
      log.push("mock: 2 signals");
    } else {
      // 1. GDELT news
      try {
        const phrases = [`"expands to ${target}"`, `"launches in ${target}"`, `"enters ${target}"`, `"${target} launch"`];
        const q = encodeURIComponent(`(${phrases.join(" OR ")}) ${t.keywords[0] ?? ""}`.trim());
        const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&format=json&timespan=90d&maxrecords=40&sort=datedesc`, { cache: "no-store", headers: { "User-Agent": "UpForge OS research (outreach@upforgeconsulting.com)" } });
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          const data = JSON.parse(text) as Gdelt;
          const seen = new Set<string>();
          for (const a of data.articles ?? []) {
            const name = guessCompanyFromTitle(a.title);
            if (!name || seen.has(name.toLowerCase())) continue;
            seen.add(name.toLowerCase());
            items.push({ companyName: name, signal: `Press: "${a.title}" (${fmtGdeltDate(a.seendate)})`, signalUrl: a.url, sourceUrl: a.url, confidence: 0.4 });
          }
          log.push(`GDELT: ${data.articles?.length ?? 0} articles, ${seen.size} companies`);
        } else log.push("GDELT: rate limited, skipped");
      } catch (e) { log.push(`GDELT failed: ${e instanceof Error ? e.message : e}`); }

      // 2. TheirStack job posts
      const tsKey = await getKey("theirstack_api_key");
      if (tsKey && c.targetCountry) {
        try {
          const body = {
            job_title_or: ["Country Manager", "Head of International", "General Manager", "Launch Lead", "Head of Expansion", "Market Lead"],
            job_country_code_or: [c.targetCountry],
            ...(c.companyCountry ? { company_country_code_or: [c.companyCountry] } : {}),
            posted_at_max_age_days: 30, limit: 20, page: 0, blur_company_data: false,
          };
          const res = await fetch("https://api.theirstack.com/v1/jobs/search", { method: "POST", headers: { Authorization: `Bearer ${tsKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as TheirStack;
          for (const j of data.data ?? []) {
            const hm = j.hiring_team?.[0];
            items.push({
              companyName: j.company_object?.name ?? "Unknown company", domain: j.company_object?.domain ?? null, companyCountry: j.company_object?.country?.slice(0, 2).toUpperCase() ?? c.companyCountry,
              industry: j.company_object?.industry ?? null, employeeRange: j.company_object?.employee_count ? String(j.company_object.employee_count) : null,
              signal: `Job post: ${j.job_title}, ${j.location ?? j.country_code ?? target} (${(j.date_posted ?? "").slice(0, 10)})`, signalUrl: j.final_url ?? j.url ?? null, sourceUrl: j.url ?? null,
              fullName: hm?.full_name ?? null, title: hm?.role ? `${hm.role} (hiring manager)` : null, confidence: 0.7,
            });
          }
          credits += data.data?.length ?? 0;
          log.push(`TheirStack: ${data.data?.length ?? 0} job posts (${credits} credits)`);
        } catch (e) { log.push(`TheirStack failed: ${e instanceof Error ? e.message : e}`); }
      } else log.push(tsKey ? "TheirStack: no target country set" : "TheirStack: no key, skipped");

      // 3. Companies House: new UK incorporations (only when the target is the UK)
      const chKey = await getKey("companies_house_api_key");
      if (chKey && c.targetCountry === "GB") {
        try {
          const from = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
          const url = new URL("https://api.company-information.service.gov.uk/advanced-search/companies");
          url.searchParams.set("incorporated_from", from); url.searchParams.set("company_status", "active"); url.searchParams.set("size", "50");
          if (t.keywords[0]) url.searchParams.set("company_name_includes", t.keywords[0].split(" ")[0]);
          const res = await fetch(url, { headers: { Authorization: "Basic " + Buffer.from(`${chKey}:`).toString("base64") }, cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as CH;
          for (const co of data.items ?? []) {
            items.push({ companyName: co.company_name, companyCountry: "GB", companyCity: co.registered_office_address?.locality ?? null, signal: `New UK company incorporated ${co.date_of_creation ?? ""} (No. ${co.company_number})`, signalUrl: `https://find-and-update.company-information.service.gov.uk/company/${co.company_number}`, confidence: 0.3 });
          }
          log.push(`Companies House: ${data.items?.length ?? 0} new companies`);
        } catch (e) { log.push(`Companies House failed: ${e instanceof Error ? e.message : e}`); }
      }
    }
    const found = await saveCandidates(campaignId, run.id, "signals", items);
    await finishRun(run.id, { found, creditsUsed: credits, log: log.join(" · ") });
    return { found, log };
  } catch (e) {
    await failRun(run.id, e);
    throw e;
  }
}

/** Headlines usually start with the company: "Snitch expands to UAE via Noon". Take the words before the verb. */
function guessCompanyFromTitle(title: string): string | null {
  const m = title.match(/^([A-Z][\w&'.-]*(?:\s+[A-Z][\w&'.-]*){0,4})\s+(expands|launches|enters|opens|to open|to launch|debuts|forays|eyes|set to|plans)/i);
  if (!m) return null;
  const name = m[1].trim();
  return name.length > 2 && name.length < 60 ? name : null;
}

function fmtGdeltDate(s: string) {
  return s && s.length >= 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : "";
}
