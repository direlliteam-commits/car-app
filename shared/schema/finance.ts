import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";
import { carListings } from "./listings";

export const promotionPackages = pgTable("promotion_packages", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  priceAmd: integer("price_amd").notNull(),
  durationDays: integer("duration_days"),
  features: jsonb("features").$type<string[]>().default([]).notNull(),
  pricing: jsonb("pricing").$type<{ days: number; price: number }[]>().default([]).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  icon: text("icon").default("star").notNull(),
  color: text("color").default("#F59E0B").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listingPromotions = pgTable("listing_promotions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packageId: integer("package_id").notNull().references(() => promotionPackages.id, { onDelete: "cascade" }),
  packageCode: text("package_code").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").default(true).notNull(),
  paidByDealerPlan: boolean("paid_by_dealer_plan").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amountAmd: integer("amount_amd").notNull(),
  description: text("description"),
  listingId: integer("listing_id").references(() => carListings.id, { onDelete: "set null" }),
  promotionId: integer("promotion_id").references(() => listingPromotions.id, { onDelete: "set null" }),
  status: text("status").default("completed").notNull(),
  paymentMethod: text("payment_method"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dealerPlans = pgTable("dealer_plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  currency: varchar("currency", { length: 10 }).default("AMD").notNull(),
  durationDays: integer("duration_days").default(30).notNull(),
  maxListings: integer("max_listings").default(10).notNull(),
  maxPhotos: integer("max_photos").default(20).notNull(),
  maxPromoDays: integer("max_promo_days").default(7).notNull(),
  features: jsonb("features").$type<string[]>().default([]),
  freePromotionsMonthly: integer("free_promotions_monthly").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dealerSubscriptions = pgTable("dealer_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => dealerPlans.id, { onDelete: "cascade" }),
  status: text("status").default("active").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proSellerSubscriptions = pgTable("pro_seller_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("active").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchasePromotionSchema = z.object({
  listingId: z.number().int().positive(),
  packageCode: z.string().min(1).max(50),
  durationDays: z.number().int().positive().optional(),
  paymentMethod: z.enum(["wallet", "idram", "telcell"]).optional(),
});

export const topupWalletSchema = z.object({
  amount: z.number().int().positive().min(100),
  paymentMethod: z.enum(["idram", "telcell"]),
});

export type PromotionPackage = typeof promotionPackages.$inferSelect;
export type ListingPromotion = typeof listingPromotions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type DealerPlan = typeof dealerPlans.$inferSelect;
export type ProSellerSubscription = typeof proSellerSubscriptions.$inferSelect;
