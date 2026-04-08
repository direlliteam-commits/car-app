import { pgTable, text, varchar, integer, boolean, timestamp, serial, real, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";
import { carListings } from "./listings";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => carListings.id, { onDelete: "set null" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("conversations_buyer_id_idx").on(table.buyerId),
  index("conversations_seller_id_idx").on(table.sellerId),
  index("conversations_last_message_at_idx").on(table.lastMessageAt),
]);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("messages_conversation_id_idx").on(table.conversationId),
  index("messages_sender_id_idx").on(table.senderId),
]);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").references(() => carListings.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelReviews = pgTable("model_reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  generation: text("generation"),
  rating: real("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelRatings = pgTable("model_ratings", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  generation: text("generation"),
  avgRating: real("avg_rating").default(0).notNull(),
  reviewsCount: integer("reviews_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const createConversationSchema = z.object({
  sellerId: z.string().min(1),
  listingId: z.number().int().positive(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional().nullable(),
});

export const createReviewSchema = z.object({
  sellerId: z.string().min(1),
  listingId: z.number().int().positive().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ModelReview = typeof modelReviews.$inferSelect;
export type ModelRating = typeof modelRatings.$inferSelect;
