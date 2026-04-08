import { pgTable, text, varchar, integer, boolean, timestamp, serial, real, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";

export const dealerRequests = pgTable("dealer_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  legalForm: text("legal_form"),
  taxId: text("tax_id"),
  country: text("country"),
  city: text("city"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  website: text("website"),
  workingHours: text("working_hours"),
  description: text("description"),
  logoUrl: text("logo_url"),
  documents: jsonb("documents").$type<string[]>().default([]),
  status: text("status").default("pending").notNull(),
  adminNote: text("admin_note"),
  selectedPlanId: integer("selected_plan_id"),
  entityVersion: integer("entity_version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dealerJournalPosts = pgTable("dealer_journal_posts", {
  id: serial("id").primaryKey(),
  dealerId: varchar("dealer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  brand: text("brand"),
  model: text("model"),
  generation: text("generation"),
  category: text("category").default("general"),
  rating: real("rating"),
  reviewDetails: jsonb("review_details").$type<{
    bodyType?: string | null;
    modification?: string | null;
    ownershipPeriod?: string | null;
    pros?: string[];
    cons?: string[];
    ratings?: Record<string, number>;
  }>(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  status: text("status").default("published").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const journalFollows = pgTable("journal_follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("journal_follows_unique").on(table.followerId, table.followingId),
]);

export const dealerJournalLikes = pgTable("dealer_journal_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => dealerJournalPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dealerJournalComments = pgTable("dealer_journal_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => dealerJournalPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dealerRequestSchema = z.object({
  companyName: z.string().min(2, "Минимум 2 символа").max(100),
  legalForm: z.string().max(50).optional(),
  taxId: z.string().min(1, "Укажите ИНН").max(20),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().min(6, "Укажите телефон"),
  email: z.string().email("Некорректный email").optional(),
  address: z.string().min(1, "Укажите адрес").max(200),
  website: z.string().max(100).optional(),
  workingHours: z.string().max(100).optional(),
  description: z.string().min(1, "Опишите деятельность").max(500),
  logoUrl: z.string().optional(),
  documents: z.array(z.string()).optional(),
});

export type DealerRequest = typeof dealerRequests.$inferSelect;
export type DealerJournalPost = typeof dealerJournalPosts.$inferSelect;
