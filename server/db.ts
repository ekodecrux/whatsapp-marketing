import { and, desc, eq, gt, gte, ilike, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  activityLogs,
  autoReplyRules,
  broadcastCampaigns,
  businessMembers,
  businesses,
  contacts,
  conversationFlows,
  conversations,
  faqs,
  leadForms,
  leads,
  messages,
  otpTokens,
  subscriptions,
  users,
  whatsappConfigs,
  widgetTokens,
  type InsertBusiness,
  type InsertBusinessMember,
  type InsertSubscription,
  type InsertWidgetToken,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUserByEmail(email: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const openId = `email_${email.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}`;
  await db.insert(users).values({
    openId,
    email,
    name: name || email.split("@")[0],
    loginMethod: "otp",
    lastSignedIn: new Date(),
  });
  return getUserByEmail(email);
}

export async function updateUserBusiness(userId: number, businessId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ businessId }).where(eq(users.id, userId));
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export async function createOtp(identifier: string, otp: string, channel: "email" | "sms" | "whatsapp" = "email") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await db.insert(otpTokens).values({ identifier, otp, expiresAt, channel });
}

export async function verifyOtp(identifier: string, otp: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = new Date();
  const result = await db
    .select()
    .from(otpTokens)
    .where(
      and(
        eq(otpTokens.identifier, identifier),
        eq(otpTokens.otp, otp),
        eq(otpTokens.used, false),
        gt(otpTokens.expiresAt, now)
      )
    )
    .limit(1);
  if (result.length === 0) return false;
  await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.id, result[0].id));
  return true;
}

// ─── Businesses ───────────────────────────────────────────────────────────────

export async function getBusinessByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).limit(1);
  return result[0];
}

export async function getBusinessById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result[0];
}

export async function createBusiness(data: typeof businesses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(businesses).values(data).$returningId();
  return result.id;
}

export async function updateBusiness(id: number, data: Partial<typeof businesses.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(businesses).set(data).where(eq(businesses.id, id));
}

// ─── WhatsApp Config ──────────────────────────────────────────────────────────

export async function getWhatsappConfig(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(whatsappConfigs).where(eq(whatsappConfigs.businessId, businessId)).limit(1);
  return result[0];
}

export async function upsertWhatsappConfig(businessId: number, data: Partial<typeof whatsappConfigs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getWhatsappConfig(businessId);
  if (existing) {
    await db.update(whatsappConfigs).set(data).where(eq(whatsappConfigs.businessId, businessId));
  } else {
    await db.insert(whatsappConfigs).values({ businessId, ...data });
  }
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function getContacts(businessId: number, search?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(contacts.businessId, businessId)];
  if (search) {
    conditions.push(
      or(
        like(contacts.name, `%${search}%`),
        like(contacts.phone, `%${search}%`),
        like(contacts.email, `%${search}%`)
      ) as any
    );
  }
  return db.select().from(contacts).where(and(...conditions)).orderBy(desc(contacts.createdAt)).limit(limit).offset(offset);
}

export async function getContactByWaId(businessId: number, waId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(and(eq(contacts.businessId, businessId), eq(contacts.waId, waId))).limit(1);
  return result[0];
}

export async function upsertContact(businessId: number, waId: string, data: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getContactByWaId(businessId, waId);
  if (existing) {
    await db.update(contacts).set(data).where(eq(contacts.id, existing.id));
    return existing.id;
  } else {
    const [result] = await db.insert(contacts).values({ businessId, waId, ...data }).$returningId();
    return result.id;
  }
}

export async function updateContact(id: number, data: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function getContactsCount(businessId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.businessId, businessId));
  return Number(result[0]?.count ?? 0);
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(businessId: number, status?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(conversations.businessId, businessId), eq(conversations.isArchived, false)];
  if (status && status !== "all") {
    conditions.push(eq(conversations.status, status as any));
  }
  return db.select().from(conversations).where(and(...conditions)).orderBy(desc(conversations.lastMessageAt)).limit(limit).offset(offset);
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function getConversationByWaId(businessId: number, waId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(and(eq(conversations.businessId, businessId), eq(conversations.waId, waId))).limit(1);
  return result[0];
}

export async function upsertConversation(businessId: number, waId: string, contactId: number, data: Partial<typeof conversations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getConversationByWaId(businessId, waId);
  if (existing) {
    await db.update(conversations).set(data).where(eq(conversations.id, existing.id));
    return existing.id;
  } else {
    const [result] = await db.insert(conversations).values({ businessId, waId, contactId, ...data }).$returningId();
    return result.id;
  }
}

export async function updateConversation(id: number, data: Partial<typeof conversations.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(conversationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.sentAt).limit(limit);
}

export async function createMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(messages).values(data).$returningId();
  return result.id;
}

export async function updateMessageStatus(waMessageId: string, status: string, timestamp?: Date) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === "delivered" && timestamp) updateData.deliveredAt = timestamp;
  if (status === "read" && timestamp) updateData.readAt = timestamp;
  await db.update(messages).set(updateData as any).where(eq(messages.waMessageId, waMessageId));
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeads(businessId: number, filters?: { status?: string; search?: string }, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(leads.businessId, businessId)];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(leads.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(leads.name, `%${filters.search}%`),
        like(leads.phone, `%${filters.search}%`),
        like(leads.email, `%${filters.search}%`)
      ) as any
    );
  }
  return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt)).limit(limit).offset(offset);
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function createLead(data: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(leads).values(data).$returningId();
  return result.id;
}

export async function updateLead(id: number, data: Partial<typeof leads.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(leads).where(eq(leads.id, id));
}

export async function getLeadsCount(businessId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.businessId, businessId));
  return Number(result[0]?.count ?? 0);
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export async function getFaqs(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqs).where(eq(faqs.businessId, businessId)).orderBy(desc(faqs.createdAt));
}

export async function createFaq(data: typeof faqs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(faqs).values(data).$returningId();
  return result.id;
}

export async function updateFaq(id: number, data: Partial<typeof faqs.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(faqs).set(data).where(eq(faqs.id, id));
}

export async function deleteFaq(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(faqs).where(eq(faqs.id, id));
}

export async function findFaqMatch(businessId: number, text: string) {
  const db = await getDb();
  if (!db) return undefined;
  const allFaqs = await db.select().from(faqs).where(and(eq(faqs.businessId, businessId), eq(faqs.isActive, true)));
  const lowerText = text.toLowerCase();
  for (const faq of allFaqs) {
    const keywords = (faq.keywords as string[]) || [];
    const questionWords = faq.question.toLowerCase().split(/\s+/);
    const allKeywords = [...keywords.map((k) => k.toLowerCase()), ...questionWords];
    if (allKeywords.some((kw) => kw.length > 2 && lowerText.includes(kw))) {
      await db.update(faqs).set({ matchCount: sql`${faqs.matchCount} + 1` }).where(eq(faqs.id, faq.id));
      return faq;
    }
  }
  return undefined;
}

// ─── Auto-Reply Rules ─────────────────────────────────────────────────────────

export async function getAutoReplyRules(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autoReplyRules).where(eq(autoReplyRules.businessId, businessId)).orderBy(autoReplyRules.priority);
}

export async function createAutoReplyRule(data: typeof autoReplyRules.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(autoReplyRules).values(data).$returningId();
  return result.id;
}

export async function updateAutoReplyRule(id: number, data: Partial<typeof autoReplyRules.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(autoReplyRules).set(data).where(eq(autoReplyRules.id, id));
}

export async function deleteAutoReplyRule(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(autoReplyRules).where(eq(autoReplyRules.id, id));
}

export async function findMatchingRule(businessId: number, messageText: string, isFirstMessage: boolean) {
  const db = await getDb();
  if (!db) return undefined;
  const rules = await db
    .select()
    .from(autoReplyRules)
    .where(and(eq(autoReplyRules.businessId, businessId), eq(autoReplyRules.isActive, true)))
    .orderBy(autoReplyRules.priority);

  const lowerText = messageText.toLowerCase();
  for (const rule of rules) {
    if (rule.triggerType === "first_message" && isFirstMessage) return rule;
    if (rule.triggerType === "any_message") return rule;
    if (rule.triggerType === "keyword" || rule.triggerType === "contains") {
      const trigger = (rule.triggerValue || "").toLowerCase();
      if (!trigger) continue;
      if (rule.matchType === "exact" && lowerText === trigger) return rule;
      if (rule.matchType === "contains" && lowerText.includes(trigger)) return rule;
      if (rule.matchType === "starts_with" && lowerText.startsWith(trigger)) return rule;
    }
  }
  return undefined;
}

// ─── Conversation Flows ───────────────────────────────────────────────────────

export async function getConversationFlows(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversationFlows).where(eq(conversationFlows.businessId, businessId)).orderBy(desc(conversationFlows.createdAt));
}

export async function getConversationFlowById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversationFlows).where(eq(conversationFlows.id, id)).limit(1);
  return result[0];
}

export async function createConversationFlow(data: typeof conversationFlows.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(conversationFlows).values(data).$returningId();
  return result.id;
}

export async function updateConversationFlow(id: number, data: Partial<typeof conversationFlows.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversationFlows).set(data).where(eq(conversationFlows.id, id));
}

export async function deleteConversationFlow(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(conversationFlows).where(eq(conversationFlows.id, id));
}

// ─── Broadcast Campaigns ──────────────────────────────────────────────────────

export async function getBroadcastCampaigns(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.businessId, businessId)).orderBy(desc(broadcastCampaigns.createdAt));
}

export async function getBroadcastCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.id, id)).limit(1);
  return result[0];
}

export async function createBroadcastCampaign(data: typeof broadcastCampaigns.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(broadcastCampaigns).values(data).$returningId();
  return result.id;
}

export async function updateBroadcastCampaign(id: number, data: Partial<typeof broadcastCampaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(broadcastCampaigns).set(data).where(eq(broadcastCampaigns.id, id));
}

// ─── Lead Forms ───────────────────────────────────────────────────────────────

export async function getLeadForms(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadForms).where(eq(leadForms.businessId, businessId)).orderBy(desc(leadForms.createdAt));
}

export async function createLeadForm(data: typeof leadForms.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(leadForms).values(data).$returningId();
  return result.id;
}

export async function updateLeadForm(id: number, data: Partial<typeof leadForms.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(leadForms).set(data).where(eq(leadForms.id, id));
}

export async function deleteLeadForm(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(leadForms).where(eq(leadForms.id, id));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsStats(businessId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.businessId, businessId));
  const [totalContacts] = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.businessId, businessId));
  const [totalConversations] = await db.select({ count: sql<number>`count(*)` }).from(conversations).where(eq(conversations.businessId, businessId));
  const [totalMessages] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(eq(messages.businessId, businessId));
  const [openConversations] = await db.select({ count: sql<number>`count(*)` }).from(conversations).where(and(eq(conversations.businessId, businessId), eq(conversations.status, "open")));
  const [newLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.businessId, businessId), eq(leads.status, "new")));
  const [wonLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.businessId, businessId), eq(leads.status, "won")));
  const [autoReplies] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.businessId, businessId), eq(messages.isAutoReply, true)));

  // Last 7 days leads
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLeads = await db
    .select({ date: sql<string>`DATE(createdAt)`, count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.businessId, businessId), gte(leads.createdAt, sevenDaysAgo)))
    .groupBy(sql`DATE(createdAt)`);

  return {
    totalLeads: Number(totalLeads?.count ?? 0),
    totalContacts: Number(totalContacts?.count ?? 0),
    totalConversations: Number(totalConversations?.count ?? 0),
    totalMessages: Number(totalMessages?.count ?? 0),
    openConversations: Number(openConversations?.count ?? 0),
    newLeads: Number(newLeads?.count ?? 0),
    wonLeads: Number(wonLeads?.count ?? 0),
    autoReplies: Number(autoReplies?.count ?? 0),
    recentLeads,
  };
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function logActivity(data: typeof activityLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function getRecentActivity(businessId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.businessId, businessId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ─── Business Members (Multi-Tenant) ─────────────────────────────────────────

export async function getBusinessMembers(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: businessMembers.id,
      userId: businessMembers.userId,
      role: businessMembers.role,
      inviteEmail: businessMembers.inviteEmail,
      inviteAccepted: businessMembers.inviteAccepted,
      createdAt: businessMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(businessMembers)
    .leftJoin(users, eq(businessMembers.userId, users.id))
    .where(eq(businessMembers.businessId, businessId));
}

export async function addBusinessMember(data: InsertBusinessMember) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(businessMembers).values(data).$returningId();
  return result.id;
}

export async function removeBusinessMember(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(businessMembers).where(eq(businessMembers.id, id));
}

export async function updateBusinessMemberRole(id: number, role: "owner" | "admin" | "member" | "viewer") {
  const db = await getDb();
  if (!db) return;
  await db.update(businessMembers).set({ role }).where(eq(businessMembers.id, id));
}

export async function getUserBusinesses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get businesses where user is owner
  const owned = await db.select().from(businesses).where(eq(businesses.ownerId, userId));
  // Get businesses where user is a member
  const memberships = await db
    .select({ businessId: businessMembers.businessId, role: businessMembers.role })
    .from(businessMembers)
    .where(and(eq(businessMembers.userId, userId), eq(businessMembers.inviteAccepted, true)));
  const memberBusinessIds = memberships.map((m) => m.businessId);
  let memberBusinesses: (typeof businesses.$inferSelect)[] = [];
  if (memberBusinessIds.length > 0) {
    memberBusinesses = await db
      .select()
      .from(businesses)
      .where(sql`${businesses.id} IN (${sql.join(memberBusinessIds.map((id) => sql`${id}`), sql`, `)})`);
  }
  return [...owned, ...memberBusinesses];
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscription(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.businessId, businessId), eq(subscriptions.status, "active")))
    .limit(1);
  return result[0];
}

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(subscriptions).values(data).$returningId();
  return result.id;
}

export async function updateSubscription(id: number, data: Partial<typeof subscriptions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set(data).where(eq(subscriptions.id, id));
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return result[0];
}

// ─── Widget Tokens ────────────────────────────────────────────────────────────

export async function getWidgetTokens(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(widgetTokens).where(eq(widgetTokens.businessId, businessId)).orderBy(desc(widgetTokens.createdAt));
}

export async function getWidgetTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(widgetTokens).where(eq(widgetTokens.token, token)).limit(1);
  return result[0];
}

export async function createWidgetToken(data: InsertWidgetToken) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(widgetTokens).values(data).$returningId();
  return result.id;
}

export async function updateWidgetToken(id: number, data: Partial<typeof widgetTokens.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(widgetTokens).set(data).where(eq(widgetTokens.id, id));
}

export async function deleteWidgetToken(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(widgetTokens).where(eq(widgetTokens.id, id));
}

// ─── User by Phone (for SMS OTP) ─────────────────────────────────────────────

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result[0];
}

export async function createUserByPhone(phone: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const openId = `phone_${phone.replace(/[^0-9]/g, "")}_${Date.now()}`;
  await db.insert(users).values({
    openId,
    phone,
    name: name || `User ${phone.slice(-4)}`,
    loginMethod: "otp_sms",
    lastSignedIn: new Date(),
  });
  return getUserByPhone(phone);
}

export async function getAllBusinesses(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).orderBy(desc(businesses.createdAt)).limit(limit).offset(offset);
}

export async function getBusinessesCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(businesses);
  return Number(result[0]?.count ?? 0);
}

export async function getUsersCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result[0]?.count ?? 0);
}
