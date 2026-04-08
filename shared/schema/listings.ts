import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import type { CarFilters } from "../../types/filters";

export const carListings = pgTable("car_listings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleType: text("vehicle_type").default("passenger").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  generation: text("generation"),
  version: text("version"),
  modificationId: integer("modification_id"),
  configurationId: integer("configuration_id"),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  creditDiscount: integer("credit_discount"),
  tradeInDiscount: integer("trade_in_discount"),
  insuranceDiscount: integer("insurance_discount"),
  currency: text("currency").default("USD").notNull(),
  mileage: integer("mileage").notNull(),
  bodyType: text("body_type").notNull(),
  fuelType: text("fuel_type").notNull(),
  transmission: text("transmission").notNull(),
  driveType: text("drive_type").notNull(),
  engineVolume: real("engine_volume").notNull(),
  horsepower: integer("horsepower").notNull(),
  color: text("color").notNull(),
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  videoUrl: text("video_url"),
  description: text("description").default(""),
  location: text("location").default(""),
  condition: text("condition").default("used").notNull(),
  vin: text("vin"),
  steeringWheel: text("steering_wheel").default("left").notNull(),
  customsCleared: boolean("customs_cleared").default(true).notNull(),
  customsPaidBy: text("customs_paid_by"),
  customsDutyAmount: integer("customs_duty_amount"),
  customsEnvironmentalFee: integer("customs_environmental_fee"),
  customsRegistrationFee: integer("customs_registration_fee"),
  customsTotalCost: integer("customs_total_cost"),
  hasGasEquipment: boolean("has_gas_equipment").default(false).notNull(),
  exchangePossible: boolean("exchange_possible").default(false).notNull(),
  exchangeDetails: text("exchange_details"),
  installmentPossible: boolean("installment_possible").default(false).notNull(),
  installmentDetails: text("installment_details"),
  creditAvailable: boolean("credit_available").default(false).notNull(),
  tradeInAvailable: boolean("trade_in_available").default(false).notNull(),
  tradeInMaxAge: integer("trade_in_max_age"),
  tradeInBonus: integer("trade_in_bonus"),
  ownersCount: integer("owners_count").default(1).notNull(),
  equipment: jsonb("equipment").$type<string[]>().default([]).notNull(),
  importCountry: text("import_country"),
  accidentHistory: text("accident_history").default("none").notNull(),
  bodyDamages: jsonb("body_damages").$type<Record<string, string>>().default({}),
  lastServiceDate: text("last_service_date"),
  keysCount: integer("keys_count").default(1).notNull(),
  warranty: text("warranty"),
  availability: text("availability").default("in_stock"),
  noLegalIssues: boolean("no_legal_issues"),
  acceleration: real("acceleration"),
  fuelConsumption: real("fuel_consumption"),
  groundClearance: integer("ground_clearance"),
  trunkVolume: integer("trunk_volume"),
  characteristics: jsonb("characteristics").$type<string[]>().default([]),
  payloadCapacity: integer("payload_capacity"),
  axleCount: integer("axle_count"),
  cabinType: text("cabin_type"),
  wheelConfiguration: text("wheel_configuration"),
  grossWeight: integer("gross_weight"),
  seatingCapacity: integer("seating_capacity"),
  coolingType: text("cooling_type"),
  cylinderCount: integer("cylinder_count"),
  operatingHours: integer("operating_hours"),
  chassisType: text("chassis_type"),
  operatingWeight: integer("operating_weight"),
  suspensionType: text("suspension_type"),
  euroClass: text("euro_class"),
  seatHeight: integer("seat_height"),
  dryWeight: integer("dry_weight"),
  fuelTankCapacity: real("fuel_tank_capacity"),
  bucketVolume: real("bucket_volume"),
  diggingDepth: real("digging_depth"),
  boomLength: real("boom_length"),
  bladeWidth: real("blade_width"),
  tractionClass: text("traction_class"),
  liftingCapacity: integer("lifting_capacity"),
  liftingHeight: real("lifting_height"),
  drumVolume: real("drum_volume"),
  rollerWidth: integer("roller_width"),
  cuttingWidth: real("cutting_width"),
  hasPTO: boolean("has_pto"),
  drillingDepth: real("drilling_depth"),
  pavingWidth: integer("paving_width"),
  platformCapacity: integer("platform_capacity"),
  creditMinDownPaymentPercent: integer("credit_min_down_payment_percent"),
  creditInterestRateFrom: real("credit_interest_rate_from"),
  creditMaxMonths: integer("credit_max_months"),
  creditPartnerBankIds: jsonb("credit_partner_bank_ids").$type<number[]>().default([]),
  estimatedMonthlyFrom: integer("estimated_monthly_from"),
  sellerName: text("seller_name"),
  sellerPhone: text("seller_phone"),
  sellerType: text("seller_type").default("private").notNull(),
  branchId: text("branch_id"),
  premium: boolean("premium").default(false).notNull(),
  status: text("status").default("moderation").notNull(),
  moderationNote: text("moderation_note"),
  moderatedAt: timestamp("moderated_at"),
  views: integer("views").default(0).notNull(),
  favoritesCount: integer("favorites_count").default(0).notNull(),
  entityVersion: integer("entity_version").default(1).notNull(),
  bumpedAt: timestamp("bumped_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("car_listings_status_idx").on(table.status),
  index("car_listings_brand_idx").on(table.brand),
  index("car_listings_user_id_idx").on(table.userId),
  index("car_listings_status_brand_idx").on(table.status, table.brand),
  index("car_listings_created_at_idx").on(table.createdAt),
  index("car_listings_price_idx").on(table.price),
  index("car_listings_year_idx").on(table.year),
]);

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("favorites_user_listing_idx").on(table.userId, table.listingId),
  index("favorites_listing_id_idx").on(table.listingId),
]);

export const listingViews = pgTable("listing_views", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  ipHash: varchar("ip_hash", { length: 64 }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => [
  index("listing_views_listing_id_idx").on(table.listingId),
  index("listing_views_viewed_at_idx").on(table.viewedAt),
]);

export const recentlyViewed = pgTable("recently_viewed", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").$type<Partial<CarFilters>>().default({}).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(false).notNull(),
  resultsCount: integer("results_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  oldPrice: integer("old_price").notNull(),
  newPrice: integer("new_price").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  targetPrice: integer("target_price").notNull(),
  active: boolean("active").default(true).notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const insertListingSchema = createInsertSchema(carListings)
  .omit({ id: true, createdAt: true, updatedAt: true, views: true, deletedAt: true })
  .extend({
    equipment: z.array(z.string()).default([]),
    characteristics: z.array(z.string()).default([]),
    bodyDamages: z.record(z.string(), z.string()).default({}),
    vin: z.string().regex(VIN_REGEX, "VIN должен содержать 17 символов (A-Z, 0-9, без I, O, Q)").optional().nullable().or(z.literal("")),
  });

export const updateListingSchema = insertListingSchema
  .omit({ userId: true, premium: true })
  .partial()
  .extend({
    status: z.enum(["draft", "active", "sold", "archived", "moderation", "rejected", "frozen"]).optional(),
    videoUrl: z.string().nullable().optional(),
  });

export const LISTING_STATUSES = ["draft", "moderation", "active", "rejected", "sold", "archived", "deleted", "frozen"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const VALID_LISTING_TRANSITIONS: Record<ListingStatus, readonly ListingStatus[]> = {
  draft: ["moderation", "deleted"],
  moderation: ["active", "rejected", "archived", "deleted"],
  active: ["moderation", "sold", "archived", "deleted", "rejected", "frozen"],
  rejected: ["moderation", "active", "archived", "deleted"],
  sold: ["active", "archived", "deleted"],
  archived: ["active", "moderation", "deleted"],
  deleted: [],
  frozen: ["active", "deleted"],
} as const;

export function isValidListingTransition(from: ListingStatus, to: ListingStatus): boolean {
  if (from === to) return true;
  return VALID_LISTING_TRANSITIONS[from]?.includes(to) ?? false;
}

export const createPriceAlertSchema = z.object({
  listingId: z.number().int().positive(),
  targetPrice: z.number().positive(),
});

export const updatePriceAlertSchema = z.object({
  targetPrice: z.number().positive().optional(),
  active: z.boolean().optional(),
});

export const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(200),
  filters: z.record(z.unknown()),
  notificationsEnabled: z.boolean().default(false),
  resultsCount: z.number().int().nonnegative().default(0),
});

export const listingIdParamSchema = z.object({
  listingId: z.string().regex(/^\d+$/).transform(Number),
});

export type CarListing = typeof carListings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type PriceHistoryEntry = typeof priceHistory.$inferSelect;
export type SavedSearchDB = typeof savedSearches.$inferSelect;
export type PriceAlert = typeof priceAlerts.$inferSelect;
