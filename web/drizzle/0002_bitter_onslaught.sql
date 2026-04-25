CREATE TABLE "overlay_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"payout_address" varchar(42) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_settings_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"voting_id" integer NOT NULL,
	"voter_address" varchar(42) NOT NULL,
	"option_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"title" text NOT NULL,
	"options" jsonb NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donation" ALTER COLUMN "currency" SET DEFAULT 'MON';--> statement-breakpoint
ALTER TABLE "donation" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "donation" ADD COLUMN "block_number" text;--> statement-breakpoint
ALTER TABLE "overlay_configs" ADD CONSTRAINT "overlay_configs_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_settings" ADD CONSTRAINT "payout_settings_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voting_id_voting_id_fk" FOREIGN KEY ("voting_id") REFERENCES "public"."voting"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting" ADD CONSTRAINT "voting_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "overlay_profile_type_idx" ON "overlay_configs" USING btree ("profile_id","type");--> statement-breakpoint
CREATE INDEX "voting_voter_idx" ON "votes" USING btree ("voting_id","voter_address");