# 01 — Executive Lead Sourcing, Enrichment, Deliverability and Compliance (Oct 2026)

**Prepared for:** Upforge Consulting (Shardul Singh) — research for a self-hosted lead engine (Claude Code + Claude API)
**Research date:** 2026-10-20
**Scope:** How to source, qualify, enrich, verify and reach C-suite and expansion leaders (CEO, COO, CFO, CSO, Head of International, VP Growth, founders, PE operating partners) in the US, UK, India, Middle East, Singapore/SEA and Australia — legally, cheaply and at quality.

> **How to read the prices.** Most prices below were read from third-party pricing write-ups dated between June and October 2026. Many of those pages are published by competitors, which this report flags where it matters. Vendors re-price often (Clay changed its whole model in March 2026), so **check every price on the vendor's own pricing page before you buy**. Items marked **[unverified]** are from memory or a single weak source.

---

## 0. TL;DR — the recommendations in one page

1. **Do not scrape LinkedIn with your own account, and do not build the app on LinkedIn scrapers.** LinkedIn sued Proxycurl in January 2025. Proxycurl shut down on 4 July 2025. LinkedIn removed Apollo's and Seamless.AI's company pages in March 2025, updated its User Agreement on 3 Nov 2025 to name crawlers, plug-ins and bots, and restricted many automation users in Q1 2026 (one vendor estimate: about 40% of HeyReach/Expandi/Dripify/Waalaxy accounts got some restriction). Use LinkedIn **manually**, with the app preparing a task queue for you to work through.
2. **Build signal-first, not list-first.** For a market-entry consultancy, the best leads come from **events**: a foreign company incorporating a local subsidiary, a "Country Manager India" or "Head of US Expansion" job post, a funding round, new hreflang or ccTLD pages on a company's website, trade-show exhibitor lists, PE acquisitions, and tariff changes. Most of these come **free** from public registries (Companies House, SEC EDGAR, MCA via data.gov.in, ACRA via data.gov.sg, ASIC via data.gov.au), GDELT (free news), certificate-transparency logs (crt.sh) and cheap job-posting APIs (TheirStack from $49/mo).
3. **Contact data:** Apollo (free to $79 per seat per month) is the cheapest broad people database with an API. Its People API Search uses no credits, and enrichment costs 1 credit per email and 8 per phone. Add **one** strong email finder (Findymail from $49/mo or Prospeo from $39/mo; Icypeas or Enrow from about $15–19/mo if cost matters most). Add **one** cheap verifier (Reoon about $1.2 per 1k, MillionVerifier $1.5–3.9 per 1k). For risky catch-alls, use Findymail's catch-all validation or exclude them.
4. **Sending:** Buy 2–10 lookalike secondary domains, put 2–3 Google Workspace or Microsoft mailboxes on each, set up SPF, DKIM and DMARC, warm them for 3–4 weeks, then send **at most about 30 cold emails per mailbox per day**. Send through Instantly or Smartlead, called from your app through their APIs and webhooks. Do **not** cold-send through Resend, Postmark or SES, whose terms forbid unsolicited mail.
5. **Compliance:** the US (CAN-SPAM) and UK corporate subscribers (PECR, plus UK GDPR legitimate interests) allow B2B cold email if you identify yourself, offer an easy opt-out and keep records. Canada (CASL) and Australia (Spam Act) need "conspicuous publication" implied consent. Singapore largely excludes business contact information from the PDPA. In the UAE, the federal PDPL is in force but its Executive Regulations are still not issued; DIFC and ADGM have GDPR-like rules. In India, the DPDP Rules were notified on 13 Nov 2025 and the main duties start about **13 May 2027**. A January 2026 proposal to shorten this to 12 months had **not** been notified as of Sept 2026. Since 5 Feb 2026, UK PECR fines can reach **£17.5m or 4% of turnover**.
6. **Expected results** (signal-based, C-suite, email plus manual LinkedIn): about **0.5–1.5 meetings per 100 contacts** from email alone, and **1–2.5 per 100** with multiple channels. Benchmarks: Instantly's 2026 average reply rate is 3.43%, the top quartile is 5.5% or more, and the top 10% is 10.7% or more. In Belkins' LinkedIn data, C-level executives reply 7.0% of the time.
7. **Three stacks** (section 8): **Bootstrap about $75–100/mo** (about 400–500 contacts and 2–6 meetings a month). **Serious about $450–600/mo** (about 1,500 contacts and 8–20 meetings). **Scale about $1,600–2,500/mo** (about 4,000–5,000 contacts plus multiple channels and 25–60 meetings). Qualified meetings run about 50–60% of booked meetings.

---

## 1. Data sources and tools — pricing, APIs, coverage

### 1.1 Contact and people databases

| Tool | URL | Price (Oct 2026) | Free tier | API | Strengths | Weaknesses / risks |
|---|---|---|---|---|---|---|
| **Apollo.io** | https://www.apollo.io/pricing | Basic $49/seat/mo annual ($65 monthly), 2,500 credits/mo; Professional $79 ($99), 4,000 credits/mo; Organization $119/seat annual-only, **3-seat minimum** | 75 credits/seat/mo, 2 sequences, 250 sends/day, API at the lowest rate limits | REST, `X-Api-Key`. All plans have API. Rate limits: Free 50/min and 600/day; paid 1,000/min enrichment, 50,000/day search, 2,000/day general (6,000 on Organization) | Largest cheap B2B database (~210M+ contacts claimed). People API Search uses **no credits**. Organization job postings endpoint. Credits: 1 per email, 8 per mobile | Email accuracy mid-tier (one benchmark: 81.3% accuracy, 88.2% coverage). Weaker in India and the Middle East for mobiles. Self-serve terms are for internal use only. LinkedIn removed Apollo's company page in March 2025; it was back by July 2026 |
| **Clay** | https://www.clay.com/pricing | Since **11 Mar 2026**: Free; Launch from $185/mo ($167 annual), 15k Actions plus 2,500 Data Credits; Growth from $495/mo ($446 annual), 40k Actions plus 6,000 Data Credits; Enterprise custom | 500 Actions plus 100 Data Credits/mo, 200 rows per table | **HTTP API and webhooks only on Growth and above.** A developer platform (API/CLI) exists on all plans, with smaller caps | 100+ provider waterfall, Claygent research agent, bring-your-own keys | Expensive for a solo founder. Overlaps heavily with what your own app plus Claude does. Legacy plans (Starter/Explorer/Pro) close on any change after 10 Apr 2026 |
| **Lusha** | https://www.lusha.com/pricing | Pro about $52/mo annual (7,200 credits/yr, 2 seats); Premium about $300/mo annual (40,800 credits/yr, 5 seats); Scale custom. Prices move with a credit slider **[verify]** | 40 credits/mo | REST v3 `https://api.lusha.com/v3/`, `api_key` header, Pro and above. Endpoints for prospecting, enrich, signals, lookalikes and **webhooks (job changes)**. 429 on limits | Good US/EU direct dials. Job-change webhooks | Per-seat pricing. Credit model is opaque. Weak in India and the Middle East |
| **Kaspr** (Cognism-owned) | https://www.kaspr.io/pricing | Starter $49/user/mo annual ($65 monthly); Business $79 ($99) | 15 email, 5 phone and 5 direct-email credits/mo | Starter: 20 requests/hour and 60/day; Business: 250/hour and 500/day | EU/UK phones (Cognism data), unlimited B2B emails on paid plans | Chrome-extension model on LinkedIn (ToS exposure). **CNIL fined Kaspr €240,000 (Dec 2024)** for collecting LinkedIn contact data unlawfully **[from memory; verify]** |
| **Cognism** | https://www.cognism.com/pricing | Quote only. Grow about $15k platform fee plus about $1.5k/user/yr; Elevate about $25k plus about $2.5k/user/yr (procurement estimates) | 25-lead trial via sales call | Enterprise API | Best UK/EMEA phone-verified mobiles ("Diamond Data"), DNC screening in 15+ countries | About $16.5k/yr minimum. Overkill for a solo founder |
| **ZoomInfo** (reference) | https://www.zoominfo.com | About $15k–45k+/yr, annual contracts | No | Enterprise API | Deepest US data, intent and technographics | Price; long contracts |
| **RocketReach** | https://rocketreach.co/pricing | Essentials $33/seat/mo, Pro $75, Ultimate $142 (annual); Custom Team from about $6k/yr | 5 one-time lookups | API on paid plans; higher limits only on Custom | Good exec emails, refunds lookups with no verified result | Per-seat price; low API limits on self-serve plans |
| **People Data Labs** | https://www.peopledatalabs.com/pricing | Self-serve about $98/mo ($940/yr) for about 350 credits (~$0.28/credit); bulk by quote | 100 credits/mo, **no contact data** | REST v5, `X-Api-Key`; person/company enrich and search (SQL or Elasticsearch syntax) **[endpoint names from memory; verify]** | 1.5B person profiles, good for firmographics and job-change detection | Expensive per contact at low volume. You inherit licensing obligations; track the source of every record |
| **Coresignal** | https://coresignal.com/pricing | Mini $49 (2,500 credits); Starter $199 (12k); Pro $499 (35k); Growth $1,000 (150k); Premium $1,500 (1M) | 7-day trial, 2,000 credits | REST, `apikey` header. **Search with Elasticsearch DSL is free.** Collect: 10 credits per base employee/company record, **1 credit per job post** | 895M employee and 468M job records, historical headcount (expansion signal) | Profile data originates from public web and LinkedIn-type sources. Contact enrichment only on Pro and above |
| **Bright Data** | https://brightdata.com/pricing | LinkedIn Web Scraper API: pay-as-you-go **$1.50 per 1k records**; Scale $499/mo; datasets from $250 per 100k records | 5,000 records/mo free tier (per a third-party write-up) **[verify]** | Trigger API plus webhook delivery, Bearer token | Logged-out public-data collection. Won *Meta v. Bright Data* (2024) on contract claims for logged-out scraping | You still carry the GDPR, UK GDPR and DPDP processing risk for personal data |
| **Hunter.io** | https://hunter.io/pricing | Starter €34/mo annual (24k credits/yr); Growth €104 (120k/yr); Scale €209 (300k/yr) | 50 credits/mo | REST v2, `X-API-KEY`. `/domain-search`, `/email-finder` (15 req/s), `/email-verifier` (10 req/s), `/discover` (free, 5 req/s), `/combined/find`. A `test-api-key` returns dummy data | Excellent API and docs. Verification costs 0.5 credit. Unknowns are free | Lower find rate on execs (one benchmark: 281 found per 1k leads). No phones |
| **Snov.io** | https://snov.io/pricing | Starter $39/mo ($29.25 annual), 1k credits, 5k recipients; Pro S $99, 5k credits; Pro M $189, 20k | Trial with 50 credits and 100 recipients, renews monthly | REST, OAuth client-credentials. Benchmark mentions about 200 req/hour **[verify]** | All-in-one: finder, verifier, sequences, warm-up, LinkedIn add-on ($69/mo) | Lower verified rate in third-party benchmarks |

**Other finders worth knowing** (cheap and API-first): **Findymail** (https://www.findymail.com/pricing): Basic $49/mo for 1k, Starter $99 for 5k, Business $249 for 15k. Each plan includes the same number of free verifier credits. Catch-all validation is included, there is a refund if bounces exceed 5%, mobiles cost 10 credits, and credits roll over up to 2× the monthly amount. **Prospeo** (https://prospeo.io/pricing): from $39/mo for 1k credits, 75 free per month, about $10 per 1k at volume (vendor claim). **Icypeas** (https://www.icypeas.com/pricing): $19/mo for 1k credits, about $5 per 1k at 100k, catch-all included. **Enrow**: €15/mo for 1k credits, 50 free. **Anymailfinder**: $29/mo for 400 credits and bills only deliverable addresses. **LeadMagic, BetterContact, FullEnrich**: waterfall aggregators (not priced here — **[unverified]**).

### 1.2 Company, funding and private-market databases

| Tool | URL | Price | API | Use for Upforge |
|---|---|---|---|---|
| **Crunchbase** | https://www.crunchbase.com/pricing | Pro about $49/user/mo annual; Business about $199. The **API needs an Enterprise licence** (median about $20k/yr, some $50k+). The **free Basic API was discontinued** | v4 REST `https://api.crunchbase.com/v4`, header `X-cb-user-key`, 200 calls/min | Funding rounds and acquisitions. Without an API budget, use the Pro UI manually plus SEC Form D, GDELT and press for funding events |
| **Tracxn** | https://tracxn.com | From about $500/mo, usage-based (Capterra) | API exists; terms by quote | Strong in India and emerging markets for startups. Optional |
| **PitchBook** (reference) | https://pitchbook.com | About $12k+/seat/yr | Enterprise | PE deals and portfolio companies; too expensive at this stage |
| **Dealroom** | https://dealroom.co | Quote | Yes | Strong in Europe; alternative to Crunchbase |

### 1.3 LinkedIn ecosystem

| Item | Facts (2026) |
|---|---|
| **Sales Navigator** (https://business.linkedin.com/sales-solutions/compare-plans) | Core $119.99/mo or $89.99/mo annual; Advanced $159.99/mo or $149.99/mo annual; Advanced Plus by quote. **50 InMails/mo.** 2,500 visible results per search. **Bulk export is not allowed**, and exporting through third-party tools breaks the User Agreement |
| **SNAP (Sales Navigator Application Platform)** | Reported closed to **new partners**. There is no legitimate API path for a solo founder's custom app |
| **User Agreement (effective 3 Nov 2025)** | Names crawlers, browser plug-ins and bots as prohibited for scraping or copying |
| **Enforcement history** | hiQ: settled Dec 2022 with an injunction, data deletion and $500k. Proxycurl: sued Jan 2025, settled, **shut down 4 Jul 2025**, relaunched as "Enrich Layer". Apollo and Seamless pages removed Mar 2025. HeyReach company page removed and executives restricted on **25 Mar 2026**. "BrowserGate" (Apr 2026) showed LinkedIn scanning for about 6,000 extensions plus device fingerprinting |
| **PhantomBuster** (https://phantombuster.com/pricing) | Start $69/mo ($56 annual), 5 slots, 20 h; Grow $159 ($128), 15 slots, 80 h; Scale $439 ($352). LinkedIn Phantoms run with **your session cookie**, which is the riskiest pattern |
| **Apify LinkedIn actors** (https://apify.com/harvestapi) | Apify platform: Free (includes $5 usage), Starter $29, Scale $199, Business $999. "No-cookie" actors: harvestapi profile $4 per 1k, profile plus email $10 per 1k, company employees $3–12 per 1k; jobs from $0.28–0.40 per 1k. No-cookie actors do not touch your account, but the data is still personal data scraped against LinkedIn's terms |
| **Unipile** (https://www.unipile.com/pricing) | €49/mo for up to 10 connected accounts, then €5/account. Unofficial API that drives your LinkedIn session (invites, messages). Gives you an "API" for your app, but carries the same account-ban risk as any automation tool |
| **Proxycurl** | **Dead (4 Jul 2025).** Do not build on any "Proxycurl clone" that relies on fake accounts |

### 1.4 Web search, crawling and AI-research APIs (the "research the lead" layer)

| Tool | URL | Price per 1k (Sept 2026) | Free | Notes for the app |
|---|---|---|---|---|
| **Exa** | https://exa.ai/pricing | Search $7 per 1k (up to 10 results; +$1 per 1k for each extra result); contents $1 per 1k pages; answer $5 per 1k; deep research $12–15 per 1k; Websets (bulk/continuous, webhooks) priced separately **[verify]** | $20 sign-up credit plus $10/mo, 10 QPS | `POST https://api.exa.ai/search`, Bearer or `x-api-key`. `category: "people"` (1B+ people indexed) and `"company"`, `"news"`. Best for "find companies like X" and "find the Head of International at Y" |
| **Firecrawl** | https://www.firecrawl.dev/pricing | Search about $1.66 per 1k (Standard); scrape 1 credit per page | 1,000 credits/mo (one-time on some plans **[verify]**) | `/scrape`, `/crawl`, `/extract` (structured JSON), `/search`; Bearer; crawl webhooks. Use it to read company sites, careers pages, press rooms and exhibitor lists |
| **Tavily** | https://tavily.com | $8 per 1k basic, $16 advanced | 1,000 credits/mo | Agent-friendly search plus extract |
| **Serper** | https://serper.dev | About $1 per 1k (down to about $0.30 prepaid at volume) | 2,500 one-time | Google SERP JSON (`POST https://google.serper.dev/search`, `X-API-KEY`). Cheapest Google results, including `/news` and `/places` |
| **SerpAPI** | https://serpapi.com/pricing | $15–25 per 1k; plans from $25/mo | 250/mo | Google Jobs engine, a useful hiring-signal source |
| **Brave Search API** | https://brave.com/search/api | $5 per 1k | $5/mo credit (card required; free plan removed Feb 2026) | Independent index |
| **Google Custom Search** | — | Closed to new customers; existing users must leave by 1 Jan 2027 | — | Do not use |
| **Octoparse** | https://www.octoparse.com/pricing | Standard $75/mo ($60 annual); Professional $209 ($167), API only on Professional | 2 local tasks | No-code; redundant if you build with Firecrawl or Apify |
| **Google Maps Places API (New)** | https://developers.google.com/maps/billing-and-pricing/pricing | Text Search Pro $32 per 1k (5k free/mo); Text Search Enterprise (phone, website, hours) $35 per 1k (1k free/mo); Place Details Essentials $5 per 1k (10k free) | Per-SKU free caps (the old $200 credit is gone) | `POST https://places.googleapis.com/v1/places:searchText` with `X-Goog-FieldMask`. Maps terms limit caching (place IDs may be stored; most other content may only be cached briefly **[verify current terms]**). Useful only for retail, F&B and clinic chains (for example, spotting a brand's first location in a new city) |

### 1.5 Public registries (free; best "market-entry" signals)

| Registry | Access | What to pull | Signal |
|---|---|---|---|
| **UK Companies House** | REST `https://api.company-information.service.gov.uk` (HTTP Basic, API key as username); **600 requests per 5 min**; Streaming API `https://stream.companieshouse.gov.uk` (companies, officers, PSC, filings) | Advanced search: `/advanced-search/companies?incorporated_from=…&incorporated_to=…&sic_codes=…`; `/company/{no}/officers`; `/company/{no}/persons-with-significant-control` | **A new UK company whose PSC is a foreign corporate body** means a foreign company entering the UK. Its directors' names are your contacts (officer data is public). Also: new overseas-entity registrations and charges registered (financing) |
| **US SEC EDGAR** | `https://data.sec.gov/submissions/CIK##########.json`, full-text search `https://efts.sec.gov/LATEST/search-index?q=…`; **10 req/s; a User-Agent with your email is required** | Form D (private raises, with named executive officers), 8-K Item 1.01/2.01 (acquisitions), S-1, 10-K text mentioning "expand into India/UK/Middle East" | Funding, M&A, explicit expansion intent in filings |
| **India MCA** | No official public API. The OGD dataset "Company Master Data" on https://data.gov.in (free API key) has `registration_date`, `company_class`, `subcategory`, `indian_or_foreign`, NIC code. Paid aggregators: Probe42, Tofler, Zauba **[pricing unverified]**. An Apify OGD wrapper costs $0.05–0.20/record | Filter `subcategory = "Subsidiary of Foreign Company"` and `registration_date` in the last 30–90 days. Also look for foreign-company (FCRN) branch or liaison offices | **The strongest India-entry signal.** Find the parent company, then reach the parent's international lead or CEO |
| **Singapore ACRA** | data.gov.sg collection "ACRA Information on Corporate Entities", **monthly** CSV plus API v2 (`api-production.data.gov.sg`); an API key gives higher limits | New entities by registration date, SSIC code | New SG entities of foreign groups (SEA hubs) |
| **Australia ASIC** | data.gov.au "ASIC Company Dataset" (weekly CSV) **[frequency from memory; verify]**; ABN Lookup web services (free GUID) | New registrations, "Registered foreign company" (ARBN) type | **Foreign companies registering an ARBN** means an Australia entry |
| **UAE** | No unified free federal API. The DIFC and ADGM public registers are searchable online; mainland registries are fragmented | Scrape DIFC/ADGM new registrations (check each site's terms) | New Middle East holdings and regional HQs |
| **OpenCorporates** | https://opencorporates.com (API is paid for commercial use) | Cross-jurisdiction lookups | Maps parent to subsidiary |

### 1.6 Job postings (hiring intent)

| Source | Price | Notes |
|---|---|---|
| **TheirStack** (https://theirstack.com/pricing) | Free 200 credits/mo; API $49 for 1.5k credits, $100 for 5k, $169 for 10k, $400 for 50k; 1 credit per job, 3 per company; **webhooks** (which also use credits) | 180M+ jobs from 325k sources, about 297k new per day. Filter by job title pattern, job country and company country, so you can find **companies hiring in a country other than their HQ country** |
| **Coresignal Jobs API** | 1 credit per job post (about $0.005–0.02) | Historical archive back to 2020 |
| **Apify LinkedIn Jobs actors** | $0.28–5 per 1k | Public job pages; the cheapest option |
| **SerpAPI Google Jobs** | $15–25 per 1k searches | Aggregates boards |
| **Apollo `organization job postings`** | Uses credits per page | Convenient when you already have the org ID |
| **Company careers pages via Firecrawl** | About $1–2 per 1k pages | Watch the target account list weekly and diff the results |

### 1.7 News and press

| API | Price | Notes |
|---|---|---|
| **GDELT DOC 2.0** (https://api.gdeltproject.org/api/v2/doc/doc) | **Free**, no key | Global news in 65+ languages, near real time. Query phrases like `"expand into India"`, `"first office in Dubai"`, `"enter the UK market"`. Best free option |
| **GNews** | Free 100/day (non-commercial, 12 h delay); Essential €49.99/mo for 1k/day | Cheap paid tier |
| **NewsAPI.org** | Free is dev-only; Business **$449/mo** | Too expensive |
| **NewsData.io** | Free 200 credits/day; Basic $199.99/mo | Commercial use allowed |
| **Event Registry (newsapi.ai)** | 2,000 free tokens; from $90/mo | Good entity and event extraction |
| **Serper `/news`** | About $1 per 1k | Google News via a SERP API; cheapest "news about company X" lookup |

### 1.8 Trade data (import/export intent)

| Source | Price | Coverage / use |
|---|---|---|
| **ImportYeti** (https://www.importyeti.com) | Free or freemium | US bills of lading only. Find foreign exporters already shipping into the US (prospects for US go-to-market) and US importers exposed to tariffs |
| **Volza** | About $120–700/mo (sources conflict); API only on Enterprise | 203 countries; strong for India, the US, LatAm and Vietnam |
| **Panjiva (S&P)** / **ImportGenius** | Four-figure monthly minimums / about Volza Business price | Enterprise grade |
| **UN Comtrade API** (https://comtradeplus.un.org) | Free tier **[verify limits]** | Country-by-HS-code flows; supports market sizing, not individual leads |
| **UK Trade Tariff API**, **US Federal Register API** (https://www.federalregister.gov/developers) | Free | Detect tariff and regulatory changes by HS code (see section 2) |

### 1.9 Events and conferences

- **Do not buy attendee lists.** Bought lists usually lack a lawful basis under UK/EU GDPR and CASL. Vendors that email "attendee list for sale" are mostly fraudulent.
- **Do** scrape **public exhibitor and speaker pages** (Firecrawl `/extract` with a schema of company, country, booth and pavilion). Good events for market entry: GITEX and Gulfood (Dubai), Arab Health (now WHX), LEAP (Riyadh), Money20/20, Web Summit and Collision, SaaStr, NRF, CES, India's Global Fintech Fest and Nasscom events, Singapore FinTech Festival, London Tech Week, and SXSW Sydney. **"Country pavilions"** (for example, "UK Pavilion at Gulfood") are lists of companies actively exploring that market, the ideal ICP.
- Speakers with titles such as "Head of International" are prime contacts.

---

## 2. Intent signals for market-entry buyers — and how to detect each one programmatically

| # | Signal | Why it means demand for market-entry help | Detection method (free first) | Lead to contact | Suggested score weight |
|---|---|---|---|---|---|
| 1 | **New-market leadership job post** ("Country Manager India", "Head of US Expansion", "GM MENA", "Launch Lead UK", "first hire in Singapore") | They have decided to enter but are early, with no team in place | TheirStack: `job_title_or` pattern list, `job_country_code_or=[IN,AE,SA,GB,US,SG,AU]`, and `company_country_code` ≠ job country; webhook for new matches. Free fallback: Apify LinkedIn Jobs actor or a SerpAPI Google Jobs query `"country manager" India` | Hiring manager: CEO, COO, CSO or VP International (often named in the post or found via Apollo) | 30 |
| 2 | **New foreign subsidiary, branch or overseas entity** | Legal entity formed, so market entry is under way | Companies House stream (new company plus foreign corporate PSC); MCA OGD `Subsidiary of Foreign Company`; ACRA monthly; ASIC ARBN; SEC Form D or 10-K subsidiaries exhibit (Ex-21) diff | Parent's CEO, CFO and Head of International; local directors | 30 |
| 3 | **Funding round** (Series B or later, growth equity) | Capital is often earmarked for "international expansion" | SEC Form D (US); GDELT and Serper news query `"raises" AND ("expand" OR "international")`; Crunchbase Pro UI; Tracxn (India) | CEO, CFO, COO | 20 (+10 if the release mentions expansion) |
| 4 | **Press about international expansion** | Stated intent | GDELT DOC API with phrase list × target countries; Exa `category: news`; Claude classifies whether it is a real expansion, which country, which stage | Spokesperson quoted, CEO | 25 |
| 5 | **Website localisation or new ccTLD** | Product and marketing are being prepared for a new market | (a) Fetch the homepage weekly and parse `<link rel="alternate" hreflang="…">`; flag new `en-IN`, `en-AE`, `ar`, `en-GB`, `en-AU` and `en-SG` entries. (b) **Certificate-transparency logs**: `https://crt.sh/?q=%25.brand.com&output=json`, new subdomains like `in.`, `uk.`, `ae.`. (c) DNS lookups for `brand.co.uk`, `brand.in`, `brand.ae`, `brand.com.au`, `brand.sg` that newly resolve | CMO, VP Growth, Head of International | 15 |
| 6 | **New store, office or plant opening** | Physical entry | GDELT/Serper news `"opens first" store/office` + city; Google Places Text Search for the brand name in a new city (retail and F&B); LinkedIn company page "locations" (manual) | COO, Head of Expansion or Real Estate | 20 |
| 7 | **Trade-show exhibitor in a foreign market or country pavilion** | Exploring a market | Firecrawl `/extract` on exhibitor directories, keeping exhibitors whose HQ country ≠ event country | CEO or founder (SMB), Head of International | 15 |
| 8 | **PE acquisition or new platform investment** | A 100-day plan often includes new markets and pricing or ops work, and operating partners buy research | GDELT/Serper `"acquired by" + PE firm list`; SEC 8-K; Companies House PSC change to a fund; scrape PE portfolio pages monthly and diff | PE operating partner, portfolio-company CEO and CFO | 20 |
| 9 | **Executive hire or job change** (new CSO, new Head of International, new CEO) | New leaders buy strategy work within 90 days | Sales Navigator "Changed jobs in past 90 days" (manual); Lusha job-change webhooks; PDL or Coresignal diffs; Apollo `person.employment_history` diffs | The new executive | 20 |
| 10 | **Tariff or regulatory change** affecting their HS codes or sector (US tariffs, UK–India FTA, India's DPDP or e-commerce FDI rules, Saudi RHQ rule, GCC rules) | Forces diversification or entry decisions | Federal Register API (tariff notices), UK Trade Tariff API, India DGFT notifications (scrape), WTO/Global Trade Alert; map HS codes to importers via ImportYeti or Volza | CFO, COO, Head of Supply Chain | 10–20 (time-boxed) |
| 11 | **Headcount growth in a new geography** | Ramp-up | Coresignal historical headcount by location; Sales Navigator account filter "Department headcount growth" (manual) | COO, VP International | 10 |
| 12 | **Government investment-promotion announcements** (Invest India, DIT/DBT UK, Dubai FDI, EDB Singapore, Austrade press releases naming companies) | Already engaged with an agency | Firecrawl the press-release pages weekly | CEO | 15 |

**Signal-combination rule (for the app):** compute `intent_score = Σ(weight × recency_decay)`, using a recency decay half-life of about 45 days. Only prospect accounts that score ≥ 40, or that have one "hard" signal (1 or 2), plus fit (revenue $10M–1B, size 50–5,000, the right sector). Store the **raw evidence URL** for every signal; it drives personalisation ("Saw you're hiring a Country Manager for India…").

---

## 3. Email finding and verification

### 3.1 Finders — price per 1,000 found emails (derived from list prices)

| Tool | Entry plan | ≈ $ per 1k found | Charged on no-find? | Catch-all policy | API |
|---|---|---|---|---|---|
| **Icypeas** | $19/mo, 1k | ≈ $19 (≈ $5 at 100k) | No | Catch-all checks on all tiers | REST |
| **Enrow** | €15/mo, 1k | ≈ €15 | No | Catch-all verification uses credits | REST |
| **Prospeo** | $39/mo, 1k | $39 → ≈ $10 at volume | No | Not stated | `POST https://api.prospeo.io/...`; vendor claims 98% accuracy and a 7-day refresh **[verify current endpoint names]** |
| **Hunter** | €34/mo annual, 2k/mo | ≈ €17 | No | "Accept-all" returned with a confidence score | Excellent |
| **Findymail** | $49/mo, 1k; $99, 5k | ≈ $20–49 | No | **Validates catch-alls** (proprietary); refund if bounces exceed 5% | REST, bearer token **[verify webhook option]** |
| **Apollo** | $49/seat/mo, 2.5k | ≈ $20 | Bounced reveals refunded within 30 days | Catch-alls charged only if toggled on | REST |
| **Snov.io** | $29–39/mo, 1k | ≈ $29–39 | Charges for "unknown" | — | REST |
| **Anymailfinder** | $29/mo, 400 | ≈ $70 | Bills only deliverable addresses | — | REST |

Benchmarks are all vendor-run or vendor-published, so treat them as directional. Findymail had a 1.1% hard bounce rate in a 20k test. Hunter found 281 per 1k leads, Findymail 492 and Anymailfinder 476 (Prospeo-published benchmark).

### 3.2 Verifiers — price per 1,000 verifications (snapshot 2 Sept 2026)

| Verifier | @10k | @100k | Free | Unknown/catch-all billing |
|---|---|---|---|---|
| **Reoon** (https://www.reoon.com/email-verifier/) | $1.19 | $1.16 | **20/day, up to 600/mo** | Unknowns free; "Power mode" does deeper SMTP and catch-all detection |
| **MillionVerifier** (https://www.millionverifier.com) | $3.90 | $1.49 | $4.90 trial for 2k | Catch-all and unknown not charged; refund if hard bounces exceed 4% |
| **NeverBounce** | $5.00 | $4.00 | — | Labels catch-alls, does not resolve them |
| **Bouncer** | $6.00 | $4.00 | — | Unknowns free; has a "deliverability kit" |
| **Emailable** | $6.00 | $4.20 | — | Unknowns refunded |
| **Kickbox** | $7.00 | $5.00 | — | Unknowns free |
| **ZeroBounce** | $12.90 | $6.49 | — | Catch-all scoring costs extra; most "enterprise" brand |

### 3.3 Recommended verification pipeline (for the app)

```
person(first, last, company_domain)
 ├─ 1. Has email from Apollo/finder with status "verified"? → re-verify with Reoon (power) if > 30 days old
 ├─ 2. Else → Finder #1 (Findymail or Prospeo) → if found & "valid" → accept
 ├─ 3. Else → Finder #2 (Hunter/Icypeas) [optional waterfall]
 ├─ 4. Else → Permutation generator:
 │      first.last@, first@, flast@, firstl@, first_last@, last@, f.last@  (+ pattern learned from Hunter domain-search "pattern" field)
 │      → MX check (skip if no MX) → catch-all probe (random string @domain)
 │         - Domain NOT catch-all → SMTP-verify each permutation via Reoon/MillionVerifier → first "valid" wins
 │         - Domain IS catch-all → do NOT guess; send to Findymail catch-all validation or mark `risky_catch_all`
 └─ 5. Status taxonomy: valid | valid_catchall_validated | risky_catch_all | unknown | invalid | role_based | disposable
```

**Sending policy:** send only `valid` and `valid_catchall_validated`. Put `risky_catch_all` in a separate low-volume campaign with a cap of 10% of daily volume and its own domain, or skip it. Keep hard bounces under 1% and total bounces under 2%. Re-verify anything older than 60–90 days, because B2B lists decay about 22–28% a year.

**Do not run your own raw SMTP "RCPT TO" probes from your server IP.** You will get the IP blocklisted, and Microsoft and Google tenants increasingly return false positives. Use a verifier API.

---

## 4. Deliverability infrastructure

### 4.1 Rules that changed in 2024–2026

- **Gmail/Yahoo bulk-sender rules** (Feb 2024; Gmail enforcement with temporary and permanent **rejections from Nov 2025**): SPF **and** DKIM, aligned DMARC (**p=none is the official minimum**), TLS, valid PTR and HELO, spam rate **< 0.3%** (target < 0.1%), and RFC 8058 one-click unsubscribe for bulk/marketing mail (above 5,000/day to Gmail). Google Postmaster Tools v2 has a compliance dashboard; the legacy domain and IP reputation dashboards are being retired.
- **Microsoft Outlook.com/Hotmail/Live** (from **5 May 2025**, senders above 5,000/day): SPF pass, DKIM, DMARC at least p=none aligned. Non-compliant mail gets `550 5.7.515 Access denied, sending domain … does not meet the required authentication level`.
- **Some vendor blogs claim p=none "no longer satisfies" the rules.** That is **not** what Google's or Microsoft's published rules say. p=none is acceptable, though moving to `p=quarantine` once the domain is stable is good hygiene.
- **DKIM 2048-bit keys** are recommended. Keep SPF under 10 DNS lookups.

### 4.2 Architecture for a solo founder

| Component | Recommendation |
|---|---|
| **Primary domain** (upforgeconsulting.com) | **Never cold-send from it.** Use it for replies, the website and calendar links |
| **Secondary domains** | Lookalikes such as `upforge-consulting.com`, `getupforge.com`, `upforgeadvisory.com` and `upforgehq.com` (about $10–15/yr each). Redirect each to the main site. Set up SPF, DKIM, DMARC (p=none, then quarantine) and a custom tracking domain, or **turn open tracking off** (recommended for C-suite) |
| **Mailboxes per domain** | 2–3 for Google Workspace or Microsoft 365 (mailbox resellers may put more on one domain; do not exceed 3–5) |
| **Sends per mailbox per day** | Warm-up: start at 5–10/day and ramp over 3–4 weeks (Instantly says 4–6). After warm-up: **20–30 cold emails per mailbox per day** (some sources say 50–100, but C-suite domains with strict filters reward low volume). Keep warm-up running in the background |
| **Mailbox type** | **Google Workspace** (about $7–8.40/user/mo direct **[verify current price]**) or **Microsoft 365** (Business Basic about $6/user/mo **[verify]**). Recipient mix matters: many large enterprises and Indian or Middle Eastern firms run on Microsoft, US startups on Google. Use a **mix** (for example, 60% Google and 40% Microsoft) and route by the recipient's MX record ("ESP matching", which Instantly and Smartlead support) |
| **Reseller "cold email infrastructure"** | Cheaper per mailbox but on shared tenants: **Zapmail** $39/mo for 10 mailboxes in year one (then $59), $99 for 30, $299 for 100; **Maildoso** about $1.90–2.25/inbox; **MailDeck** Google Workspace $2.50–3.00/inbox or Outlook $30 per tenant; **Infraforge** about $4/mailbox (private infrastructure); **Primeforge** about $4.50 (Google + Microsoft); **Mailreef** about $3–5/inbox (**sources disagree on whether it is Google Workspace reseller or private SMTP — verify**); **Premium Inboxes** $2.80–3.50. Pre-warmed mailboxes (for example, Getlead) cost about $9–13 each. **Recommendation:** start with **direct Google Workspace and Microsoft 365** (5–10 mailboxes); only buy reseller infrastructure at stack (c) |
| **Inbox rotation** | The sending platform rotates leads across mailboxes. In the app, keep `sender_mailbox_id` per lead so follow-ups come from the same mailbox |
| **Monitoring** | Google Postmaster Tools v2, Microsoft SNDS, DMARC aggregate reports (free tier at dmarcian, Postmark DMARC or EasyDMARC), and blocklist checks |

### 4.3 Sending platforms

| Platform | Price | API / webhooks | Notes |
|---|---|---|---|
| **Instantly** (https://instantly.ai/pricing) | Outreach Growth $47/mo (~$37.60 annual): 1k active leads, 5k emails/mo, **unlimited mailboxes and warm-up**, basic API, **no webhooks**. **Hypergrowth $97**: 25k leads, 100k emails, **webhooks**. Light Speed $358. Lead database and CRM modules sold separately | **API v2** (v1 deprecated 19 Jan 2026), Bearer API keys with scopes. Webhook events: `email_sent`, `email_opened`, `reply_received`, `auto_reply_received`, `link_clicked`, `email_bounced`, `lead_unsubscribed`, `lead_interested`, `lead_not_interested`, `lead_meeting_booked`, `lead_out_of_office`, `lead_wrong_person`, `campaign_completed`, `account_error` | Best value; the warm-up network is large. **The default recommendation** |
| **Smartlead** (https://www.smartlead.ai/pricing) | Base $39/mo ($32 annual): 2k contacts, 6k sends; **Pro $94 ($78 annual): 30k contacts, 90k sends, API and webhooks**; Unlimited Smart $174 | `https://server.smartlead.ai/api/v1`, `?api_key=` query parameter (no bearer). Rate limits unpublished. Webhooks for reply, bounce and more. Sources disagree on whether Base includes the API | Strong API for builders; mailbox add-ons $4–9 each |
| **lemlist** | From about $39/mo per user (1 sending mailbox at entry) | API plus webhooks | Strong multichannel (LinkedIn steps), image and video personalisation; costly per sender |
| **Reply.io** | From about $59/mo | API plus webhooks | Multichannel, AI SDR "Jason"; per-seat |
| **Woodpecker** | From about $29/mo (2 mailboxes) | API | Good deliverability safeguards; EU-based |
| **Saleshandy** | From about $25/mo, unlimited mailboxes | API | Cheapest unlimited-mailbox option |
| **Snov.io** | From $29.25/mo annual | API | Finder plus sender in one |

### 4.4 The DIY path (Resend / Postmark / SES + your own warm-up) — why not

- **Terms of service:** Amazon SES, Postmark, Resend, SendGrid and Mailgun all prohibit unsolicited or purchased-list email. Accounts are suspended quickly when bounces exceed about 5% or complaints exceed about 0.1%. Postmark is transactional-only.
- **Shared IP reputation and "ESP fingerprint":** mail from SES or Postmark IPs with cold-email patterns is treated as bulk marketing. To recipients it looks like a newsletter, not a one-to-one note from a founder.
- **No warm-up network:** you would have to build reply-simulation warm-up yourself, which is complex and can itself breach mailbox-provider terms.
- **What DIY can safely do:** **send through the Gmail API or Microsoft Graph from your own Workspace or M365 mailboxes**, so the app becomes the sequencer. That is legitimate, because it sends mail as a real user. But you lose warm-up pools, inbox rotation tooling and deliverability analytics. **Verdict:** use Instantly or Smartlead for sending and keep the brains (sourcing, scoring, copy and reply triage) in your app, linked by API and webhooks.

---

## 5. Compliance by region (practical, not legal advice)

### 5.1 Region-by-region

| Region | Law | Can you cold-email a named executive? | Must-dos |
|---|---|---|---|
| **US** | CAN-SPAM (FTC) | **Yes**, opt-out regime | Accurate From and headers; non-deceptive subject; identify the message as an advertisement or solicitation (clearly; a plain-text one-to-one note usually relies on context — **ask counsel**); **valid physical postal address**; working opt-out honoured **within 10 business days** and functional for 30 days after sending. Penalties exceed **$50k per violating email** (inflation-adjusted). State laws: CCPA/CPRA covers B2B contact data since Jan 2023, but Upforge is likely below its thresholds |
| **UK** | PECR + UK GDPR + **DUAA 2025** | **Yes, to corporate subscribers** (Ltd, LLP, PLC, government) without prior consent. **Sole traders and some partnerships** count as individuals and need consent or soft opt-in | Identify yourself plus a valid opt-out address (PECR reg 23). UK GDPR lawful basis is **legitimate interests**, backed by a written LIA. Give an Art. 14 privacy notice (source of data) at the latest in the first email (a short line plus a link). Objection to direct marketing is **absolute**: suppress forever. **Since 5 Feb 2026, PECR maximum fines are £17.5m or 4% of global turnover** (previously £500k). From 19 Jun 2026 you must acknowledge data-subject complaints within 30 days. DUAA also writes into the law that direct marketing *may* be a legitimate interest **[confirm exact wording with ICO guidance]** |
| **EU (Ireland, Netherlands and others)** | GDPR + national ePrivacy laws | Varies: Ireland and France allow relevant B2B email; **Germany (UWG §7) effectively requires prior consent** | Same LIA approach; exclude Germany and Austria or use LinkedIn/phone only |
| **Canada** | **CASL** | Only with consent. **Implied consent by "conspicuous publication"** works if the address is published without a "no unsolicited email" statement **and** the message is relevant to the person's role | Identification (name, mailing address, plus phone, email or web contact); unsubscribe processed **within 10 business days**. Penalties up to **CAD 10M per violation** for organisations. Keep evidence of where the address was published (URL plus screenshot or date) |
| **Australia** | **Spam Act 2003** + Privacy Act (APP 7) | Only with consent. **Inferred consent via conspicuous publication** (role-relevant, no "no spam" notice) | Accurate sender identity (name, ABN if any, contact details); functional unsubscribe honoured **within 5 business days**. ACMA enforces actively with multi-million-dollar penalties (figures vary by source). Store the publication evidence |
| **Singapore** | PDPA + Spam Control Act + DNC | **Business contact information is excluded** from most PDPA obligations (s.4(5)), so B2B emails to business addresses are largely outside the PDPA. The DNC registry covers **Singapore phone numbers** (calls, SMS), and B2B marketing messages are excluded **[verify the Eighth Schedule wording]** | Spam Control Act: for **bulk** unsolicited commercial email (more than 100 similar messages in 24 h, 1,000 in 30 days or 10,000 in a year **[verify thresholds]**) include an unsubscribe facility, accurate headers and the **"<ADV>" label** in the subject. A solo founder's volume to Singapore recipients usually stays under the bulk thresholds; include an opt-out regardless |
| **UAE** | Federal PDPL (Decree-Law 45/2021) + **DIFC DP Law 2020** + **ADGM DPR 2021** + telemarketing rules | Federal PDPL is **in force but the Executive Regulations are still not issued** (Oct 2026), and the default is consent with exceptions. DIFC and ADGM are GDPR-like (legitimate interests possible) | Keep volumes low and highly relevant; honour opt-outs; keep source records. **Phone:** Cabinet Resolution No. 56 of 2024 on telemarketing restricts marketing calls (licensed numbers, set hours, DNCR) **[from memory; verify]**, so avoid cold calling UAE mobiles |
| **India** | **DPDP Act 2023 + DPDP Rules 2025** (notified **13 Nov 2025**) | Now: the Act's substantive duties are **not yet in force**. Consent-manager rules start about **13 Nov 2026**. **Notice, consent, rights and breach duties start about 13 May 2027.** MeitY proposed shortening this to 12 months in Jan 2026 (feedback closed 4 Feb 2026), but **no amending notification was found as of Sept 2026; watch the Gazette.** DPDP has **no general legitimate-interest basis**. Section 3(c)(ii) excludes personal data *made publicly available by the data principal themselves* (debated cover for business emails a person published) | From May 2027: assume consent is needed for marketing to Indian individuals unless the public-data exclusion clearly applies. Minimise data, give a clear notice, honour withdrawal, and delete when the purpose ends. Penalties up to ₹250 crore (security) or ₹200 crore. **Phone/SMS:** TRAI TCCCPR rules govern commercial calls and SMS (registered headers, DND), so do not cold call Indian mobiles for marketing. The Data Protection Board had no members appointed as of Sept 2026 |

### 5.2 Operational rules to build into the app

1. **Suppression list (global, permanent):** store `sha256(lower(email))`, `domain` (for "remove our whole company"), `linkedin_url_hash`, `reason` (unsubscribe, objection, bounce, complaint, manual), `source_event` and `timestamp`. Check it **before** enrichment spend and **before** every send. Keeping a minimal hashed suppression record is the standard approach to honouring an objection.
2. **Opt-out handling:** every email carries a plain-text line such as "If this isn't relevant, reply 'no' and I won't contact you again," plus a `List-Unsubscribe` header (the platform handles it). Use Claude to classify replies like "not interested", "remove", "stop" or "unsubscribe" and suppress **within 24 h** (stricter than the legal 5–10 business days).
3. **Data retention:** delete or anonymise prospect records with **no engagement after 12 months** (or 6 months for EU/UK individuals if you want to be conservative). Keep suppression hashes indefinitely and engaged contacts for as long as the relationship lasts.
4. **Provenance per field:** `email_source` (findymail/apollo/permutation), `source_url` (where the role or email was published), `collected_at`, `lawful_basis` (`LI_UK`, `CANSPAM_US`, `CASL_implied_publication`, `SPAM_ACT_inferred`, `SG_BCI`, `consent`) and `jurisdiction` (derived from person location plus company HQ).
5. **Legitimate Interests Assessment (LIA)** — keep one written LIA, review it annually, and record per campaign:
   - *Purpose test:* "Offering market-entry advisory relevant to companies showing documented expansion signals."
   - *Necessity test:* why email or LinkedIn is needed; data limited to name, role, business email, company and public signals; no sensitive data.
   - *Balancing test:* senior professionals contacted in their business capacity about their role; a reasonable expectation; low intrusion (max 4 emails, easy opt-out); no profiling beyond business signals; Art. 14 notice in the first email.
   - *Safeguards:* suppression, retention limits, no data resale, processors under DPAs (Instantly, Apollo and others — check each vendor's DPA and sub-processors).
   - Per campaign: target segment, signal used, countries included or excluded, volume, and opt-out and complaint rates.
6. **Country routing:** `if jurisdiction in {DE, AT}` then LinkedIn only; `if CA or AU` then require a `publication_evidence_url`; `if IN and date ≥ 2027-05-13` then require consent or a documented 3(c)(ii) basis; `if UK and entity_type == sole_trader` then do not email.
7. **Phone:** call only business landlines or numbers published for business. Check the US TCPA rules for mobiles (manual dialling is lower risk) and avoid cold calling in India and the UAE. In the UK, screen against TPS/CTPS before calling.

---

## 6. LinkedIn-specific playbook (2026)

### 6.1 Safe limits (LinkedIn publishes no official limits; these are consensus ranges)

| Action | New or dormant account (first 90 days) | Aged account | Hard ceiling |
|---|---|---|---|
| Connection requests | 5–15/day; 40–60/week | 15–25/day; **60–100/week** | About 100/week since 2022 (Premium and Sales Navigator **do not** raise it; some reports say 150–250 on Sales Navigator, but don't rely on that) |
| Messages to 1st-degree connections | 20–40/day | 40–80/day | Space follow-ups 3–5 days apart, at most 2–3 per thread |
| InMails | 50 credits/mo (Sales Navigator) | Same | Credits come back on replies within 90 days |
| Profile views | 50–200/day | 150–300/day | Spread across the day |
| Comments / likes | 10–30 / 30–100 per day | Same | — |
| Acceptance rate | Keep **≥ 30%** | Same | Below 20–30% is a warning; cut volume 25–50%. Withdraw pending invites older than 3 weeks |

**After a restriction:** disconnect all tools, send only 5–10 manual invites a day for two weeks, and never return to the old volume. Appeals for multi-account restrictions succeed only about 12% of the time.

### 6.2 Automation tools and ban risk

| Approach | Risk | Comment |
|---|---|---|
| Browser-extension automation (Waalaxy, Dripify, Linked Helper, Kaspr/Lusha extensions) | **High** | BrowserGate (Apr 2026) showed LinkedIn scans for about 6,000+ extensions |
| Cloud automation using your session (HeyReach, Expandi, PhantomBuster, Unipile API) | **High to medium** | About 40% of HeyReach/Expandi/Dripify/Waalaxy users saw restrictions in Q1 2026 (vendor estimate). Behaviour matters more than the tool |
| Scraping with fake or "burner" accounts | **Unacceptable** | This is the Proxycurl and hiQ fact pattern: contract liability plus GDPR exposure |
| "No-cookie" public-profile scrapers (Apify harvestapi, Bright Data) | Account risk none; legal and privacy risk medium | Better: enrich from Apollo/PDL and use the LinkedIn URL only as an identifier |
| **Manual-assisted (recommended)** | **Low** | The app builds a daily queue: profile URL, why now (signal), a 200-character draft note and a follow-up draft. You open each link, personalise and click Send. 15–20 invites and 20–30 messages a day takes about 30–40 minutes. Log actions in the app with one click |

### 6.3 Sales Navigator search recipes

**Boolean rules:** `AND`, `OR`, `NOT` in UPPERCASE; "exact phrases" in quotes; parentheses for grouping. Works in Keywords, Current job title and Company fields. No wildcards. Keep queries under about 15 operators.

**Recipe A — new expansion leaders (highest intent):**
- Current job title: `("Country Manager" OR "General Manager" OR "Managing Director" OR "Head of" OR "VP" OR "Director") AND (India OR UK OR "United Kingdom" OR MENA OR GCC OR UAE OR "Middle East" OR APAC OR "Southeast Asia" OR ANZ OR Australia OR "North America" OR US) NOT (intern OR assistant OR recruiter)`
- Spotlight: **Changed jobs in past 90 days**
- Geography (person): the target market, for example India. Company HQ location: **anything except India**. This mismatch is the trick: a foreign company's first local leader.
- Company headcount: 51–5,000.

**Recipe B — HQ decision-makers driving international growth:**
- Title: `("Chief Strategy Officer" OR "Head of International" OR "VP International" OR "Head of Expansion" OR "VP Growth" OR "Chief Growth Officer" OR "Head of Corporate Development" OR "Chief Operating Officer" OR "Chief Executive Officer" OR Founder)`
- Seniority: CXO, VP, Owner/Partner
- Spotlight: **Posted on LinkedIn in past 30 days** (more likely to see and answer a note) or **Mentioned in the news in past 90 days**
- Account filters: **Company headcount growth** > 10% (1 year); **Department headcount growth** in Business Development or Sales > 15%; account spotlights **"Funding events in past 12 months"** and **"Senior leadership changes in last 3 months"**; **"Currently hiring"** on LinkedIn.

**Recipe C — PE operating partners:**
- Title: `("Operating Partner" OR "Portfolio Operations" OR "Value Creation" OR "Operating Executive")`; Industry: Venture Capital and Private Equity Principals; Geography: US, UK, India, UAE, Singapore.

**Workflow:** save searches as **saved searches with alerts**. Use account lists for the top 100 target accounts plus lead alerts (job changes, posts). Copy profile URLs **manually** into the app (no bulk export). Let the app enrich them via Apollo/Findymail by name plus company domain.

---

## 7. Multi-channel outreach for C-suite — what works (2025–2026 data)

### 7.1 Benchmarks

| Metric | Value | Source |
|---|---|---|
| Average cold email reply rate (2025 data) | **3.43%**; top quartile ≥ 5.5%; top 10% ≥ 10.7% | Instantly Benchmark Report 2026 |
| Share of replies from the 1st email | 58% (follow-ups 42%) | Instantly |
| Best first-touch length | **< 80 words** (other sources: 50–100) | Instantly; Salesmotion |
| Step 2 written "like a reply" | About +30% vs. a formal follow-up | Instantly |
| Best days | **Tue–Wed** (Wed peak); Mon has the most volume; Fri has the most auto-replies | Instantly |
| Best time | 7–11 am in the recipient's local time | Salesmotion (uncited) |
| Sequence length | **4–7 touches**, 3–4 days apart | Instantly |
| C-level vs. others (email) | C-level is about 30% less likely to reply; exec baseline 3–6%; > 8% is strong | Salesmotion (partly uncited) |
| LinkedIn acceptance | 26% average; **without** a note 27.6% vs. **with** a note 25.3% | Belkins 2026 (11.5M requests) |
| LinkedIn reply | Overall 7.2%; **C-level 7.0%**; Founders/Owners 6.4%; VC/PE industry about 10.5%; message with note 8.2% vs. without 5.3% | Belkins 2026 (15M+ contacts, 2025) |
| InMail reply | 7.5% (open InMail campaigns) | Belkins |
| Multichannel uplift | About +22% response vs. email-only | Salesmotion (uncited) |
| Subject lines | 1–4 words, lowercase, no clickbait (for example, "india launch", "uk entry", "question re: dubai") | Multiple |

### 7.2 What this means for Upforge (peer-level founder to executive)

- **Lead with the signal plus a specific insight**, not with credentials. For example: "Saw [Co] is hiring a Country Manager for India. Three things that usually decide year-one success there are GST/entity structuring, distributor margins and…. I wrote a one-page teardown of how [peer] entered; want it?" Offer a **"give" CTA** (teardown, benchmark or 15-minute market-sizing sanity check) rather than "30 minutes for a call".
- **Sequence (21 days, 6–8 touches):**
  - Day 1: email 1 (≤ 80 words, signal plus insight plus soft CTA) and a LinkedIn profile view.
  - Day 2: LinkedIn connection request (consider **no note** for acceptance, then message after accept, or a note if the signal is strong).
  - Day 4: email 2 (written as a reply in the same thread, 2–3 lines, new angle or proof).
  - Day 7: on acceptance, a LinkedIn message (value, not a pitch).
  - Day 9: email 3 (case or mini-insight with a number).
  - Day 12: **personalised Loom (60–90 s)** **only for Tier-1 accounts or engaged prospects** (opened, clicked or viewed your profile), showing their localised site or job post on screen.
  - Day 14: call to the office line or EA (US/UK/AU only), framed around the teardown.
  - Day 18: email 4 "breakup" (permission to close the loop).
- **Handwritten letter or note (Tier-1, top 20–50 accounts per month):** $2–5 per card via Handwrytten, Scribeless or Simply Noted (APIs or Zapier). Send to the HQ address with a QR code linking to the one-page market teardown. Expect more engagement but small samples; vendors publish no reliable reply data.
- **EA strategy:** for CEOs of companies above about $500M, CC or address the Chief of Staff or EA ("who owns the India launch?"). Referral-down emails ("Who handles international expansion?") convert well with busy CEOs.
- **Expected outcomes per 100 well-targeted C-suite contacts:** email-only 3–8 replies, 1–3 positive, **0.5–1.5 meetings**. Email plus manual LinkedIn plus a Loom for engaged prospects gives **1–2.5 meetings**. Signal-timed lists perform at the top of the range; generic lists at the bottom or below.

---

## 8. Three recommended stacks for a solo founder

Assumptions: 21 sending days a month; about 4 emails per contact; send only verified addresses; manual LinkedIn alongside. Meetings use the per-100 ranges above; "qualified" means ≈ 50–60% of booked meetings.

### (a) Bootstrap — about $75–100/mo

| Layer | Tool | Monthly |
|---|---|---|
| Signals | Companies House API, SEC EDGAR, data.gov.in (MCA), data.gov.sg (ACRA), data.gov.au (ASIC), **GDELT**, crt.sh, **TheirStack Free** (200 credits), Firecrawl free tier, **Exa free** ($10/mo credits) | $0 |
| People / company data | **Apollo Free** (75 credits; People API Search uses no credits for names and titles); Hunter Free (50); Prospeo Free (75) | $0 |
| Email finding | Permutation plus verification (section 3.3) for the rest | — |
| Verification | **Reoon** (600/mo free, then about $12 per 10k) | $0–12 |
| Sending | **Instantly Growth** (annual) | ~$38 |
| Infrastructure | 2 secondary domains (~$2.50/mo) + 3 Google Workspace mailboxes (~$7–8.40 each) | ~$24–28 |
| LinkedIn | Free account, manual, about 15 invites a day | $0 |
| AI | Claude API (classification, research summaries, copy), about 1–2M tokens per month with Sonnet-class models **[estimate]** | ~$10–25 |
| **Total** | | **≈ $75–100** |

**Capacity:** 3 mailboxes × 25/day × 21 ≈ 1,575 emails, or about **400 new contacts a month** with 4-step sequences. Add **about 300 LinkedIn invites a month**. **Expected:** 2–6 meetings a month, about **1–4 qualified**. The main constraint is Apollo's 75 credits, so the permutation-plus-Reoon path does most of the email finding.

### (b) Serious — about $450–600/mo (recommended starting point)

| Layer | Tool | Monthly |
|---|---|---|
| Signals | Free registries and GDELT + **TheirStack API 1.5k** ($49) + **Serper** (pay-as-you-go, about $5–10) + **Firecrawl Hobby** (about $16–19 **[verify]**) + **Exa** pay-as-you-go (about $20–40) | ~$90–120 |
| People / company data | **Apollo Basic** $49 (annual; 2,500 credits) | $49 |
| LinkedIn | **Sales Navigator Core** (annual) | $90 |
| Email finding | **Findymail Basic** $49 (1k finds plus 1k verifies, catch-all validation) *or* Prospeo $39 | $39–49 |
| Verification | MillionVerifier ($39 per 10k pack, used over a few months) or Reoon | ~$12–15 |
| Sending | **Instantly Hypergrowth $97** (webhooks) *or* **Smartlead Pro $78** (annual; API plus webhooks) | $78–97 |
| Infrastructure | 5 domains (~$6/mo) + 10 mailboxes: Google/Microsoft direct (~$70) or **Zapmail Starter $39** (year one) | $45–76 |
| AI | Claude API | ~$40–80 |
| **Total** | | **≈ $450–600** |

**Capacity:** 10 mailboxes × 25–30/day × 21 ≈ 5,500–6,300 emails, or **about 1,400–1,500 new contacts a month**. Add about 350 manual LinkedIn invites and 50 InMails. **Expected:** **8–20 meetings a month, about 5–12 qualified.**

### (c) Scale — about $1,600–2,500/mo

| Layer | Tool | Monthly |
|---|---|---|
| Signals | TheirStack 10k–50k ($169–400) + **Coresignal Pro** $499 (headcount by location, jobs history, employee changes) *or* PDL; GNews Essential €50; Exa/Firecrawl/Serper about $100; optional **Crunchbase Pro** UI $49 | ~$650–1,100 |
| People / company data | **Apollo Professional** $79 (4,000 credits) + **Lusha Pro** $52 (job-change webhooks) *or* RocketReach Pro $75 for exec mobiles | ~$130–155 |
| LinkedIn | **Sales Navigator Advanced** $150 (annual). Optional **Unipile** €49 to *read* inbox and connection status only (keep sending manual) — **accept the ToS risk knowingly** | $150–205 |
| Email finding and verification | **Findymail Business** $249 (15k finds, catch-all) + MillionVerifier bulk | ~$265 |
| Sending | **Instantly Hypergrowth $97** (or Light Speed $358 if more than 100k emails a month, unlikely for C-suite) | $97–358 |
| Infrastructure | 12–15 domains + 30–40 mailboxes: **Zapmail Growth $99** (30 mailboxes) or mixed Google/Microsoft direct (about $250); plus a DMARC monitor | ~$120–270 |
| Physical / video | 40 handwritten notes × ~$4 = $160; Loom Business (~$15–20 **[verify]**) | ~$180 |
| AI | Claude API (deeper research per account) | ~$100–200 |
| Optional | **Clay Growth** $446 (annual) only if you want a GUI waterfall and Claygent instead of building them | (+$446) |
| **Total** | | **≈ $1,600–2,500** |

**Capacity:** 30–40 mailboxes × 25/day × 21 ≈ 16k–21k emails, or **about 4,000–5,000 contacts a month**. Add Tier-1 multichannel for about 200 accounts a month. **Expected:** **25–60 meetings a month, about 15–35 qualified.** **Caution:** for a boutique consultancy selling high-ticket strategy work, the C-suite total addressable market showing live signals each month is finite (often a few thousand accounts). **Scale depth before volume:** research per account, multichannel and insight assets. Past about 1,500–2,000 *signal-qualified* contacts a month, quality usually drops and deliverability risk rises.

---

## 9. App integration specifics

### 9.1 Integration matrix

| Tool | Endpoint style / base | Auth | Webhooks | Key calls for Upforge |
|---|---|---|---|---|
| **Apollo** | REST JSON `https://api.apollo.io/api/v1/` | `X-Api-Key` header | No push webhooks for general use. Asynchronous phone reveals need a `webhook_url` / "poll webhook result" **[verify]** | `POST /mixed_people/api_search` (credit-free; titles, seniorities, locations, org domains; **no emails**); `POST /people/match` (1 credit per email; `reveal_personal_emails=false`); `POST /people/bulk_match` (up to 10); `GET /organizations/enrich?domain=`; `POST /mixed_companies/search`; `GET /organizations/{id}/job_postings`. Back off on 429 |
| **Hunter** | REST `https://api.hunter.io/v2/` | `X-API-KEY` header | No | `/domain-search?domain=` (returns `pattern`); `/email-finder?domain=&first_name=&last_name=`; `/email-verifier?email=`; `POST /discover` (free company discovery). 403 = rate limit, 429 = quota |
| **Findymail** | REST `https://app.findymail.com/api/…` | Bearer token | Optional async callback **[verify]** | `search/name` (name + domain), `search/linkedin`, `verify` |
| **Prospeo** | REST `https://api.prospeo.io/…` | API key header **[verify name]** | No | Email finder, LinkedIn-URL enrich, domain search |
| **Reoon** | REST `https://emailverifier.reoon.com/api/v1/verify?email=&key=&mode=power` **[verify path]** | Key in query | Bulk task polling | Single and bulk verify |
| **MillionVerifier** | REST `https://api.millionverifier.com/api/v3/?api=KEY&email=` **[verify]** | Key in query | Bulk file API | Single and bulk |
| **TheirStack** | REST `POST https://api.theirstack.com/v1/jobs/search` **[verify]** | Bearer | **Yes** (saved-search webhooks) | Filters: job title patterns, job country codes, company country, `posted_at_max_age_days`, company size |
| **Companies House** | REST `https://api.company-information.service.gov.uk` + streaming `https://stream.companieshouse.gov.uk/{companies,officers,persons-with-significant-control}` | HTTP Basic (key as username) | Stream = long-lived HTTP (newline-delimited JSON with `timepoint` for resume) | `advanced-search/companies`, `/company/{n}`, `/officers`, `/persons-with-significant-control` |
| **SEC EDGAR** | JSON `data.sec.gov`, FTS `efts.sec.gov/LATEST/search-index` | None; **User-Agent header with contact email** | No (poll the daily index or RSS) | Form D, 8-K, 10-K text |
| **data.gov.in / data.gov.sg / data.gov.au** | REST/CSV | API key (IN, SG optional) | No | Monthly or weekly diffs by registration date |
| **GDELT** | `GET https://api.gdeltproject.org/api/v2/doc/doc?query=…&mode=artlist&format=json&timespan=1d` | None | No | Phrase × country queries every 6–24 h |
| **Exa** | `POST https://api.exa.ai/search` (`category`, `includeDomains`, `startPublishedDate`), `/contents`, `/findSimilar`, `/answer`, Websets API | `x-api-key` or Bearer | **Websets: yes** | Lookalike accounts, people lookup, news |
| **Firecrawl** | `POST https://api.firecrawl.dev/v1|v2/scrape`, `/crawl`, `/extract`, `/search` | Bearer | Crawl webhooks | Careers pages, hreflang, exhibitor lists |
| **Serper** | `POST https://google.serper.dev/{search,news,places}` | `X-API-KEY` | No | Cheap Google lookups |
| **Instantly v2** | `https://api.instantly.ai/api/v2/` (campaigns, leads, accounts, emails/reply) | Bearer API key (scoped) | **Yes** (event list in 4.3) | `POST /leads` (add to campaign with custom variables), list replies, reply via the API |
| **Smartlead** | `https://server.smartlead.ai/api/v1/` | `?api_key=` query | **Yes** (reply, bounce, unsubscribe and others) | `POST /campaigns/{id}/leads`, campaign stats, message history |
| **Apify** | `https://api.apify.com/v2/acts/{actor}/runs` or `run-sync-get-dataset-items` | `?token=` or Bearer | **Yes** (run succeeded or failed) | Job scrapers, registry wrappers |
| **Bright Data** | `POST https://api.brightdata.com/datasets/v3/trigger?dataset_id=` | Bearer | **Yes** (delivery webhook) | Public company and profile data (use sparingly) |
| **Lusha** | REST `https://api.lusha.com/v3/` | `api_key` header (+ `owner.email`) | **Yes** (job changes, company events) | Enrich, signals |
| **PDL** | REST `https://api.peopledatalabs.com/v5/{person,company}/{enrich,search}` | `X-Api-Key` | No | Enrich, job-change diffs |
| **Coresignal** | REST `https://api.coresignal.com/cdapi/v2/…` | `apikey` header | No | Free ES-DSL search, then collect at 10 or 20 credits |
| **Google Places** | `POST https://places.googleapis.com/v1/places:searchText` | `X-Goog-Api-Key` + `X-Goog-FieldMask` | No | Retail and F&B location checks |
| **Unipile** (optional) | REST per-account DSN | `X-API-KEY` | **Yes** (new message, new relation) | Read-only sync of LinkedIn replies and acceptances |
| **Handwrytten** | REST | API key **[verify]** | Order status | Send notes to Tier-1 accounts |
| **Calendly / Cal.com** | REST | Bearer | **Yes** (`invitee.created`) | Mark a lead as "meeting booked" |

### 9.2 Suggested data model (Postgres)

```sql
-- COMPANIES
companies (
  id uuid pk, name text, legal_name text, domain text unique, website_url text,
  linkedin_company_url text, hq_country char(2), hq_city text,
  employee_count int, employee_range text, revenue_est_usd bigint, revenue_range text,
  industry text, sub_industry text, naics text, sic_codes text[], nic_code text,
  founded_year int, ownership_type text,          -- public|private|pe_backed|vc_backed|subsidiary
  parent_company_id uuid null, registry_ids jsonb, -- {"gb_ch":"12345678","in_cin":"U7...","us_cik":"000...","sg_uen":"...","au_acn":"..."}
  total_funding_usd bigint, last_funding_date date, last_funding_type text,
  investors text[], tech_stack text[], hreflangs text[], cc_tlds text[],
  markets_present char(2)[], markets_entering char(2)[],
  fit_score int, intent_score int, tier text,      -- T1|T2|T3
  apollo_org_id text, crunchbase_uuid text, coresignal_id text,
  created_at timestamptz, updated_at timestamptz, last_enriched_at timestamptz
);

-- PEOPLE
people (
  id uuid pk, company_id uuid fk, first_name text, last_name text, full_name text,
  title text, seniority text,                      -- c_suite|vp|director|founder|partner
  function text,                                   -- strategy|international|finance|ops|growth|general_mgmt|pe_ops
  location_country char(2), location_city text, timezone text,
  linkedin_url text, linkedin_url_hash text, twitter_url text,
  started_role_at date, previous_company text, job_change_detected_at date,
  apollo_person_id text, pdl_id text,
  persona text, priority int,
  jurisdiction char(2), entity_type text,          -- for PECR sole-trader logic
  lawful_basis text,                               -- LI_UK|CANSPAM_US|CASL_implied|SPAMACT_inferred|SG_BCI|consent|none
  publication_evidence_url text,                   -- CASL/Spam Act
  status text,                                     -- new|researched|queued|contacted|replied|meeting|disqualified|suppressed
  created_at timestamptz, updated_at timestamptz, retention_expires_at date
);

-- CONTACT POINTS (emails/phones with verification)
contact_points (
  id uuid pk, person_id uuid fk, type text,        -- email|phone_direct|phone_mobile|phone_office
  value text, value_hash text,
  source text,                                     -- apollo|findymail|prospeo|hunter|permutation|lusha|manual
  source_confidence int,
  verification_status text,                        -- valid|valid_catchall_validated|risky_catch_all|unknown|invalid|role_based|disposable
  verifier text, verified_at timestamptz, is_catch_all_domain bool, mx_provider text, -- google|microsoft|other (ESP matching)
  dnc_checked bool, dnc_result text,
  is_primary bool, created_at timestamptz
);

-- SIGNALS
signals (
  id uuid pk, company_id uuid fk, person_id uuid null,
  signal_type text,      -- job_post_market_lead|new_subsidiary|funding|expansion_press|localisation|new_cctld|store_opening|trade_show|pe_acquisition|exec_change|tariff_exposure|headcount_geo_growth|ipa_announcement
  target_market char(2), -- country being entered
  title text, summary text, evidence_url text, evidence_snapshot_path text,
  source text,           -- theirstack|companies_house|mca_ogd|acra|asic|sec|gdelt|exa|crtsh|firecrawl|sales_nav_manual
  source_record_id text, detected_at timestamptz, event_date date,
  weight int, decay_half_life_days int default 45, confidence numeric,
  llm_classification jsonb,  -- {is_real_expansion: true, stage: "hiring_first_leader", countries:["IN"]}
  used_in_message bool default false
);

-- OUTREACH
sequences(id, name, channel_mix text[], persona, market, copy_version, created_at)
outreach_events (
  id uuid pk, person_id fk, sequence_id fk, channel text, -- email|linkedin_invite|linkedin_msg|inmail|loom|call|letter
  step int, sender_identity text, platform text, platform_message_id text,
  event text,  -- queued|sent|delivered|opened|replied|bounced|unsubscribed|accepted|meeting_booked|ooo|wrong_person
  reply_sentiment text, reply_text text, occurred_at timestamptz, raw jsonb
);

-- COMPLIANCE
suppression (id, email_hash text, domain text null, linkedin_url_hash text null,
             reason text, source_event_id uuid, created_at timestamptz)  -- permanent
lia_records (id, version, purpose, necessity, balancing, safeguards, approved_at, review_due)
campaign_compliance (sequence_id, countries_included char(2)[], countries_excluded char(2)[], lia_id, notes)
provenance (entity_table, entity_id, field, source, source_url, collected_at)
```

### 9.3 Field mapping cheat-sheet

| App field | Apollo | Hunter | Findymail | Companies House | TheirStack | Instantly webhook |
|---|---|---|---|---|---|---|
| `companies.domain` | `organization.primary_domain` | `domain` | `domain` | — (look up via website) | `company.domain` | — |
| `companies.employee_count` | `organization.estimated_num_employees` | `organization.size` [verify] | — | — | `company.employee_count` | — |
| `companies.registry_ids.gb_ch` | — | — | — | `company_number` | — | — |
| `companies.hq_country` | `organization.country` | `country` | — | `registered_office_address.country` | `company.country_code` | — |
| `people.title` | `person.title` | `position` | `title` [verify] | `officers[].occupation` / `officer_role` | `hiring_team[].role` [verify] | — |
| `people.linkedin_url` | `person.linkedin_url` | `linkedin` | `linkedin_url` | — | — | — |
| `people.seniority` | `person.seniority` | `seniority` | — | `officer_role` (director → c_suite/board) | — | — |
| `contact_points.value` (email) | `person.email` (after match) | `data.email` | `contact.email` | — | — | `lead_email` |
| `contact_points.verification_status` | `person.email_status` (verified/guessed/unavailable) | `data.verification.status` / `score` | always verified; catch-all flag | — | — | `email_bounced` → invalid |
| `signals.*` | `job_postings[]`, `organization.funding_events[]` | — | — | PSC `kind = corporate-entity-person-with-significant-control` + `country_registered` ≠ GB → new_subsidiary | `job_title`, `location`, `country_code`, `date_posted`, `url` | — |
| `outreach_events.event` | — | — | — | — | — | `event_type` (reply_received, lead_interested, lead_meeting_booked, lead_unsubscribed → also insert into `suppression`) |

### 9.4 Pipeline (jobs and cron)

1. **Hourly or daily signal collectors:** Companies House stream consumer, TheirStack webhook receiver, GDELT poller (every 6 h), SEC Form D daily index, MCA/ACRA/ASIC weekly or monthly diffs, crt.sh and hreflang weekly checks on the watch-list, exhibitor scrapes per event.
2. **Signal triage with Claude:** classify each item as {real expansion? market? stage? company HQ? relevance to the Upforge offer?}, then dedupe to `companies` by domain or registry ID.
3. **Account scoring:** fit score (size, sector, HQ, ownership) plus intent score (decayed signals). Above the threshold, move to research.
4. **People discovery:** Apollo People API Search (free) for the 2–4 best personas, plus registry officers, plus manual Sales Navigator adds.
5. **Suppression check, then email waterfall** (section 3.3), then verification, then jurisdiction and lawful-basis assignment.
6. **Research brief per account:** Exa, Firecrawl and Serper into a 150-word brief plus 3 personalised hooks with evidence URLs, written by Claude.
7. **Copy generation** (Claude) under strict rules (≤ 80 words, one signal, one insight, soft CTA, opt-out line). **Human review of every first-touch to C-suite during the first 1–2 months.**
8. **Push to Instantly or Smartlead** via the API (custom variables), and **create the LinkedIn task queue** in the app.
9. **Webhooks back:** replies to Claude classifier (interested / not now / referral / OOO / unsubscribe). Unsubscribes and objections go to suppression immediately. Interested leads get a booking link plus an alert to the founder. Calendly webhook marks a meeting.
10. **Weekly report:** sends, bounces (target < 2%), replies, positive rate, meetings by signal type, so you learn which signals convert.

---

## 10. Open uncertainties to verify before you build

- Exact current endpoint paths for Apollo (`/mixed_people/api_search`), Prospeo, Findymail, Reoon, MillionVerifier and TheirStack. Check each provider's docs, because several changed in 2025–2026.
- Whether Smartlead **Base** includes API access (sources conflict).
- Mailreef's infrastructure type and price (sources conflict).
- Google Workspace and Microsoft 365 per-user prices in Oct 2026 (not verified here).
- India DPDP: whether MeitY has notified the shortened 12-month timeline after Sept 2026. Watch the Gazette and MeitY.
- UK DUAA: the exact wording on direct marketing as a legitimate interest, and the ICO's updated direct-marketing guidance (expected in 2026).
- Singapore Spam Control Act bulk thresholds and the DNC B2B exclusion wording. UAE telemarketing resolution details.
- Exa Websets pricing; Bright Data's free tier; Firecrawl plan prices.

---

## Sources

**Pricing and tools**
- Apollo pricing and API limits: https://www.articuler.ai/resources/compare/apollo-pricing/ ; https://fullenrich.com/content/apollo-pricing ; Apollo API review: https://pipeline.zoominfo.com/sales/apollo-api-review ; https://docs.apollo.io/reference-link/people-enrichment
- Clay 2026 pricing change: https://www.cleanlist.ai/blog/2026-03-12-clay-pricing-changes-2026 ; https://www.joinvalley.co/blog/clay-pricing-and-credits-explained-2026
- Lusha API and pricing: https://reply.io/blog/lusha-api/
- Kaspr: https://www.cleanlist.ai/blog/2026-09-01-kaspr-pricing-guide
- Cognism / ZoomInfo: https://prospeo.io/s/cognism-pricing
- RocketReach: https://gtmprices.com/tools/rocketreach
- People Data Labs: https://www.revenueflow.com/blog/people-data-labs
- Coresignal: https://apiserpent.com/blog/coresignal-pricing-explained
- PhantomBuster: https://www.joinvalley.co/blog/phantombuster-pricing-2026
- Apify LinkedIn actors: https://apiserpent.com/blog/apify-linkedin-scraper-pricing-explained ; https://apify.com/harvestapi/linkedin-company-employees
- Bright Data LinkedIn: https://apiserpent.com/blog/brightdata-linkedin-pricing-explained
- Hunter API: https://generect.com/blog/hunter-io-api/
- Snov.io: https://www.cleanlist.ai/blog/2026-10-01-snov-io-pricing-guide
- Findymail: https://emelia.io/hub/findymail-pricing
- Email finders compared: https://www.supered.io/blog/email-finder-tools/ ; https://prospeo.io/s/email-finder-api ; https://reply.io/blog/best-email-finder-apis/
- Verifier pricing: https://www.reoon.com/blog/email-verification-pricing/ ; https://instantly.ai/blog/2026-email-verification-benchmark-accuracy-scores-for-8-top-tools/
- Crunchbase API: https://webscraping.cc/blog/crunchbase-api/
- Tracxn: https://capterra.com/p/204090/Tracxn/pricing
- Search APIs (Exa, Tavily, Serper, SerpAPI, Firecrawl, Brave): https://keirolabs.cloud/blogs/comparisons/ai-search-api-pricing-compared ; https://keirolabs.cloud/blog/exa-api-pricing-2026 ; Exa people search: https://exa.ai/blog/people-search-benchmark ; https://exa.ai/docs/reference/verticals/people-for-coding-agents.md ; https://sacra.com/c/exa/
- Google Places pricing: https://openplacesapi.com/blog/google-places-api-pricing
- Octoparse: https://use-apify.com/blog/octoparse-pricing-2026
- TheirStack: https://syncgtm.com/blog/theirstack-review
- News APIs: https://geekflare.com/guides/global-news-api/
- Trade data: https://listicler.com/blog/volza-review-2026-trade-data-platform
- Unipile: https://bereach.ai/tool-comparison/unipile-linkedin-api-pricing
- Handwritten notes: https://simplynoted.com/blogs/news/handwritten-note-service-cost-pricing-guide-2026

**Registries**
- Companies House rate limit: https://developer-specs.company-information.service.gov.uk/guides/rateLimiting
- SEC EDGAR access: https://www.sec.gov/os/accessing-edgar-data
- ACRA dataset: https://data.gov.sg/dataset/acra-information-on-corporate-entities
- MCA OGD wrapper (fields): https://apify.com/nexgendata/mca-company-registry

**LinkedIn**
- Proxycurl shutdown: https://www.unipile.com/proxycurl-alternative/ ; https://pipeline.zoominfo.com/sales/proxycurl-api
- 2026 automation crackdown: https://www.getcleed.com/blog/linkedin-automation-crackdown-2026 ; https://www.joinvalley.co/blog/linkedin-automation-safety-2026
- Data-vendor crackdown timeline: https://www.leadgenius.com/resources/linkedins-b2b-data-crackdown-what-changed-by-2026 ; https://salesmotion.io/blog/linkedin-removed-apollo-brand-page-2025-alternatives
- Safe limits: https://phantombuster.com/blog/linkedin-automation/linkedin-automation-safe-limits-2026/
- Sales Navigator pricing: https://www.revenueflow.com/blog/linkedin-sales-navigator-pricing
- Sales Navigator filters: https://www.findymail.com/blog/sales-navigator-search-filters
- Legality of scraping: https://apiserpent.com/blog/is-scraping-linkedin-legal-2026
- LinkedIn benchmarks (Belkins): https://belkins.io/blog/linkedin-outreach-study

**Deliverability and sending**
- Instantly vs Smartlead: https://bavlio.com/blog/instantly-vs-smartlead-2026 ; Smartlead API: https://reply.io/blog/smartlead-api/
- Instantly webhooks: https://developer.instantly.ai/guides/webhook-events
- Sending tools comparison: https://connectsafely.ai/articles/cold-email-outreach-tools-comparison-2026
- Infrastructure costs: https://maildeck.co/blog/cold-email-infrastructure-cost-2026/ ; Zapmail: https://getle.ad/blog/zapmail-pricing ; Mailreef: https://puzzleinbox.com/blog/mailreef-review/
- Google/Microsoft sender rules: https://www.mailgun.com/blog/deliverability/microsoft-sender-requirements/ ; https://leadhaste.com/blog/google-microsoft-sender-guidelines ; https://outboundsystem.com/blog/google-workspace-cold-email-limits

**Benchmarks**
- Instantly Cold Email Benchmark Report 2026: https://instantly.ai/cold-email-benchmark-report-2026
- Exec reply data: https://salesmotion.io/blog/cold-email-executives-reply-rates

**Compliance**
- India DPDP phased rollout: https://www.azbpartners.com/bank/indias-digital-personal-data-protection-act-phased-rollout-and-key-compliance-milestones/ ; status as of Sept 2026: https://www.mirvolegal.com/insights/dpdp-rules-2025-compliance-timeline/ ; compression proposal: https://www.mondaq.com/india/data-protection/1773554/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs
- UK DUAA commencement (PECR fines): https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2026/02/key-aspects-of-the-data--use-and-access--act-take-effect.html
- Australia Spam Act: https://puzzleinbox.com/blog/cold-email-australia-spam-act-2026
- UAE PDPL status: https://www.businessdubai.ae/blogs/uae-pdpl-data-protection ; https://business-ciso.com/blog/uae-pdpl-executive-regulations-status
- Singapore PDPA overview: https://trustarc.com/regulations/singapore-pdpa/
