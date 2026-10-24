CREATE TABLE "provider_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"action" text NOT NULL,
	"ok" boolean NOT NULL,
	"charged" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "provider_calls_provider_time" ON "provider_calls" USING btree ("provider","created_at");