import { sql, type InferSelectModel } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, real, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface DealerBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  phones: string[];
  workingHours: string;
  callsOnlyDuringHours: boolean;
  callbackEnabled: boolean;
  photos: string[];
  specializations: string[];
  warrantyEnabled: boolean;
  warrantyMonths: number;
  tradeInEnabled: boolean;
  tradeInMaxAge: number;
  tradeInBonus: number;
  creditProgramEnabled: boolean;
  creditInterestRate: number;
  creditMaxTerm: number;
  creditMinDownPayment: number;
  partnerBankIds: number[];
}

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  name: text("name"),
  password: text("password"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user").notNull(),
  adminRole: text("admin_role"),
  verified: boolean("verified").default(false).notNull(),
  rating: real("rating").default(0),
  reviewsCount: integer("reviews_count").default(0),
  listingsCount: integer("listings_count").default(0),
  extraListingSlots: integer("extra_listing_slots").default(0),
  city: text("city"),
  about: text("about"),
  companyName: text("company_name"),
  companyDescription: text("company_description"),
  companyLogoUrl: text("company_logo_url"),
  companyCoverUrl: text("company_cover_url"),
  dealerSpecialization: text("dealer_specialization"),
  workingHours: text("working_hours"),
  showroomAddress: text("showroom_address"),
  showroomLat: real("showroom_lat"),
  showroomLng: real("showroom_lng"),
  website: text("website"),
  creditProgramEnabled: boolean("credit_program_enabled").default(false),
  creditInterestRate: real("credit_interest_rate"),
  creditInterestRateTo: real("credit_interest_rate_to"),
  creditMaxTerm: integer("credit_max_term"),
  creditMinDownPayment: integer("credit_min_down_payment"),
  dealerVerified: boolean("dealer_verified").default(false),
  tradeInEnabled: boolean("trade_in_enabled").default(false),
  tradeInMaxAge: integer("trade_in_max_age"),
  tradeInBonus: integer("trade_in_bonus"),
  warrantyEnabled: boolean("warranty_enabled").default(false),
  warrantyMonths: integer("warranty_months"),
  partnerBankIds: jsonb("partner_bank_ids").$type<number[]>().default([]),
  dealerBranches: jsonb("dealer_branches").$type<DealerBranch[]>().default([]),
  callbackEnabled: boolean("callback_enabled").default(false),
  showroomPhotos: jsonb("showroom_photos").default([]),
  avgResponseTime: integer("avg_response_time"),
  successfulDeals: integer("successful_deals").default(0),
  walletBalance: integer("wallet_balance").default(0).notNull(),
  entityVersion: integer("entity_version").default(1).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const phoneOtpCodes = pgTable("phone_otp_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  invalidated: boolean("invalidated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smsDailyStats = pgTable("sms_daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  count: integer("count").default(0).notNull(),
  totalCost: real("total_cost").default(0).notNull(),
});

export const banks = pgTable("banks", {
  id: serial("id").primaryKey(),
  nameRu: text("name_ru").notNull(),
  nameEn: text("name_en").notNull(),
  nameAm: text("name_am").notNull(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedUserId: varchar("blocked_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  platform: text("platform").default("unknown").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("push_tokens_user_token_idx").on(table.userId, table.token),
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>(),
  read: boolean("read").default(false).notNull(),
  pushSent: boolean("push_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  adminId: varchar("admin_id").references(() => users.id, { onDelete: "set null" }),
  adminName: text("admin_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  name: true,
  phoneVerified: true,
  phoneVerifiedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, "Имя пользователя: минимум 3 символа")
    .max(30, "Имя пользователя: максимум 30 символов")
    .regex(/^[a-zA-Z0-9_]+$/, "Имя пользователя: только латиница, цифры и _"),
  password: z.string()
    .min(6, "Пароль: минимум 6 символов"),
  email: z.string().email("Некорректный email"),
  phone: z.string()
    .min(1, "Телефон обязателен")
    .optional()
    .or(z.literal("")),
  name: z.string()
    .min(2, "Имя: минимум 2 символа")
    .max(50, "Имя: максимум 50 символов"),
});

export const phoneOtpSendSchema = z.object({
  phone: z.string().min(1, "Телефон обязателен"),
});

export const phoneOtpVerifySchema = z.object({
  phone: z.string().min(1, "Телефон обязателен"),
  code: z.string().length(6, "Код должен быть 6 цифр"),
});

export const tokenRefreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token обязателен"),
});

export const confirmIdentitySchema = z.object({
  phone: z.string().min(1, "Телефон обязателен"),
  challengeToken: z.string().min(1, "Challenge token обязателен"),
});

export const disownAccountSchema = z.object({
  phone: z.string().min(1, "Телефон обязателен"),
  challengeToken: z.string().min(1, "Challenge token обязателен"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(50).regex(/^[^\d_]+$/, "Имя не должно содержать цифры и подчёркивания").optional(),
  phone: z.union([z.literal(""), z.string().min(1)]).optional(),
  city: z.string().max(100).optional(),
  about: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  companyCoverUrl: z.string().url().optional().nullable(),
  companyLogoUrl: z.string().url().optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  companyDescription: z.string().max(2000).optional().nullable(),
  dealerSpecialization: z.string().max(200).optional().nullable(),
  workingHours: z.string().max(100).optional().nullable(),
  showroomAddress: z.string().max(300).optional().nullable(),
  showroomLat: z.number().min(-90).max(90).optional().nullable(),
  showroomLng: z.number().min(-180).max(180).optional().nullable(),
  website: z.union([z.literal(""), z.literal(null), z.string().max(200).regex(/^https?:\/\/.+\..+/, "Некорректный URL")]).optional().nullable(),
  creditProgramEnabled: z.boolean().optional(),
  creditInterestRate: z.number().min(0).max(100).optional().nullable(),
  creditInterestRateTo: z.number().min(0).max(100).optional().nullable(),
  creditMaxTerm: z.number().int().min(6).max(120).optional().nullable(),
  creditMinDownPayment: z.number().int().min(0).max(90).optional().nullable(),
  tradeInEnabled: z.boolean().optional(),
  tradeInMaxAge: z.number().int().min(1).max(30).optional().nullable(),
  tradeInBonus: z.number().int().min(0).max(50).optional().nullable(),
  warrantyEnabled: z.boolean().optional(),
  warrantyMonths: z.number().int().min(1).max(120).optional().nullable(),
  partnerBankIds: z.array(z.number().int().positive()).optional(),
  dealerBranches: z.array(z.object({
    id: z.string(),
    name: z.string().max(100),
    address: z.string().max(300),
    city: z.string().max(100),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    phones: z.array(z.string().max(20)).max(5),
    workingHours: z.string().max(100),
    callsOnlyDuringHours: z.boolean(),
    callbackEnabled: z.boolean(),
    photos: z.array(z.string().max(500)).max(10).optional(),
    specializations: z.array(z.string().max(50)).max(20).optional(),
    warrantyEnabled: z.boolean().optional(),
    warrantyMonths: z.number().min(0).max(120).optional(),
    tradeInEnabled: z.boolean().optional(),
    tradeInMaxAge: z.number().min(0).max(50).optional(),
    tradeInBonus: z.number().min(0).max(100).optional(),
    creditProgramEnabled: z.boolean().optional(),
    creditInterestRate: z.number().min(0).max(100).optional(),
    creditMaxTerm: z.number().min(0).max(360).optional(),
    creditMinDownPayment: z.number().min(0).max(100).optional(),
    partnerBankIds: z.array(z.number()).max(50).optional(),
  })).max(10).optional(),
  callbackEnabled: z.boolean().optional(),
  callsOnlyDuringHours: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(6).max(6),
  email: z.string().email(),
  newPassword: z.string().min(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional().default(""),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "password">;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
