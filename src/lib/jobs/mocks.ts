import type { CampaignBriefOutput } from "@/lib/claude/schemas/campaign";
import type { QualifierOutput } from "@/lib/claude/schemas/qualify";
import type { CopyPackage } from "@/lib/claude/schemas/copy";

/** Realistic fixtures used when CLAUDE_MODE=mock (no API key). */
export function mockCampaign(input: { name: string; persona: string; corridor: string }): CampaignBriefOutput {
  return {
    positioning: `${input.name}: ${input.persona}-persona leaders moving along the ${input.corridor} corridor who have just shown a public entry signal and have no in-market strategy team yet. UpForge gives them a four-week, founder-led answer on who will buy, why they will trust the brand, and what it costs to win.`,
    icp: {
      summary: "Consumer-facing companies with a dated expansion trigger in the last 90 days, a senior decision-maker reachable by business email, and no published consumer research for the target market.",
      must_haves: ["Trigger dated within 90 days", "Revenue $5m-$100m or Series A+", "Consumer-facing product", "Decision-maker at founder, CEO, CFO or Head of International level"],
      exclusions: ["Consulting or research firms", "Government bodies", "Companies under 10 staff with no funding", "Germany and Austria (email)"],
      buyer_titles: ["Founder", "CEO", "Head of International", "VP Growth", "CFO"],
    },
    signals: [
      { type: "job_post_market_lead", why: "A 'Country Manager' hire means the entry decision is made but the plan is not.", detection: "TheirStack job search: title pattern ('Country Manager' OR 'Head of International'), job country ≠ company HQ country, posted ≤ 30 days." },
      { type: "marketplace_listing", why: "A new Noon, Namshi or Amazon.ae listing is a live market test with no local trust strategy.", detection: "Weekly Firecrawl of marketplace brand pages plus GDELT query '\"launches in UAE\"'." },
      { type: "funding_with_expansion", why: "Capital earmarked for 'international expansion' is budget looking for a plan.", detection: "GDELT/Serper news: '\"raises\" AND (\"expand\" OR \"international\")' filtered to the corridor." },
    ],
    subject_lines: ["dubai launch", "the ceta window", "before the country manager", "uae shoppers, one data point", "your market entry case", "three things noon reviews say", "a 4-week answer", "uk entry question", "pricing in aed", "month 3 abroad"],
    sequence: [
      { step: 1, day: 1, channel: "email", purpose: "Signal plus insight plus a give", body: "Hi {{first_name}},\n\nSaw {{signal}}. One thing we see in {{market}} {{category}} launches: {{insight}}.\n\nWe wrote a two-page pulse on how {{category}} brands win non-diaspora shoppers in {{market}}. Want it? I'll send it either way.\n\nShardul Singh\nFounder, UpForge Consulting\n\nIf this isn't relevant, reply 'no' and I won't contact you again." },
      { step: 2, day: 2, channel: "linkedin", purpose: "Connection request, no note or a one-line note", body: "Hi {{first_name}}, I research how {{category}} brands build trust with new shoppers in {{market}}. Happy to share what we're seeing. Would be good to connect." },
      { step: 3, day: 4, channel: "email", purpose: "Reply-style bump with a second angle", body: "{{first_name}}, one more thought on {{company}}'s {{market}} move: the brands that stall in month three usually copied their home-market trust signals. Happy to show the pattern on a 20-minute call if useful." },
      { step: 4, day: 9, channel: "email", purpose: "Proof point and a number", body: "Hi {{first_name}}, a founder we worked with repositioned for a new market's shoppers and reported higher brand trust within a quarter. If {{company}} is deciding city, channel or partner for {{market}} this quarter, a four-week sprint gives you that answer with a 24-month P&L. Worth 20 minutes?\n\nIf this isn't relevant, reply 'no' and I won't contact you again." },
      { step: 5, day: 18, channel: "email", purpose: "Polite close", body: "{{first_name}}, closing the loop. If {{market}} is on the agenda later in the year, the pulse brief is yours whenever useful. Thanks for reading." },
    ],
    linkedin_note: "Hi {{first_name}}, saw {{company}}'s {{market}} move. I research how {{category}} brands build trust with non-diaspora shoppers there. Happy to share what we're seeing. Would be good to connect.",
    objections: [
      { objection: "We'll learn by launching.", response: "Then let the launch be the experiment: the Sprint designs a 90-day test with kill-or-scale criteria so you learn on $50k, not $500k." },
      { objection: "Our investors' network has advice.", response: "Advice is free and unaccountable. A fixed-fee, sourced brief with a go/test/wait verdict is something your board can challenge." },
      { objection: "AI-generated research?", response: "AI gathers. People verify and judge. Every number carries a source, date and a known/estimated/undisclosed label." },
    ],
    risks: ["Prices in offers.md are unconfirmed; copy must say 'fixed fee' until confirmed.", "Case studies lack metrics; proof relies on method until permissions and numbers are added.", "UAE and India recipients need low volume and careful lawful-basis handling."],
  };
}

export function mockQualifier(lead: { fullName: string; title?: string | null; company: string }): QualifierOutput {
  return {
    entity_check: { company_match: "confirmed", person_match: "probable", note: `${lead.company} resolved from user input; ${lead.fullName}'s role not independently verified in mock mode.` },
    knockouts: [],
    criteria: [
      { criterion: "C1_firmographic_fit", level: "L3", evidence_ids: ["INPUT:company", "E1"], rationale: "Consumer brand in a corridor geography; size band matches segment A [E1]." },
      { criterion: "C2_expansion_intent", level: "L3", evidence_ids: ["E2"], rationale: "Marketplace launch in the target market reported [E2]." },
      { criterion: "C3_buyer_role", level: "L3", evidence_ids: ["INPUT:title"], rationale: `Stated title '${lead.title ?? "unknown"}' is senior; not verified on the company site.` },
      { criterion: "C4_timing", level: "L3", evidence_ids: ["E2"], rationale: "Trigger dated within the last six months [E2]." },
      { criterion: "C5_budget_proxies", level: "L2", evidence_ids: ["E3"], rationale: "Recent funding round reported [E3]." },
      { criterion: "C6_consumer_relevance", level: "L3", evidence_ids: ["E1"], rationale: "Consumer-facing brand [E1]." },
      { criterion: "C7_finops_need", level: "L2", evidence_ids: ["E3"], rationale: "Funding implies a model and expansion P&L will be needed [E3]." },
      { criterion: "C8_reachability", level: "UNKNOWN", evidence_ids: [], rationale: "No warm path found." },
    ],
    offer_fit: [
      { offer: "market_entry", fit: "high", why: "Live entry into a named market with no published plan." },
      { offer: "consumer_psychology", fit: "medium", why: "Consumer brand facing non-diaspora shoppers." },
      { offer: "ops_finance_modelling", fit: "low", why: "No explicit modelling trigger beyond funding." },
    ],
    tier_opinion: "B",
    confidence: "medium",
    confidence_reason: "Two dated signals from press; the contact's current role is not verified on a primary source.",
    unknowns: ["Contact's current title on the company site", "Revenue band"],
    review_flags: ["person_role_unverified"],
    personalization_hooks: [{ hook: "Recent marketplace launch in the target market", evidence_id: "E2" }],
    reviewer_summary: `${lead.company} is a consumer brand with a dated entry signal in the target market and recent funding. The best-fit offer is the Market Entry Sprint. The main uncertainty is whether ${lead.fullName} still holds the stated role.`,
    next_action: "approve_for_offer_crafting",
  };
}

export function mockEvidence(company: string, domain?: string | null) {
  const d = domain ?? "example.com";
  return [
    { evidence_id: "E1", criteria: ["C1", "C6"], claim: `${company} is a consumer brand headquartered in the corridor origin country.`, url: `https://${d}/about`, title: `About ${company}`, cited_text: `${company} is a consumer brand`, published_date: "undated", source_type: "web_fetch" },
    { evidence_id: "E2", criteria: ["C2", "C4"], claim: `${company} launched on a marketplace in the target market this year.`, url: "https://example-news.com/launch", title: `${company} expands abroad`, cited_text: "launched on a marketplace", published_date: "2026-08-15", source_type: "web_search" },
    { evidence_id: "E3", criteria: ["C5", "C7"], claim: `${company} raised a funding round citing international expansion.`, url: "https://example-news.com/funding", title: `${company} raises round`, cited_text: "raised a round to fund international expansion", published_date: "2026-06-02", source_type: "web_search" },
  ];
}

export function mockCopy(lead: { firstName: string; company: string; market: string }): CopyPackage {
  const m = lead.market.toLowerCase();
  return {
    problem_hypothesis: `If ${lead.company} is entering ${lead.market} with its home-market trust signals, month-three conversion is the likely constraint.`,
    email: {
      subject: `${m} launch`,
      body: `Hi ${lead.firstName},\n\nSaw ${lead.company} went live in ${lead.market} this year. I run UpForge, a small team that researches how consumer brands win shoppers in new markets. In ${lead.market}, the brands that stall by month three usually kept their home-market trust signals, and the ones that grow rebuilt them for non-diaspora shoppers. Want the two-page version for your category?\n\nShardul Singh\nFounder, UpForge Consulting\n\nIf this isn't relevant, reply 'no' and I won't contact you again.`,
    },
    follow_up: {
      subject: `re: ${m} launch`,
      body: `${lead.firstName}, one more data point: the decisions before a country-manager hire (city, channel, partner, price) are the hardest to reverse later. Happy to send the pulse either way.`,
    },
    follow_up_2: {
      subject: `re: ${m} launch`,
      body: `${lead.firstName}, a founder we worked with repositioned for a new market's shoppers and reported higher brand trust within a quarter. If ${lead.company} is choosing city, channel or partner this quarter, a four-week sprint answers that with a 24-month P&L. Worth 20 minutes?`,
    },
    close: {
      subject: `re: ${m} launch`,
      body: `${lead.firstName}, closing the loop. If ${lead.market} comes back on the agenda, the two-page pulse is yours whenever it's useful. Thanks for reading.`,
    },
    linkedin_note: `Hi ${lead.firstName}, saw ${lead.company}'s ${lead.market} move. I research how brands build trust with new shoppers there. Happy to share what we're seeing. Would be good to connect.`,
    facts_used: [{ fact: `${lead.company} launched in ${lead.market}`, evidence_id: "E2" }],
    risk_flags: ["Prices omitted: offers.md not yet confirmed."],
  };
}
