CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('email', 'linkedin', 'call');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('valid', 'valid_catchall_validated', 'risky_catch_all', 'unknown', 'invalid', 'role_based', 'disposable');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('campaign_generate', 'prescreen', 'research', 'qualify', 'adjudicate', 'copy', 'reply_classify');--> statement-breakpoint
CREATE TYPE "public"."lawful_basis" AS ENUM('legitimate_interest', 'consent', 'existing_customer', 'not_required', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'qualifying', 'qualified', 'disqualified', 'needs_research', 'researching', 'copy_ready', 'in_review', 'approved', 'sent', 'replied', 'meeting_booked', 'won', 'lost', 'nurture', 'unsubscribed', 'bounced', 'do_not_contact');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'edited_approved', 'rejected', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'needs_human');--> statement-breakpoint
CREATE TYPE "public"."suppression_reason" AS ENUM('unsubscribed', 'hard_bounce', 'spam_complaint', 'manual', 'dsar_erasure', 'customer', 'competitor', 'objection');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('A', 'B', 'C', 'DQ', 'NEEDS_RESEARCH');--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" "job_type" NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"model" text NOT NULL,
	"effort" text,
	"prompt_version" text NOT NULL,
	"mode" text DEFAULT 'live' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"stop_reason" text,
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"cache_read_tokens" integer DEFAULT 0,
	"cache_write_tokens" integer DEFAULT 0,
	"web_searches" integer DEFAULT 0,
	"cost_usd" numeric(12, 6) DEFAULT '0',
	"latency_ms" integer,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"subject_type" text,
	"subject_id" text,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"persona" text NOT NULL,
	"corridor" text NOT NULL,
	"offer" text NOT NULL,
	"goal" text,
	"notes" text,
	"brief" jsonb,
	"daily_new_lead_cap" integer DEFAULT 30 NOT NULL,
	"agent_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" varchar(255),
	"hq_country" varchar(2),
	"industry" text,
	"employee_range" text,
	"revenue_band_usd" text,
	"description" text,
	"linkedin_url" text,
	"last_researched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_run_id" uuid,
	"evidence_id" text NOT NULL,
	"criteria" text[],
	"claim" text NOT NULL,
	"url" text,
	"title" text,
	"cited_text" text,
	"published_date" text,
	"source_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"campaign_id" uuid,
	"agent_run_id" uuid,
	"channel" "channel" NOT NULL,
	"step" integer DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"facts_used" jsonb,
	"qa_flags" text[],
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"campaign_id" uuid,
	"first_name" text,
	"last_name" text,
	"full_name" text NOT NULL,
	"title" text,
	"email" text,
	"email_hash" varchar(64),
	"email_status" "email_status" DEFAULT 'unknown' NOT NULL,
	"linkedin_url" text,
	"country" varchar(2),
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"tier" "tier",
	"score" real,
	"source" text,
	"source_description" text,
	"lawful_basis" "lawful_basis" DEFAULT 'unknown' NOT NULL,
	"publication_evidence_url" text,
	"notes" text,
	"do_not_contact" boolean DEFAULT false NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"retention_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"decision" jsonb,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"agent_run_id" uuid,
	"rubric_version" text NOT NULL,
	"levels" jsonb NOT NULL,
	"points" jsonb NOT NULL,
	"total" real NOT NULL,
	"tier" "tier" NOT NULL,
	"confidence" text,
	"primary_offer" text,
	"reviewer_summary" text,
	"hooks" jsonb,
	"flags" text[],
	"raw" jsonb,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type" text NOT NULL,
	"target_market" varchar(2),
	"title" text NOT NULL,
	"summary" text,
	"evidence_url" text,
	"source" text,
	"event_date" date,
	"weight" integer DEFAULT 10 NOT NULL,
	"decay_half_life_days" integer DEFAULT 45 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppression_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"value_hash" varchar(64) NOT NULL,
	"reason" "suppression_reason" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_runs_subject" ON "agent_runs" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "agent_runs_created" ON "agent_runs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_domain" ON "companies" USING btree ("domain") WHERE "companies"."domain" is not null;--> statement-breakpoint
CREATE INDEX "evidence_company" ON "evidence" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "messages_person" ON "messages" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "messages_status" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "people_email_hash" ON "people" USING btree ("email_hash") WHERE "people"."email_hash" is not null;--> statement-breakpoint
CREATE INDEX "people_status" ON "people" USING btree ("status");--> statement-breakpoint
CREATE INDEX "people_campaign" ON "people" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "reviews_queue" ON "reviews" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "scores_person" ON "scores" USING btree ("person_id","is_current");--> statement-breakpoint
CREATE INDEX "signals_company" ON "signals" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppression_kind_hash" ON "suppression_list" USING btree ("kind","value_hash");