import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";
import { carListings } from "./listings";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").references(() => carListings.id, { onDelete: "set null" }),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  adminNote: text("admin_note"),
  resolvedBy: varchar("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id", { length: 36 }).notNull(),
  adminName: varchar("admin_name", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: varchar("target_id", { length: 100 }),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditApplications = pgTable("credit_applications", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").references(() => users.id, { onDelete: "set null" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  downPaymentPercent: integer("down_payment_percent").notNull(),
  months: integer("months").notNull(),
  loanAmount: integer("loan_amount").notNull(),
  monthlyPayment: integer("monthly_payment").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const callbackRequests = pgTable("callback_requests", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => carListings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").references(() => users.id, { onDelete: "set null" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceInterests = pgTable("service_interests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceKey: text("service_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("service_interests_user_service_idx").on(table.userId, table.serviceKey),
]);

export const createReportSchema = z.object({
  listingId: z.number().int().positive().optional().nullable(),
  targetUserId: z.string().min(1).optional().nullable(),
  reason: z.enum(["spam", "fraud", "wrong_category", "duplicate", "offensive", "wrong_price", "sold_elsewhere", "other", "fake_account", "suspicious_activity", "harassment", "impersonation"]),
  description: z.string().max(2000).optional().nullable(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
  adminNote: z.string().optional(),
});

export type Report = typeof reports.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type CreditApplication = typeof creditApplications.$inferSelect;
export type CallbackRequest = typeof callbackRequests.$inferSelect;
