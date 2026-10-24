/**
 * Database schema (Drizzle ORM, PostgreSQL on Supabase).
 *
 * This is a focused v1 of the schema from docs/research/05 with the merges
 * recommended in docs/research/00 (evidence ledger from 04, signal decay and
 * email-verification taxonomy from 01, tier set from 02).
 */
import { sql } from "drizzle-orm";
import {
  boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, real, text,
  timestamp, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";

/* ---------- helpers ---------- */
const pk = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());
const money = (name: string) => numeric(name, { precision: 12, scale: 6 });

/* ---------- enums ---------- */
export const campaignStatus = pgEnum("campaign_status", ["draft", "active", "paused", "completed", "archived"]);
export const leadStatus = pgEnum("lead_status", [
  "new", "qualifying", "qualified", "disqualified", "needs_research", "researching",
  "copy_ready", "in_review", "approved", "sent", "replied", "meeting_booked", "won", "lost",
  "nurture", "unsubscribed", "bounced", "do_not_contact",
]);
export const tier = pgEnum("tier", ["A", "B", "C", "DQ", "NEEDS_RESEARCH"]);
export const jobType = pgEnum("job_type", [
  "campaign_generate", "prescreen", "research", "qualify", "adjudicate", "copy", "reply_classify",
]);
export const runStatus = pgEnum("run_status", ["queued", "running", "succeeded", "failed", "needs_human"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "edited_approved", "rejected", "superseded"]);
export const channel = pgEnum("channel", ["email", "linkedin", "call"]);
export const emailStatus = pgEnum("email_status", [
  "valid", "valid_catchall_validated", "risky_catch_all", "unknown", "invalid", "role_based", "disposable",
]);
export const lawfulBasis = pgEnum("lawful_basis", [
  "legitimate_interest", "consent", "existing_customer", "not_required", "unknown",
]);
export const suppressionReason = pgEnum("suppression_reason", [
  "unsubscribed", "hard_bounce", "spam_complaint", "manual", "dsar_erasure", "customer", "competitor", "objection",
]);

/* ---------- settings & flags ---------- */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),                       // global_pause | pause_llm | monthly_budget_usd | ...
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

/* ---------- campaigns ---------- */
export const campaigns = pgTable("campaigns", {
  id: pk(),
  name: text("name").notNull(),
  status: campaignStatus("status").notNull().default("draft"),
  persona: text("persona").notNull(),                  // A..G (docs/research/03 §4)
  corridor: text("corridor").notNull(),                // derived: companyCountry->targetCountry
  offer: text("offer").notNull(),                      // OFF-0..OFF-8
  goal: text("goal"),
  notes: text("notes"),
  // Targeting (src/lib/targeting.ts)
  niche: text("niche"),                                // d2c | saas | pe_vc | family
  subNiche: text("sub_niche"),                         // beauty | fashion | ...
  companyCountry: varchar("company_country", { length: 2 }),
  companyCity: text("company_city"),
  targetCountry: varchar("target_country", { length: 2 }),
  targetCity: text("target_city"),
  companySizes: text("company_sizes").array(),         // "51,200" ranges (Apollo format)
  roles: text("roles").array(),                        // role group values
  keywords: text("keywords"),                          // extra free-text keywords
  brief: jsonb("brief").$type<CampaignBrief | null>(),// Claude-generated plan (schemas/campaign.ts)
  dailyNewLeadCap: integer("daily_new_lead_cap").notNull().default(30),
  agentRunId: uuid("agent_run_id"),
  createdAt: createdAt(), updatedAt: updatedAt(),
});

/* ---------- companies & people ---------- */
export const companies = pgTable("companies", {
  id: pk(),
  name: text("name").notNull(),
  domain: varchar("domain", { length: 255 }),           // lowercase, no www
  hqCountry: varchar("hq_country", { length: 2 }),
  industry: text("industry"),
  employeeRange: text("employee_range"),
  revenueBandUsd: text("revenue_band_usd"),
  description: text("description"),
  linkedinUrl: text("linkedin_url"),
  lastResearchedAt: timestamp("last_researched_at", { withTimezone: true }),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (t) => [uniqueIndex("companies_domain").on(t.domain).where(sql`${t.domain} is not null`)]);

export const people = pgTable("people", {
  id: pk(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  firstName: text("first_name"), lastName: text("last_name"),
  fullName: text("full_name").notNull(),
  title: text("title"),
  email: text("email"),                                 // v1: plain; encrypt in v2 (docs/research/05 §7.1)
  emailHash: varchar("email_hash", { length: 64 }),     // sha256(lower(email)) for suppression + dedupe
  emailStatus: emailStatus("email_status").notNull().default("unknown"),
  linkedinUrl: text("linkedin_url"),
  country: varchar("country", { length: 2 }),
  status: leadStatus("status").notNull().default("new"),
  tier: tier("tier"),
  score: real("score"),
  source: text("source"),                                // csv | manual | apollo | ...
  sourceDescription: text("source_description"),
  lawfulBasis: lawfulBasis("lawful_basis").notNull().default("unknown"),
  publicationEvidenceUrl: text("publication_evidence_url"), // CASL / Spam Act
  notes: text("notes"),
  doNotContact: boolean("do_not_contact").notNull().default(false),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  nextStep: integer("next_step"),                       // next email step due (sequence tracking)
  nextStepDue: date("next_step_due"),
  retentionUntil: date("retention_until"),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("people_email_hash").on(t.emailHash).where(sql`${t.emailHash} is not null`),
  index("people_status").on(t.status),
  index("people_campaign").on(t.campaignId),
]);

/* ---------- signals (intent) ---------- */
export const signals = pgTable("signals", {
  id: pk(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull(),           // job_post_market_lead | new_subsidiary | funding | expansion_press | ...
  targetMarket: varchar("target_market", { length: 2 }),
  title: text("title").notNull(),
  summary: text("summary"),
  evidenceUrl: text("evidence_url"),
  source: text("source"),
  eventDate: date("event_date"),
  weight: integer("weight").notNull().default(10),
  decayHalfLifeDays: integer("decay_half_life_days").notNull().default(45),
  createdAt: createdAt(),
}, (t) => [index("signals_company").on(t.companyId)]);

/* ---------- every Claude call ---------- */
export const agentRuns = pgTable("agent_runs", {
  id: pk(),
  jobType: jobType("job_type").notNull(),
  subjectType: text("subject_type").notNull(),          // campaign | person | company
  subjectId: uuid("subject_id").notNull(),
  status: runStatus("status").notNull().default("queued"),
  model: text("model").notNull(),
  effort: text("effort"),
  promptVersion: text("prompt_version").notNull(),
  mode: text("mode").notNull().default("live"),         // live | mock
  input: jsonb("input"),
  output: jsonb("output"),
  stopReason: text("stop_reason"),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  cacheReadTokens: integer("cache_read_tokens").default(0),
  cacheWriteTokens: integer("cache_write_tokens").default(0),
  webSearches: integer("web_searches").default(0),
  costUsd: money("cost_usd").default("0"),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  createdAt: createdAt(),
}, (t) => [index("agent_runs_subject").on(t.subjectType, t.subjectId), index("agent_runs_created").on(t.createdAt)]);

/* ---------- evidence ledger (research citations) ---------- */
export const evidence = pgTable("evidence", {
  id: pk(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  agentRunId: uuid("agent_run_id").references(() => agentRuns.id),
  evidenceId: text("evidence_id").notNull(),           // E1, E2 ... (unique per company research run)
  criteria: text("criteria").array(),                   // C1..C8
  claim: text("claim").notNull(),
  url: text("url"),
  title: text("title"),
  citedText: text("cited_text"),
  publishedDate: text("published_date"),               // YYYY-MM-DD | YYYY-MM | undated
  sourceType: text("source_type"),                      // web_search | web_fetch | user_input
  createdAt: createdAt(),
}, (t) => [index("evidence_company").on(t.companyId)]);

/* ---------- qualification scores ---------- */
export const scores = pgTable("scores", {
  id: pk(),
  personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  agentRunId: uuid("agent_run_id").references(() => agentRuns.id),
  rubricVersion: text("rubric_version").notNull(),
  levels: jsonb("levels").$type<Record<string, string>>().notNull(),   // C1..C8 -> L0..L4 | UNKNOWN
  points: jsonb("points").$type<Record<string, number>>().notNull(),
  total: real("total").notNull(),
  tier: tier("tier").notNull(),
  confidence: text("confidence"),
  primaryOffer: text("primary_offer"),
  reviewerSummary: text("reviewer_summary"),
  hooks: jsonb("hooks").$type<{ hook: string; evidence_id: string }[]>(),
  flags: text("flags").array(),
  raw: jsonb("raw"),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [index("scores_person").on(t.personId, t.isCurrent)]);

/* ---------- messages & reviews ---------- */
export const messages = pgTable("messages", {
  id: pk(),
  personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  agentRunId: uuid("agent_run_id").references(() => agentRuns.id),
  channel: channel("channel").notNull(),
  step: integer("step").notNull().default(1),
  version: integer("version").notNull().default(1),
  subject: text("subject"),
  body: text("body").notNull(),
  factsUsed: jsonb("facts_used").$type<{ fact: string; evidence_id: string }[]>(),
  qaFlags: text("qa_flags").array(),
  status: reviewStatus("status").notNull().default("pending"),
  dayOffset: integer("day_offset").notNull().default(0),  // days after step 1 this should go out
  gmailDraftId: text("gmail_draft_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (t) => [index("messages_person").on(t.personId), index("messages_status").on(t.status)]);

export const reviews = pgTable("reviews", {
  id: pk(),
  personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),                           // lead_package | score
  status: reviewStatus("status").notNull().default("pending"),
  priority: integer("priority").notNull().default(50),
  decision: jsonb("decision"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("reviews_queue").on(t.status, t.priority, t.createdAt)]);

/* ---------- compliance ---------- */
export const suppressionList = pgTable("suppression_list", {
  id: pk(),
  kind: text("kind").notNull(),                           // email | domain | linkedin
  valueHash: varchar("value_hash", { length: 64 }).notNull(),
  reason: suppressionReason("reason").notNull(),
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("suppression_kind_hash").on(t.kind, t.valueHash)]);

export const auditLog = pgTable("audit_log", {
  id: pk(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actor: text("actor").notNull(),                         // user:<email> | system
  action: text("action").notNull(),                       // message.approve, person.import, ...
  subjectType: text("subject_type"),
  subjectId: text("subject_id"),
  details: jsonb("details"),
});

/* ---------- lead finding (agents / connectors) ---------- */
export const finderSource = pgEnum("finder_source", ["claude_web", "apollo", "signals", "hunter"]);
export const candidateStatus = pgEnum("candidate_status", ["new", "imported", "dismissed"]);

export const finderRuns = pgTable("finder_runs", {
  id: pk(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  source: finderSource("source").notNull(),
  status: runStatus("status").notNull().default("queued"),
  query: jsonb("query"),                                 // what was searched
  found: integer("found").notNull().default(0),
  costUsd: money("cost_usd").default("0"),
  creditsUsed: integer("credits_used").default(0),
  log: text("log"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [index("finder_runs_campaign").on(t.campaignId, t.startedAt)]);

export const candidates = pgTable("candidates", {
  id: pk(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  finderRunId: uuid("finder_run_id").references(() => finderRuns.id, { onDelete: "set null" }),
  source: finderSource("source").notNull(),
  status: candidateStatus("status").notNull().default("new"),
  companyName: text("company_name").notNull(),
  domain: varchar("domain", { length: 255 }),
  companyCountry: varchar("company_country", { length: 2 }),
  companyCity: text("company_city"),
  industry: text("industry"),
  employeeRange: text("employee_range"),
  fullName: text("full_name"),                           // null = company only, people still to find
  firstName: text("first_name"),
  title: text("title"),
  email: text("email"),
  emailStatus: emailStatus("email_status").notNull().default("unknown"),
  linkedinUrl: text("linkedin_url"),
  externalId: text("external_id"),                        // apollo person id etc.
  signal: text("signal"),                                 // why this company: "Hiring Country Manager UAE (2026-10-02)"
  signalUrl: text("signal_url"),
  sourceUrl: text("source_url"),                          // where the person/company was found
  confidence: real("confidence"),                         // 0..1
  dedupeKey: varchar("dedupe_key", { length: 64 }).notNull(), // sha256(campaign|domain-or-company|name)
  personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("candidates_dedupe").on(t.dedupeKey), index("candidates_campaign_status").on(t.campaignId, t.status)]);

/* ---------- third-party provider calls (for monthly usage meters and auto-switch) ---------- */
export const providerCalls = pgTable("provider_calls", {
  id: pk(),
  provider: text("provider").notNull(),                   // hunter | anymailfinder | prospeo | apollo | reoon | theirstack | claude ...
  action: text("action").notNull(),                       // find_email | verify_email | reveal | search | test
  ok: boolean("ok").notNull(),
  charged: boolean("charged").notNull().default(true),   // did this call consume a credit?
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [index("provider_calls_provider_time").on(t.provider, t.createdAt)]);

/* ---------- types shared with the UI ---------- */
export type CampaignBrief = {
  positioning: string;
  icp: { summary: string; must_haves: string[]; exclusions: string[]; buyer_titles: string[] };
  signals: { type: string; why: string; detection: string }[];
  subject_lines: string[];
  sequence: { step: number; day: number; channel: "email" | "linkedin"; purpose: string; body: string }[];
  linkedin_note: string;
  objections: { objection: string; response: string }[];
  risks: string[];
};
