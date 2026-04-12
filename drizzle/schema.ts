import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users & Auth ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  businessId: int("businessId"), // primary/active business
  isVerified: boolean("isVerified").default(false).notNull(),
  avatarUrl: varchar("avatarUrl", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// OTP tokens — supports email, sms, whatsapp channels
export const otpTokens = mysqlTable("otp_tokens", {
  id: int("id").autoincrement().primaryKey(),
  identifier: varchar("identifier", { length: 320 }).notNull(), // email or phone
  channel: mysqlEnum("channel", ["email", "sms", "whatsapp"]).default("email").notNull(),
  otp: varchar("otp", { length: 8 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpToken = typeof otpTokens.$inferSelect;

// ─── Businesses ───────────────────────────────────────────────────────────────

export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  logoUrl: varchar("logoUrl", { length: 1000 }),
  description: text("description"),
  // Subscription
  plan: mysqlEnum("plan", ["free", "starter", "growth", "pro"]).default("free").notNull(),
  planExpiresAt: timestamp("planExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trialing", "past_due", "cancelled", "none"]).default("none").notNull(),
  // Limits
  maxContacts: int("maxContacts").default(500).notNull(),
  maxMessagesPerMonth: int("maxMessagesPerMonth").default(1000).notNull(),
  messagesUsedThisMonth: int("messagesUsedThisMonth").default(0).notNull(),
  messagesResetAt: timestamp("messagesResetAt"),
  isActive: boolean("isActive").default(true).notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

// ─── Business Members (Multi-Tenant Team Access) ──────────────────────────────

export const businessMembers = mysqlTable("business_members", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member", "viewer"]).default("member").notNull(),
  invitedBy: int("invitedBy"),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 128 }),
  inviteAccepted: boolean("inviteAccepted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessMember = typeof businessMembers.$inferSelect;
export type InsertBusinessMember = typeof businessMembers.$inferInsert;

// ─── Subscriptions / Payment History ─────────────────────────────────────────

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  plan: mysqlEnum("plan", ["starter", "growth", "pro"]).notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "cancelled", "expired"]).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amountPaise: int("amountPaise").notNull(), // amount in paise (₹299 = 29900)
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Widget Tokens (Embeddable Lead Capture) ──────────────────────────────────

export const widgetTokens = mysqlTable("widget_tokens", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).default("Default Widget").notNull(),
  config: json("config").$type<WidgetConfig>().default({} as WidgetConfig),
  isActive: boolean("isActive").default(true).notNull(),
  leadsGenerated: int("leadsGenerated").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WidgetConfig = {
  buttonColor?: string;
  buttonText?: string;
  welcomeMessage?: string;
  collectName?: boolean;
  collectEmail?: boolean;
  collectPhone?: boolean;
  customQuestion?: string;
  position?: "bottom-right" | "bottom-left";
  whatsappNumber?: string;
  prefilledMessage?: string;
};

export type WidgetToken = typeof widgetTokens.$inferSelect;
export type InsertWidgetToken = typeof widgetTokens.$inferInsert;

// ─── WhatsApp Configuration ───────────────────────────────────────────────────

export const whatsappConfigs = mysqlTable("whatsapp_configs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  phoneNumberId: varchar("phoneNumberId", { length: 100 }),
  wabaId: varchar("wabaId", { length: 100 }),
  accessToken: text("accessToken"),
  verifyToken: varchar("verifyToken", { length: 100 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  displayName: varchar("displayName", { length: 255 }),
  isConnected: boolean("isConnected").default(false).notNull(),
  webhookUrl: varchar("webhookUrl", { length: 1000 }),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  setupStep: int("setupStep").default(0).notNull(), // 0=not started, 1=creds saved, 2=webhook set, 3=verified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConfig = typeof whatsappConfigs.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfigs.$inferInsert;

// ─── Contacts ─────────────────────────────────────────────────────────────────

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  waId: varchar("waId", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  profilePicUrl: varchar("profilePicUrl", { length: 1000 }),
  tags: json("tags").$type<string[]>().default([]),
  customFields: json("customFields").$type<Record<string, string>>().default({}),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  optedOut: boolean("optedOut").default(false).notNull(),
  source: varchar("source", { length: 100 }).default("whatsapp"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  contactId: int("contactId").notNull(),
  waId: varchar("waId", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["open", "resolved", "pending", "bot"]).default("open").notNull(),
  assignedTo: int("assignedTo"),
  lastMessageAt: timestamp("lastMessageAt").defaultNow(),
  lastMessageText: text("lastMessageText"),
  unreadCount: int("unreadCount").default(0).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  tags: json("tags").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  conversationId: int("conversationId").notNull(),
  contactId: int("contactId").notNull(),
  waMessageId: varchar("waMessageId", { length: 255 }),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  type: mysqlEnum("type", ["text", "image", "audio", "video", "document", "location", "template", "interactive", "sticker"]).default("text").notNull(),
  content: text("content"),
  mediaUrl: varchar("mediaUrl", { length: 1000 }),
  mediaCaption: text("mediaCaption"),
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed", "pending"]).default("pending").notNull(),
  isAutoReply: boolean("isAutoReply").default(false).notNull(),
  isBotMessage: boolean("isBotMessage").default(false).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  contactId: int("contactId"),
  conversationId: int("conversationId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  source: varchar("source", { length: 100 }).default("whatsapp"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "won", "lost"]).default("new").notNull(),
  score: int("score").default(0),
  assignedTo: int("assignedTo"),
  notes: text("notes"),
  customFields: json("customFields").$type<Record<string, string>>().default({}),
  tags: json("tags").$type<string[]>().default([]),
  lastContactedAt: timestamp("lastContactedAt"),
  estimatedValue: bigint("estimatedValue", { mode: "number" }),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── FAQ Bot ──────────────────────────────────────────────────────────────────

export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: json("keywords").$type<string[]>().default([]),
  category: varchar("category", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  matchCount: int("matchCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

// ─── Auto-Reply Rules ─────────────────────────────────────────────────────────

export const autoReplyRules = mysqlTable("auto_reply_rules", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  triggerType: mysqlEnum("triggerType", ["keyword", "first_message", "outside_hours", "any_message", "contains"]).notNull(),
  triggerValue: text("triggerValue"),
  matchType: mysqlEnum("matchType", ["exact", "contains", "starts_with", "regex"]).default("contains"),
  responseType: mysqlEnum("responseType", ["text", "template", "flow"]).default("text").notNull(),
  responseText: text("responseText"),
  responseTemplate: varchar("responseTemplate", { length: 255 }),
  flowId: int("flowId"),
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0).notNull(),
  triggerCount: int("triggerCount").default(0).notNull(),
  businessHoursStart: varchar("businessHoursStart", { length: 5 }),
  businessHoursEnd: varchar("businessHoursEnd", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutoReplyRule = typeof autoReplyRules.$inferSelect;
export type InsertAutoReplyRule = typeof autoReplyRules.$inferInsert;

// ─── Conversation Flows ───────────────────────────────────────────────────────

export const conversationFlows = mysqlTable("conversation_flows", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerKeyword: varchar("triggerKeyword", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  steps: json("steps").$type<FlowStep[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlowStep = {
  id: string;
  type: "message" | "question" | "condition" | "lead_capture" | "end";
  content: string;
  options?: Array<{ label: string; nextStepId: string }>;
  captureField?: string;
  condition?: { field: string; operator: string; value: string; trueStepId: string; falseStepId: string };
  nextStepId?: string;
};

export type ConversationFlow = typeof conversationFlows.$inferSelect;
export type InsertConversationFlow = typeof conversationFlows.$inferInsert;

// ─── Broadcast Campaigns ──────────────────────────────────────────────────────

export const broadcastCampaigns = mysqlTable("broadcast_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 1000 }),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft").notNull(),
  targetType: mysqlEnum("targetType", ["all", "tag", "custom"]).default("all").notNull(),
  targetTags: json("targetTags").$type<string[]>().default([]),
  recipientCount: int("recipientCount").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  deliveredCount: int("deliveredCount").default(0).notNull(),
  readCount: int("readCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;
export type InsertBroadcastCampaign = typeof broadcastCampaigns.$inferInsert;

// ─── Lead Forms ───────────────────────────────────────────────────────────────

export const leadForms = mysqlTable("lead_forms", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fields: json("fields").$type<LeadFormField[]>().default([]),
  triggerKeyword: varchar("triggerKeyword", { length: 255 }),
  thankYouMessage: text("thankYouMessage"),
  isActive: boolean("isActive").default(true).notNull(),
  submissionCount: int("submissionCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadFormField = {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "select";
  required: boolean;
  options?: string[];
  captureAs?: "name" | "email" | "phone" | "custom";
};

export type LeadForm = typeof leadForms.$inferSelect;
export type InsertLeadForm = typeof leadForms.$inferInsert;

// ─── Activity Log ─────────────────────────────────────────────────────────────

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId"),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
