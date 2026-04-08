CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text NOT NULL,
	"name_am" text NOT NULL,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"blocked_user_id" varchar NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"cyrillic_name" text,
	"country" text,
	"category" text,
	"vehicle_type" text DEFAULT 'passenger' NOT NULL,
	"popular" boolean DEFAULT false NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience" text NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"admin_id" varchar,
	"admin_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"vehicle_type" text DEFAULT 'passenger' NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"generation" text,
	"version" text,
	"modification_id" integer,
	"configuration_id" integer,
	"year" integer NOT NULL,
	"price" integer NOT NULL,
	"original_price" integer,
	"credit_discount" integer,
	"trade_in_discount" integer,
	"insurance_discount" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"mileage" integer NOT NULL,
	"body_type" text NOT NULL,
	"fuel_type" text NOT NULL,
	"transmission" text NOT NULL,
	"drive_type" text NOT NULL,
	"engine_volume" real NOT NULL,
	"horsepower" integer NOT NULL,
	"color" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video_url" text,
	"description" text DEFAULT '',
	"location" text DEFAULT '',
	"condition" text DEFAULT 'used' NOT NULL,
	"vin" text,
	"steering_wheel" text DEFAULT 'left' NOT NULL,
	"customs_cleared" boolean DEFAULT true NOT NULL,
	"customs_paid_by" text,
	"customs_duty_amount" integer,
	"customs_environmental_fee" integer,
	"customs_registration_fee" integer,
	"customs_total_cost" integer,
	"has_gas_equipment" boolean DEFAULT false NOT NULL,
	"exchange_possible" boolean DEFAULT false NOT NULL,
	"exchange_details" text,
	"installment_possible" boolean DEFAULT false NOT NULL,
	"installment_details" text,
	"credit_available" boolean DEFAULT false NOT NULL,
	"trade_in_available" boolean DEFAULT false NOT NULL,
	"trade_in_max_age" integer,
	"trade_in_bonus" integer,
	"owners_count" integer DEFAULT 1 NOT NULL,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"import_country" text,
	"accident_history" text DEFAULT 'none' NOT NULL,
	"body_damages" jsonb DEFAULT '{}'::jsonb,
	"last_service_date" text,
	"keys_count" integer DEFAULT 1 NOT NULL,
	"warranty" text,
	"availability" text DEFAULT 'in_stock',
	"no_legal_issues" boolean,
	"acceleration" real,
	"fuel_consumption" real,
	"ground_clearance" integer,
	"trunk_volume" integer,
	"characteristics" jsonb DEFAULT '[]'::jsonb,
	"payload_capacity" integer,
	"axle_count" integer,
	"cabin_type" text,
	"wheel_configuration" text,
	"gross_weight" integer,
	"seating_capacity" integer,
	"cooling_type" text,
	"cylinder_count" integer,
	"operating_hours" integer,
	"chassis_type" text,
	"operating_weight" integer,
	"suspension_type" text,
	"euro_class" text,
	"seat_height" integer,
	"dry_weight" integer,
	"fuel_tank_capacity" real,
	"bucket_volume" real,
	"digging_depth" real,
	"boom_length" real,
	"blade_width" real,
	"traction_class" text,
	"lifting_capacity" integer,
	"lifting_height" real,
	"drum_volume" real,
	"roller_width" integer,
	"cutting_width" real,
	"has_pto" boolean,
	"drilling_depth" real,
	"paving_width" integer,
	"platform_capacity" integer,
	"credit_min_down_payment_percent" integer,
	"credit_interest_rate_from" real,
	"credit_max_months" integer,
	"credit_partner_bank_ids" jsonb DEFAULT '[]'::jsonb,
	"estimated_monthly_from" integer,
	"seller_name" text,
	"seller_phone" text,
	"seller_type" text DEFAULT 'private' NOT NULL,
	"branch_id" text,
	"premium" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'moderation' NOT NULL,
	"moderation_note" text,
	"moderated_at" timestamp,
	"views" integer DEFAULT 0 NOT NULL,
	"favorites_count" integer DEFAULT 0 NOT NULL,
	"entity_version" integer DEFAULT 1 NOT NULL,
	"bumped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"generation_id" integer,
	"model_id" integer,
	"brand_id" integer,
	"name" text NOT NULL,
	"body_type" text,
	"doors_count" integer,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_journal_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_journal_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_journal_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"dealer_id" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'AMD' NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"max_listings" integer DEFAULT 10 NOT NULL,
	"max_photos" integer DEFAULT 20 NOT NULL,
	"max_promo_days" integer DEFAULT 7 NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"free_promotions_monthly" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dealer_plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dealer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" text NOT NULL,
	"legal_form" text,
	"tax_id" text,
	"country" text,
	"city" text,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"website" text,
	"working_hours" text,
	"description" text,
	"logo_url" text,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"selected_plan_id" integer,
	"entity_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"listing_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"model_id" integer NOT NULL,
	"name" text NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"restyling" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"package_id" integer NOT NULL,
	"package_code" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"paid_by_dealer_plan" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"user_id" varchar,
	"ip_hash" varchar(64),
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"generation" text,
	"avg_rating" real DEFAULT 0 NOT NULL,
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"generation" text,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"brand_id" integer NOT NULL,
	"name" text NOT NULL,
	"cyrillic_name" text,
	"class" text,
	"year_from" integer,
	"year_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"configuration_id" integer,
	"generation_id" integer,
	"model_id" integer,
	"brand_id" integer,
	"name" text NOT NULL,
	"horse_power" integer,
	"engine_capacity" real,
	"engine_type" text,
	"transmission_code" text,
	"drive" text,
	"acceleration" real,
	"max_speed" integer,
	"fuel_consumption_city" real,
	"fuel_consumption_highway" real,
	"fuel_consumption_mixed" real,
	"length" integer,
	"width" integer,
	"height" integer,
	"wheel_base" integer,
	"clearance" integer,
	"weight" integer,
	"full_weight" integer,
	"trunk_min_capacity" integer,
	"trunk_max_capacity" integer,
	"fuel_tank_capacity" integer,
	"seats" text,
	"cylinders" integer,
	"volume" integer,
	"moment" integer,
	"gear_count" integer,
	"petrol_type" text,
	"safety_grade" integer,
	"safety_rating" text,
	"wheel_size" text,
	"front_brake" text,
	"back_brake" text,
	"front_suspension" text,
	"back_suspension" text,
	"kvt_power" real,
	"moment_rpm" integer,
	"rpm_power" integer,
	"cylinders_order" text,
	"valves" integer,
	"engine_feeding" text,
	"compression" real,
	"diameter" real,
	"piston_stroke" real,
	"emission_euro_class" text,
	"fuel_emission" real,
	"front_wheel_base" integer,
	"back_wheel_base" integer,
	"electric_range" integer,
	"battery_capacity" real,
	"charge_time" real,
	"full_charge_time" real,
	"quick_charge_time" real,
	"steering_wheel" text,
	"country_origin" text,
	"auto_class" text,
	"valvetrain" text,
	"engine_code" text,
	"origin_tires_size" text,
	"landing_wheels_size" text,
	"disk_size" text,
	"body_size" text,
	"ev_battery_type" text,
	"charging_port_types" text,
	"consumption_kwt" real,
	"quickcharge_description" text,
	"group_name" text,
	"is_closed" integer,
	"options" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"push_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "phone_otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"invalidated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"listing_id" integer NOT NULL,
	"target_price" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"old_price" integer NOT NULL,
	"new_price" integer NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pro_seller_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_amd" integer NOT NULL,
	"duration_days" integer,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pricing" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"icon" text DEFAULT 'star' NOT NULL,
	"color" text DEFAULT '#F59E0B' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_packages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"platform" text DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recently_viewed" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"listing_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" varchar NOT NULL,
	"listing_id" integer,
	"target_user_id" varchar,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"listing_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notifications_enabled" boolean DEFAULT false NOT NULL,
	"results_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sms_daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"total_cost" real DEFAULT 0 NOT NULL,
	CONSTRAINT "sms_daily_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "support_admin_read_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"admin_id" varchar NOT NULL,
	"last_read_message_id" integer DEFAULT 0 NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_role" text DEFAULT 'user' NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"assigned_to_id" varchar,
	"subject" text DEFAULT 'Чат с поддержкой' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount_amd" integer NOT NULL,
	"description" text,
	"listing_id" integer,
	"promotion_id" integer,
	"status" text DEFAULT 'completed' NOT NULL,
	"payment_method" text,
	"external_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"email" text,
	"phone" text,
	"name" text,
	"password" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"phone_verified_at" timestamp,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"admin_role" text,
	"verified" boolean DEFAULT false NOT NULL,
	"rating" real DEFAULT 0,
	"reviews_count" integer DEFAULT 0,
	"listings_count" integer DEFAULT 0,
	"city" text,
	"about" text,
	"company_name" text,
	"company_description" text,
	"company_logo_url" text,
	"company_cover_url" text,
	"dealer_specialization" text,
	"working_hours" text,
	"showroom_address" text,
	"showroom_lat" real,
	"showroom_lng" real,
	"website" text,
	"credit_program_enabled" boolean DEFAULT false,
	"credit_interest_rate" real,
	"credit_interest_rate_to" real,
	"credit_max_term" integer,
	"credit_min_down_payment" integer,
	"dealer_verified" boolean DEFAULT false,
	"trade_in_enabled" boolean DEFAULT false,
	"trade_in_max_age" integer,
	"trade_in_bonus" integer,
	"warranty_enabled" boolean DEFAULT false,
	"warranty_months" integer,
	"partner_bank_ids" jsonb DEFAULT '[]'::jsonb,
	"dealer_branches" jsonb DEFAULT '[]'::jsonb,
	"callback_enabled" boolean DEFAULT false,
	"showroom_photos" jsonb DEFAULT '[]'::jsonb,
	"avg_response_time" integer,
	"successful_deals" integer DEFAULT 0,
	"wallet_balance" integer DEFAULT 0 NOT NULL,
	"entity_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_journal_comments" ADD CONSTRAINT "dealer_journal_comments_post_id_dealer_journal_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."dealer_journal_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_journal_comments" ADD CONSTRAINT "dealer_journal_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_journal_likes" ADD CONSTRAINT "dealer_journal_likes_post_id_dealer_journal_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."dealer_journal_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_journal_likes" ADD CONSTRAINT "dealer_journal_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_journal_posts" ADD CONSTRAINT "dealer_journal_posts_dealer_id_users_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_requests" ADD CONSTRAINT "dealer_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_subscriptions" ADD CONSTRAINT "dealer_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_subscriptions" ADD CONSTRAINT "dealer_subscriptions_plan_id_dealer_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."dealer_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_promotions" ADD CONSTRAINT "listing_promotions_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_promotions" ADD CONSTRAINT "listing_promotions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_promotions" ADD CONSTRAINT "listing_promotions_package_id_promotion_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."promotion_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_reviews" ADD CONSTRAINT "model_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_configuration_id_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_seller_subscriptions" ADD CONSTRAINT "pro_seller_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_admin_read_status" ADD CONSTRAINT "support_admin_read_status_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_admin_read_status" ADD CONSTRAINT "support_admin_read_status_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listing_id_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."car_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_promotion_id_listing_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."listing_promotions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "car_listings_status_idx" ON "car_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "car_listings_brand_idx" ON "car_listings" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "car_listings_user_id_idx" ON "car_listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "car_listings_status_brand_idx" ON "car_listings" USING btree ("status","brand");--> statement-breakpoint
CREATE INDEX "car_listings_created_at_idx" ON "car_listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "favorites_user_listing_idx" ON "favorites" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "favorites_listing_id_idx" ON "favorites" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_views_listing_id_idx" ON "listing_views" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_views_viewed_at_idx" ON "listing_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "push_tokens_user_token_idx" ON "push_tokens" USING btree ("user_id","token");