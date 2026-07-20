CREATE TYPE "public"."kyc_status" AS ENUM('NONE', 'REQUESTED', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."stake_status" AS ENUM('ACTIVE', 'COMPLETED', 'BROKEN');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'STAKE', 'UNSTAKE', 'INTEREST', 'REFERRAL_REWARD', 'MANUAL_CREDIT', 'MANUAL_DEBIT');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('DEPOSIT', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'STAKE_MATURED', 'REFERRAL_EARNED', 'ADMIN_MESSAGE');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text,
	"email" text NOT NULL,
	"password_hash" text,
	"full_name" text,
	"location" text,
	"mpesa_number" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"available_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_earnings" numeric(15, 2) DEFAULT '0' NOT NULL,
	"referral_rewards" numeric(15, 2) DEFAULT '0' NOT NULL,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'NONE' NOT NULL,
	"kyc_document_url" text,
	"kyc_requested_at" timestamp with time zone,
	"bank_name" text,
	"bank_account_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "staking_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"duration_days" integer NOT NULL,
	"roi_percent" numeric(8, 4) NOT NULL,
	"min_amount" numeric(15, 2) NOT NULL,
	"max_amount" numeric(15, 2) NOT NULL,
	"early_withdrawal_penalty" numeric(8, 4) DEFAULT '10' NOT NULL,
	"lock_period_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"principal_amount" numeric(15, 2) NOT NULL,
	"current_value" numeric(15, 2) NOT NULL,
	"accrued_interest" numeric(15, 2) DEFAULT '0' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" "stake_status" DEFAULT 'ACTIVE' NOT NULL,
	"auto_invest" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"description" text NOT NULL,
	"external_reference" text,
	"payhero_ref" text,
	"phone_number" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referee_id" integer NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"reward_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" text NOT NULL,
	"target_user_id" integer,
	"note" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_plan_id_staking_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."staking_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;