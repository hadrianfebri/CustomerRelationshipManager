import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  leadScore: integer("lead_score").default(0),
  leadStatus: text("lead_status").default("new"), // new, warm, hot, cold
  source: text("source"), // website, referral, cold-call, etc
  tags: text("tags").array().default([]),
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  type: text("type").notNull(), // call, email, meeting, note
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("pending"), // pending, completed, cancelled
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  title: text("title").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  stage: text("stage").default("prospecting"), // prospecting, qualified, proposal, negotiation, closed-won, closed-lost
  probability: integer("probability").default(50),
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category"), // follow-up, welcome, proposal, etc
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Results Cache Table
export const aiResults = pgTable("ai_results", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  resultType: text("result_type").notNull(), // 'analysis', 'recommendations', 'email'
  resultData: jsonb("result_data").notNull(), // stores the AI analysis/recommendations/email content
  purpose: text("purpose"), // 'follow-up', 'cold-outreach', etc for emails
  contactSnapshot: jsonb("contact_snapshot"), // snapshot of contact data when analysis was done
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_results_contact_type_idx").on(table.contactId, table.resultType),
  index("ai_results_purpose_idx").on(table.contactId, table.resultType, table.purpose),
]);

// Insert schemas
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
}).extend({
  organizationId: z.number().default(1),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertAiResultSchema = createInsertSchema(aiResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type AiResult = typeof aiResults.$inferSelect;
export type InsertAiResult = z.infer<typeof insertAiResultSchema>;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Organizations for multi-tenancy SaaS
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  domain: varchar("domain", { length: 255 }),
  planType: varchar("plan_type", { length: 50 }).notNull().default("free"), // free, starter, pro, enterprise
  maxUsers: integer("max_users").notNull().default(3),
  maxContacts: integer("max_contacts").notNull().default(100),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).notNull().default("active"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  billingEmail: varchar("billing_email"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table for Replit Auth with multi-tenancy
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  organizationRole: varchar("organization_role", { length: 50 }).default("member"), // owner, admin, member
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing and subscription tracking
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  planType: varchar("plan_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // active, cancelled, past_due, unpaid
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePriceId: varchar("stripe_price_id"),
  quantity: integer("quantity").default(1),
  amount: integer("amount"), // in cents
  currency: varchar("currency", { length: 3 }).default("usd"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking for billing
export const usageMetrics = pgTable("usage_metrics", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // contacts, api_calls, storage_mb, ai_requests
  value: integer("value").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // daily, monthly
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Team invitations
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  token: varchar("token", { length: 255 }).notNull(),
  invitedBy: varchar("invited_by").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export types for SaaS
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = typeof usageMetrics.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Relations
export const contactsRelations = relations(contacts, ({ many }) => ({
  activities: many(activities),
  tasks: many(tasks),
  deals: many(deals),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
}));
