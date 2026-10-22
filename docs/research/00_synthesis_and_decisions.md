# 00 — Synthesis of Reports 01–05 and the Decisions They Need From You

Prepared 22 October 2026 for Shardul Singh, Upforge Consulting.
Inputs: 01 Lead sourcing · 02 Claude Max and qualification · 03 Upforge context · 04 Research and offering automation · 05 Architecture and build method.

---

## 1. What the five reports agree on

The agents converge on one system, which report 05 calls "Upforge OS":

1. **Signal-first sourcing, not list-first.** Free registries (Companies House, SEC EDGAR, MCA, ACRA, ASIC), GDELT news, job-post APIs and certificate-transparency logs detect companies entering a new market. Contact data comes from Apollo plus one email finder and one cheap verifier. (01)
2. **LinkedIn is manual only.** No scrapers, no cookie-based automation, no Claude in Chrome on LinkedIn. The app prepares a daily task queue; you click. (01, 02, 04, 05)
3. **The app runs on a Console API key, never on your Max login.** Max is for building the app in Claude Code and for interactive work. Since 7 Oct 2026 Max includes $100 (5x) or $200 (20x) of monthly API credits, so Max 20x is effectively free if the app spends $100+ on the API. (02, 05)
4. **Separate fact-finding from judgement.** A researcher with web search and web fetch produces cited findings. Code converts citations into an evidence ledger with IDs. A tool-less qualifier or writer may only cite those IDs. Code computes scores, tiers and gates. A verifier re-checks quotes. (02, 04)
5. **Nothing reaches an executive without your approval.** Approval is a first-class record. Unsubscribes and objections go to a permanent hashed suppression list before anything else happens. (01, 02, 04, 05)
6. **Model mix:** Haiku 5.5 for pre-screen, extraction, judging and reply classification; Sonnet 5.5 for research and briefs; Opus 5.5 for the offering, adjudication and eval judging. (02, 04, 05)
7. **Compliance by jurisdiction is encoded in the app:** UK PECR and legitimate interests, US CAN-SPAM, Canada and Australia require publication evidence, Germany and Austria are LinkedIn-only, India DPDP duties start around 13 May 2027. (01, 02, 04, 05)
8. **The positioning and proof assets do not exist yet.** No pricing, case studies, proposal template, ICP document or corridor reports exist in Drive or on the web. The website sells "Entrepreneurs as a Service", the directory listing sells web development and HR, and your current framing is market entry plus consumer psychology plus modelling. Outbound will underperform until this is fixed. (03)

---

## 2. Where the reports disagree (resolve before building)

| # | Topic | Report says | Report says | Recommended resolution |
|---|---|---|---|---|
| 1 | **Language and job runtime** | 04: Python (FastAPI) + Inngest, with Python request skeletons and an Agent SDK (Python) plan generator | 05: Next.js 16 + TypeScript + Trigger.dev v4, with full schema, CLAUDE.md, hooks, subagents and a 14-prompt build sequence | **Take 05's stack.** Report 04 itself defers the architecture call to 05. Port 04's prompts, schemas and gates into TypeScript; they are runtime-neutral. Keep the Agent SDK plan generator (04 §3.11) as a v2 item in TypeScript. |
| 2 | **How approved email gets sent** | 02 and 04: approval creates a **Gmail draft**; you send from your own mailbox; no sequencer | 01 and 05: approval pushes the lead and per-lead copy into **Instantly** (Hypergrowth, $97) on warmed secondary domains; Instantly handles timing, rotation and reply webhooks | **Hybrid.** Tier-A C-suite accounts (top 20–50 per month): Gmail draft from your primary mailbox, sent by you. Everything else: Instantly after approval. Both paths run through the same `assertSendable()` check. Never cold-send from upforgeconsulting.com. |
| 3 | **Research is specified twice** | 02: a qualification Researcher (5 searches, 3 fetches, ≈$0.14 per lead) feeding an 8-criterion rubric | 04: a dossier Researcher (12 searches, 10 fetches, ≈$0.40 per lead) feeding a dossier, market brief and offering | **One research pass per company, in two depths.** Run 02's light pass for qualification. If the lead is A or B, run 04's S1 as a gap-filling extension that reuses the existing evidence ledger rather than starting over. Company-level caching (30 days) applies to both. |
| 4 | **Scoring design** | 02: Sonnet 5.5 Qualifier chooses levels L0–L4 on 8 criteria; code computes a 100-point score; tiers A / B / C / DQ / NEEDS_RESEARCH; Opus adjudicates borderline cases | 05: Haiku 5.5 first-pass score (fit, intent, reachability) with Sonnet escalation; tier enum A / B / C / X | **Use 02's rubric and tier set as the canonical scoring.** Use 05's Haiku call only as the pre-screen (02 already has one). Change 05's `tier` enum to A / B / C / DQ / NEEDS_RESEARCH. |
| 5 | **Dossier rigour** | 05: one Sonnet search call, then one structured extract call; citations stored as JSON on the dossier row | 04: S0 source plan → S1 researcher → S2 structuring → S3 deterministic gates plus Haiku entailment judge → S4 cached market brief → S5 Opus offering → S6 critic | **Build 04's pipeline inside 05's runtime.** Add 04's `evidence` ledger table, `market_briefs` cache table and `feedback` reason codes to 05's Drizzle schema. 05's `dossiers.citations` JSON is not enough to support the quote-verification gates. |
| 6 | **Schema gaps between 01 and 05** | 01: `signals` with weight and 45-day decay half-life, `contact_points` with a 7-state verification taxonomy, `publication_evidence_url` for CASL and Spam Act, `lia_records`, `campaign_compliance` | 05: `signals.strength` 0–1 only, a single `emailStatus` on `people`, no publication evidence field | **Merge 01's fields into 05's schema.** The decayed intent score and the verification taxonomy drive sending policy, so they are not optional. |
| 7 | **Offer prices** | 03: a 9-tier ladder priced $1.5k to $45k, all marked ASSUMPTION | 04: no price band may appear in any proposal until you set `offers.md` | **You set the prices.** See decision 1 below. |
| 8 | **Brand casing** | Website and LLP name: "UpForge" | Brief and reports: "Upforge" | Pick one. 03 recommends "UpForge" to match the domain art and legal entity. |

---

## 3. Decisions only you can make (blocking)

1. **Offer ladder and prices.** Confirm or change the 9 offers in report 03 §5 and write `offers.md` with final USD and INR bands. Nothing in the offering writer can quote a price until this exists.
2. **Case-study permissions.** For each of the 4 anonymised testimonials, the Transline content pack and the OWLED or Snoball work: can it be named, anonymised, or internal-only? Transline is in an IPO process, and the OWLED work sits under a different employer.
3. **Send path.** Accept the hybrid in §2 row 2, or choose Gmail-only or Instantly-only.
4. **Stack.** Confirm TypeScript, Next.js, Supabase, Trigger.dev, Vercel (report 05). The alternative is Python plus Inngest (report 04).
5. **Max tier and Console linking.** Move to Max 20x if the app will spend over $100 per month on the API. Link one Console org to the plan (7-day wait after subscribing), create `upforge-prod`, `upforge-dev` and `upforge-evals` workspaces with spend limits. Turn off model-training use in claude.ai privacy settings before lead data touches Max.
6. **Launch personas and countries.** Report 03 recommends starting with A (Indian consumer brands to UAE and UK), C (PE and VC operating partners) and E (startups going to the US). Confirm the country list and the lawful-basis default per country. Exclude Germany and Austria from email.
7. **Budget tier.** Report 01's "Serious" stack (about $450–600 per month for data, finder, verifier, Sales Navigator, Instantly, domains and mailboxes) plus report 05's infra and Claude (about $240–290 at 1,000 leads per month). Total about $700–900 per month. The "Bootstrap" tier (about $75–100 plus infra) is available if you want to prove messaging first.
8. **Build or buy first.** Report 05 §10 suggests a hybrid: run week-one campaigns on Clay plus Instantly while the app is built, then migrate. Decide whether you want outbound running before the app exists.
9. **Who labels the golden set.** Report 02 needs 50 hand-labelled leads and report 04 needs 25–40 hand-verified companies. About 10–15 hours of your time, and it cannot be delegated to a model.

---

## 4. Combined cost picture (list prices, Oct 2026, all estimates)

| Item | Per unit | At 1,000 raw leads / month |
|---|---|---|
| Qualification (pre-screen all, research and qualify about 45%, Opus adjudicates 20% of those) | about $0.08 per raw lead standard, $0.05 batch | $50–85 |
| Dossier, market brief, offering and critic (about 30% of raw leads reach this) | about $1.00 real-time, $0.60 batch | $180–300 |
| Deep market-entry plan, on request | $3–8 each | 5 per month: about $25 |
| Infra: Vercel Pro, Supabase Pro, Trigger.dev Hobby, Sentry, Langfuse | fixed | $55 |
| Instantly Hypergrowth (needed for webhooks) | fixed | $97 |
| Data: Apollo Basic, Findymail, verifier, TheirStack, Serper, Exa, Firecrawl, Sales Navigator | fixed | $300–400 |
| Domains and 10 mailboxes | fixed | $45–75 |
| **Total** | | **about $750–1,050 per month**, of which $100–200 is covered by Max API credits |

One closed Pulse Brief ($1.5k–2.5k) pays for a month. The binding constraint is your review time: about 4 minutes per lead package, so 100 packages is roughly 7 hours per month.

---

## 5. Expected output (report 01 benchmarks)

Per 100 well-targeted C-suite contacts: email alone yields about 0.5–1.5 meetings; email plus manual LinkedIn plus a Loom for engaged prospects yields 1–2.5. The "Serious" stack supports about 1,400–1,500 new contacts per month, which translates to roughly 8–20 meetings and 5–12 qualified meetings per month once warm-up is complete. Warm-up alone takes 3–4 weeks, so the first sends are week 4 or 5 at the earliest.

---

## 6. Recommended sequence (combined from 02 §8, 04 §11, 05 §5.11 and 03 §7)

**Week 0, before any code (you, with Claude Code and a Project):**
- Resolve §2 and §3 above.
- Write `offers.md`, `voice.md`, `case_studies.md` with permissions, `corridor_facts.md`, `compliance.md` and `banned_phrases.md` (report 04 §3.9). These become the cached knowledge base.
- Write `icp_v1.yaml` and `rubric_v1.md` (report 02 §4.2–4.3).
- Buy 2–5 secondary domains, create 3–10 mailboxes, set SPF, DKIM and DMARC, start warm-up (report 01 §4.2). This runs in the background for 3–4 weeks.
- Link the Console org to Max and create the workspaces.

**Weeks 1–4, the app (report 05 §5.11 prompts 1–14, with the merges from §2 above):**
- Week 1: spec interview, shell UI, schema with RLS, auth, crypto, audit, kill switches.
- Week 2: Claude client, pricing ledger, agent runner, Trigger.dev, CSV import, enrichment, pre-screen and qualification with report 02's rubric. Label the 50-lead golden set and run evals until precision at A is at least 0.85.
- Week 3: dossier pipeline S0–S6 from report 04, review queue, campaigns, sequences, Instantly and Gmail-draft hand-off.
- Week 4: webhooks, replies, inbox, Kanban, costs, compliance, retention, backups, deploy, runbook.

**In parallel, weeks 1–4, the credibility assets (report 03 §7):**
- Website: new hero, 4 service cards with "from" prices, corridors page, methodology page, team titles.
- 3 named or semi-named case studies with numbers.
- 3 corridor mini-reports (UK–India post-CETA, India to UAE, US–India) as gated PDFs.
- Directory clean-up (SyncGTM), Google Business profile, founder LinkedIn headline, the 8-post LinkedIn series.

**Weeks 5–10 (report 05 v2):** A/B tests, analytics, auto-approve rules for A-tier with a 10% audit, the Agent SDK deep-research agent, a signals monitor.

---

## 7. Verify before relying on it (highest-impact items across all reports)

1. **Anthropic policy on headless `claude -p` or Agent SDK with a Max login** for personal scripts. The reports found conflicting official statements. Use API keys for anything recurring, and ask Anthropic in writing if you want to rely on the grey zone. (02)
2. **Researcher token usage.** The 35k-token (02) and 180k-token (04) estimates are assumptions. Measure `usage` on 20 real leads in week 2 and recalibrate the cost table. (02, 04, 05)
3. **Instantly:** API availability per plan, custom-variable length limits for full email bodies, blocklist endpoint, List-Unsubscribe support, no webhook signature. (01, 05)
4. **Vendor prices read from competitor blogs:** Clay, Exa, Firecrawl, Tavily, Serper, Findymail, Reoon, TheirStack, Zapmail. Check each vendor's own page before buying. (01, 04)
5. **Endpoint paths** for Apollo, Prospeo, Findymail, Reoon, MillionVerifier, TheirStack. Several changed in 2025–2026. (01)
6. **India DPDP timeline.** The main duties start about 13 May 2027 unless the proposed 12-month shortening is notified. Watch the Gazette. (01)
7. **US–India trade deal status as of October 2026.** Report 03's corridor facts stop at "99% done" in June 2026. Confirm before publishing any corridor report or email that cites it. (03)
8. **Structured-output schema complexity.** Report 04's dossier and brief schemas have not been test-compiled. Split them if the API rejects them. (04)
9. **Legal review** of the per-country outreach rules in `compliance.md`. All four agents say the same thing: operational guidance, not legal advice. (01, 02, 04, 05)
10. **ITC Trade Map and UN Comtrade** free-tier eligibility and limits for an India-based firm. (04)

---

## 8. Things no report covers

- **A seed list.** The pipeline needs an initial 100–200 accounts to label and test against. Report 01 describes the sources; nobody has pulled a list yet.
- **Proposal, SOW and NDA templates.** Report 03 notes they do not exist. The offering writer produces a one-pager, not a contract.
- **Calendar and meeting flow.** Calendly or Cal.com is mentioned as a webhook source, but booking-page copy, the pre-call brief and post-call follow-up are not designed.
- **Your time budget.** Report 05 assumes about 25 founder-hours per week for 4 weeks on the build, plus review time once live, plus the credibility assets. If that is not available, the hybrid low-code start (report 05 §10) is the fallback.
