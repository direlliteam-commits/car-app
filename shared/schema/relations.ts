import { relations } from "drizzle-orm";
import { users, sessions, blockedUsers, passwordResetTokens, pushTokens, notifications } from "./users";
import { brands, models, generations, configurations, modifications } from "./vehicles";
import { carListings, favorites, recentlyViewed, savedSearches, priceAlerts, priceHistory } from "./listings";
import { conversations, messages, reviews } from "./conversations";
import { supportTickets, supportMessages, supportAdminReadStatus } from "./support";
import { promotionPackages, listingPromotions, transactions } from "./finance";
import { dealerRequests, dealerJournalPosts, dealerJournalComments } from "./dealers";
import { reports } from "./admin";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  listings: many(carListings),
  favorites: many(favorites),
  recentlyViewed: many(recentlyViewed),
  savedSearches: many(savedSearches),
  sentMessages: many(messages),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "seller" }),
  priceAlerts: many(priceAlerts),
  blockedUsers: many(blockedUsers, { relationName: "blocker" }),
  blockedByUsers: many(blockedUsers, { relationName: "blocked" }),
  pushTokens: many(pushTokens),
  notifications: many(notifications),
}));

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  user: one(users, { fields: [blockedUsers.userId], references: [users.id], relationName: "blocker" }),
  blockedUser: one(users, { fields: [blockedUsers.blockedUserId], references: [users.id], relationName: "blocked" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  models: many(models),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  brand: one(brands, { fields: [models.brandId], references: [brands.id] }),
  generations: many(generations),
}));

export const generationsRelations = relations(generations, ({ one, many }) => ({
  model: one(models, { fields: [generations.modelId], references: [models.id] }),
  configurations: many(configurations),
}));

export const configurationsRelations = relations(configurations, ({ one, many }) => ({
  generation: one(generations, { fields: [configurations.generationId], references: [generations.id] }),
  model: one(models, { fields: [configurations.modelId], references: [models.id] }),
  brand: one(brands, { fields: [configurations.brandId], references: [brands.id] }),
  modifications: many(modifications),
}));

export const modificationsRelations = relations(modifications, ({ one }) => ({
  configuration: one(configurations, { fields: [modifications.configurationId], references: [configurations.id] }),
  generation: one(generations, { fields: [modifications.generationId], references: [generations.id] }),
  model: one(models, { fields: [modifications.modelId], references: [models.id] }),
  brand: one(brands, { fields: [modifications.brandId], references: [brands.id] }),
}));

export const carListingsRelations = relations(carListings, ({ one, many }) => ({
  user: one(users, { fields: [carListings.userId], references: [users.id] }),
  favorites: many(favorites),
  views_list: many(recentlyViewed),
  reviews: many(reviews),
  priceAlerts: many(priceAlerts),
  priceHistory: many(priceHistory),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  listing: one(carListings, { fields: [favorites.listingId], references: [carListings.id] }),
}));

export const recentlyViewedRelations = relations(recentlyViewed, ({ one }) => ({
  user: one(users, { fields: [recentlyViewed.userId], references: [users.id] }),
  listing: one(carListings, { fields: [recentlyViewed.listingId], references: [carListings.id] }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, { fields: [savedSearches.userId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  listing: one(carListings, { fields: [conversations.listingId], references: [carListings.id] }),
  buyer: one(users, { fields: [conversations.buyerId], references: [users.id], relationName: "buyer" }),
  seller: one(users, { fields: [conversations.sellerId], references: [users.id], relationName: "seller" }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id], relationName: "reviewer" }),
  seller: one(users, { fields: [reviews.sellerId], references: [users.id], relationName: "seller" }),
  listing: one(carListings, { fields: [reviews.listingId], references: [carListings.id] }),
}));

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  user: one(users, { fields: [priceAlerts.userId], references: [users.id] }),
  listing: one(carListings, { fields: [priceAlerts.listingId], references: [carListings.id] }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, { fields: [pushTokens.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  listing: one(carListings, { fields: [priceHistory.listingId], references: [carListings.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id], relationName: "reporter" }),
  listing: one(carListings, { fields: [reports.listingId], references: [carListings.id] }),
  targetUser: one(users, { fields: [reports.targetUserId], references: [users.id], relationName: "reportTarget" }),
  resolver: one(users, { fields: [reports.resolvedBy], references: [users.id], relationName: "reportResolver" }),
}));

export const promotionPackagesRelations = relations(promotionPackages, ({ many }) => ({
  promotions: many(listingPromotions),
}));

export const listingPromotionsRelations = relations(listingPromotions, ({ one }) => ({
  listing: one(carListings, { fields: [listingPromotions.listingId], references: [carListings.id] }),
  user: one(users, { fields: [listingPromotions.userId], references: [users.id] }),
  package: one(promotionPackages, { fields: [listingPromotions.packageId], references: [promotionPackages.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  listing: one(carListings, { fields: [transactions.listingId], references: [carListings.id] }),
  promotion: one(listingPromotions, { fields: [transactions.promotionId], references: [listingPromotions.id] }),
}));

export const dealerRequestsRelations = relations(dealerRequests, ({ one }) => ({
  user: one(users, { fields: [dealerRequests.userId], references: [users.id] }),
}));

export const dealerJournalPostsRelations = relations(dealerJournalPosts, ({ one }) => ({
  dealer: one(users, { fields: [dealerJournalPosts.dealerId], references: [users.id] }),
}));

export const dealerJournalCommentsRelations = relations(dealerJournalComments, ({ one }) => ({
  post: one(dealerJournalPosts, { fields: [dealerJournalComments.postId], references: [dealerJournalPosts.id] }),
  user: one(users, { fields: [dealerJournalComments.userId], references: [users.id] }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, { fields: [supportTickets.userId], references: [users.id], relationName: "ticketUser" }),
  assignedTo: one(users, { fields: [supportTickets.assignedToId], references: [users.id], relationName: "ticketAssignee" }),
  messages: many(supportMessages),
  adminReadStatuses: many(supportAdminReadStatus),
}));

export const supportAdminReadStatusRelations = relations(supportAdminReadStatus, ({ one }) => ({
  ticket: one(supportTickets, { fields: [supportAdminReadStatus.ticketId], references: [supportTickets.id] }),
  admin: one(users, { fields: [supportAdminReadStatus.adminId], references: [users.id] }),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [supportMessages.ticketId], references: [supportTickets.id] }),
  sender: one(users, { fields: [supportMessages.senderId], references: [users.id] }),
}));
