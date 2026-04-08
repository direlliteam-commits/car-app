import { pgTable, text, varchar, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";
import { carListings } from "./listings";

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  subject: text("subject").default("Чат с поддержкой").notNull(),
  status: text("status").default("open").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull().default("user"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  listingId: integer("listing_id").references(() => carListings.id, { onDelete: "set null" }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportAdminReadStatus = pgTable("support_admin_read_status", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadMessageId: integer("last_read_message_id").default(0).notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

export const createSupportTicketSchema = z.object({
  message: z.string().min(1, "Введите сообщение").max(2000),
});

export const sendSupportMessageSchema = z.object({
  content: z.string().max(2000).optional().default(""),
  listingId: z.number().int().positive().optional(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type SupportAdminReadStatus = typeof supportAdminReadStatus.$inferSelect;
