CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"card_name" text NOT NULL,
	"issuer" text NOT NULL,
	"card_number" text NOT NULL,
	"points_balance" integer NOT NULL,
	"expire_date" text NOT NULL,
	"card_type" text NOT NULL,
	"color" text DEFAULT 'primary' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" serial PRIMARY KEY NOT NULL,
	"airline" text NOT NULL,
	"departure_time" text NOT NULL,
	"departure_airport" text NOT NULL,
	"arrival_time" text NOT NULL,
	"arrival_airport" text NOT NULL,
	"duration" text NOT NULL,
	"is_nonstop" boolean NOT NULL,
	"points_required" integer NOT NULL,
	"cash_price" integer NOT NULL,
	"rating" integer NOT NULL,
	"card_benefits" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"area" text NOT NULL,
	"rating" integer NOT NULL,
	"review_count" integer NOT NULL,
	"price_per_night" integer NOT NULL,
	"total_price" integer NOT NULL,
	"points_earned" integer NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"benefits" jsonb NOT NULL,
	"card_exclusive_offer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text DEFAULT '2025-05-08T17:02:16.659Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" text NOT NULL,
	"location" text NOT NULL,
	"distance_from_hotel" text NOT NULL,
	"offer_type" text NOT NULL,
	"offer_value" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"benefits" jsonb NOT NULL,
	"valid_through" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"membership_level" text DEFAULT 'Premium' NOT NULL,
	"picture_url" text,
	"created_at" text DEFAULT '2025-05-08T17:02:16.658Z' NOT NULL,
	"last_login" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;