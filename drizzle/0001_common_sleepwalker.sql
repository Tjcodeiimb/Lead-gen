CREATE TYPE "public"."candidate_status" AS ENUM('new', 'imported', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."finder_source" AS ENUM('claude_web', 'apollo', 'signals', 'hunter');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"finder_run_id" uuid,
	"source" "finder_source" NOT NULL,
	"status" "candidate_status" DEFAULT 'new' NOT NULL,
	"company_name" text NOT NULL,
	"domain" varchar(255),
	"company_country" varchar(2),
	"company_city" text,
	"industry" text,
	"employee_range" text,
	"full_name" text,
	"first_name" text,
	"title" text,
	"email" text,
	"email_status" "email_status" DEFAULT 'unknown' NOT NULL,
	"linkedin_url" text,
	"external_id" text,
	"signal" text,
	"signal_url" text,
	"source_url" text,
	"confidence" real,
	"dedupe_key" varchar(64) NOT NULL,
	"person_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finder_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"source" "finder_source" NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"query" jsonb,
	"found" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(12, 6) DEFAULT '0',
	"credits_used" integer DEFAULT 0,
	"log" text,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now(),
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "niche" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "sub_niche" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "company_country" varchar(2);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "company_city" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "target_country" varchar(2);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "target_city" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "company_sizes" text[];--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "roles" text[];--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "keywords" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "day_offset" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "gmail_draft_id" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "next_step" integer;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "next_step_due" date;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_finder_run_id_finder_runs_id_fk" FOREIGN KEY ("finder_run_id") REFERENCES "public"."finder_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finder_runs" ADD CONSTRAINT "finder_runs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidates_dedupe" ON "candidates" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "candidates_campaign_status" ON "candidates" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "finder_runs_campaign" ON "finder_runs" USING btree ("campaign_id","started_at");