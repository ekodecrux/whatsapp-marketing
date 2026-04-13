/**
 * Feature Gap Routers — Phase 10
 * AI & Intelligence, Admin Operations, Reporting, Integrations, Scalability
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  anomalyEvents,
  coupons,
  integrationConfigs,
  leadComments,
  scheduledReports,
  sharedReports,
  sloThresholds,
  whatsappAgents,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireBusiness(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const { businesses } = await import("../drizzle/schema");
  const biz = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, ctx.user.id))
    .limit(1);
  if (!biz[0]) throw new TRPCError({ code: "NOT_FOUND", message: "No business found" });
  return { db, business: biz[0] };
}

// ─── SLO Thresholds Router ────────────────────────────────────────────────────

export const sloRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db
      .select()
      .from(sloThresholds)
      .where(eq(sloThresholds.businessId, business.id))
      .orderBy(desc(sloThresholds.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        metric: z.string().min(1),
        operator: z.enum(["lt", "gt", "lte", "gte"]),
        threshold: z.number().int(),
        windowHours: z.number().int().min(1).max(720).default(24),
        severity: z.enum(["info", "warning", "critical"]).default("warning"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db.insert(sloThresholds).values({
        businessId: business.id,
        metric: input.metric,
        operator: input.operator,
        threshold: input.threshold,
        windowHours: input.windowHours,
        severity: input.severity,
        isActive: 1,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        isActive: z.number().int().optional(),
        threshold: z.number().int().optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const { id, ...rest } = input;
      await db
        .update(sloThresholds)
        .set(rest)
        .where(and(eq(sloThresholds.id, id), eq(sloThresholds.businessId, business.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .delete(sloThresholds)
        .where(and(eq(sloThresholds.id, input.id), eq(sloThresholds.businessId, business.id)));
      return { success: true };
    }),

  // Check current metrics against SLO thresholds and return breach status
  checkBreaches: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    const thresholds = await db
      .select()
      .from(sloThresholds)
      .where(and(eq(sloThresholds.businessId, business.id), eq(sloThresholds.isActive, 1) as any));

    const { leads, messages, conversations } = await import("../drizzle/schema");
    const now = new Date();

    const results = await Promise.all(
      thresholds.map(async (t) => {
        const windowStart = new Date(now.getTime() - t.windowHours * 3600 * 1000);
        let currentValue = 0;

        try {
          if (t.metric === "new_leads") {
            const [row] = await db
              .select({ count: sql<number>`count(*)` })
              .from(leads)
              .where(
                and(
                  eq(leads.businessId, business.id),
                  gte(leads.createdAt, windowStart)
                )
              );
            currentValue = Number(row?.count ?? 0);
          } else if (t.metric === "messages_sent") {
            const [row] = await db
              .select({ count: sql<number>`count(*)` })
              .from(messages)
              .where(
                and(
                  eq(messages.businessId, business.id),
                  eq(messages.direction, "outbound"),
                  gte(messages.createdAt, windowStart)
                )
              );
            currentValue = Number(row?.count ?? 0);
          } else if (t.metric === "open_conversations") {
            const [row] = await db
              .select({ count: sql<number>`count(*)` })
              .from(conversations)
              .where(
                and(
                  eq(conversations.businessId, business.id),
                  eq(conversations.status, "open")
                )
              );
            currentValue = Number(row?.count ?? 0);
          }
        } catch (_) {
          // ignore metric fetch errors
        }

        const breached =
          (t.operator === "lt" && currentValue < t.threshold) ||
          (t.operator === "gt" && currentValue > t.threshold) ||
          (t.operator === "lte" && currentValue <= t.threshold) ||
          (t.operator === "gte" && currentValue >= t.threshold);

        return { ...t, currentValue, breached };
      })
    );

    return results;
  }),
});

// ─── Anomaly Detection Router ─────────────────────────────────────────────────

export const anomalyRouter = router({
  list: protectedProcedure
    .input(z.object({ resolved: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      return db
        .select()
        .from(anomalyEvents)
        .where(
          input.resolved !== undefined
            ? and(eq(anomalyEvents.businessId, business.id), eq(anomalyEvents.isResolved, input.resolved ? 1 : 0))
            : eq(anomalyEvents.businessId, business.id)
        )
        .orderBy(desc(anomalyEvents.createdAt))
        .limit(50);
    }),

  resolve: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .update(anomalyEvents)
        .set({ isResolved: 1, resolvedAt: new Date() })
        .where(and(eq(anomalyEvents.id, input.id), eq(anomalyEvents.businessId, business.id)));
      return { success: true };
    }),

  // Run anomaly detection: compare last 24h vs previous 7-day average
  detect: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    const { leads, messages } = await import("../drizzle/schema");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const detected: Array<{ metric: string; current: number; baseline: number; pct: number }> = [];

    // Check leads anomaly
    const [recentLeads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.businessId, business.id), gte(leads.createdAt, yesterday)));
    const [weekLeads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.businessId, business.id), gte(leads.createdAt, weekAgo), lte(leads.createdAt, yesterday)));

    const recentLeadCount = Number(recentLeads?.count ?? 0);
    const dailyAvgLeads = Number(weekLeads?.count ?? 0) / 7;

    if (dailyAvgLeads > 0) {
      const pct = Math.round(((recentLeadCount - dailyAvgLeads) / dailyAvgLeads) * 100);
      if (Math.abs(pct) >= 50) {
        detected.push({ metric: "new_leads", current: recentLeadCount, baseline: Math.round(dailyAvgLeads), pct });
      }
    }

    // Check messages anomaly
    const [recentMsgs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.businessId, business.id), gte(messages.createdAt, yesterday)));
    const [weekMsgs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.businessId, business.id), gte(messages.createdAt, weekAgo), lte(messages.createdAt, yesterday)));

    const recentMsgCount = Number(recentMsgs?.count ?? 0);
    const dailyAvgMsgs = Number(weekMsgs?.count ?? 0) / 7;

    if (dailyAvgMsgs > 0) {
      const pct = Math.round(((recentMsgCount - dailyAvgMsgs) / dailyAvgMsgs) * 100);
      if (Math.abs(pct) >= 50) {
        detected.push({ metric: "messages", current: recentMsgCount, baseline: Math.round(dailyAvgMsgs), pct });
      }
    }

    // Persist detected anomalies
    for (const d of detected) {
      const severity = Math.abs(d.pct) >= 80 ? "critical" : Math.abs(d.pct) >= 50 ? "warning" : "info";
      await db.insert(anomalyEvents).values({
        businessId: business.id,
        metric: d.metric,
        detectedValue: d.current,
        baselineValue: d.baseline,
        deviationPct: d.pct,
        severity,
        description: `${d.metric} deviated ${d.pct > 0 ? "+" : ""}${d.pct}% from 7-day average (${d.baseline}/day → ${d.current} today)`,
        isResolved: 0,
      });
    }

    return { detected: detected.length, anomalies: detected };
  }),

  // AI-powered analysis of anomalies
  aiAnalyze: protectedProcedure
    .input(z.object({ anomalyId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const [anomaly] = await db
        .select()
        .from(anomalyEvents)
        .where(and(eq(anomalyEvents.id, input.anomalyId), eq(anomalyEvents.businessId, business.id)))
        .limit(1);

      if (!anomaly) throw new TRPCError({ code: "NOT_FOUND" });

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a WhatsApp business analytics expert. Analyze anomalies in business metrics and provide actionable recommendations in 2-3 sentences. Be concise and practical for Indian SMBs.",
          },
          {
            role: "user",
            content: `Business metric anomaly detected:\n- Metric: ${anomaly.metric}\n- Current value: ${anomaly.detectedValue}\n- 7-day average: ${anomaly.baselineValue}\n- Deviation: ${anomaly.deviationPct}%\n- Severity: ${anomaly.severity}\n\nWhat could be causing this and what should the business owner do?`,
          },
        ],
      });

      return {
        analysis: response.choices[0]?.message?.content ?? "Unable to analyze at this time.",
        anomaly,
      };
    }),
});

// ─── AI Suggestions Router ────────────────────────────────────────────────────

export const aiRouter = router({
  // Smart lead scoring based on engagement
  scoreLeads: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    const { leads, messages } = await import("../drizzle/schema");

    const allLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.businessId, business.id))
      .limit(100);

    const scored = await Promise.all(
      allLeads.map(async (lead) => {
        // Count messages for this contact
        const [msgCount] = await db
          .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.contactId, lead.contactId ?? 0));

        const msgCountNum = Number(msgCount?.count ?? 0);

        // Simple scoring: messages + recency + status
        let score = 0;
        score += Math.min(msgCountNum * 5, 30); // up to 30 pts for engagement
        if (lead.status === "qualified") score += 30;
        else if (lead.status === "contacted") score += 20;
        else if (lead.status === "new") score += 10;
        if (lead.email) score += 10;
        if (lead.phone) score += 10;

        // Recency bonus
        const daysSince = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) score += 20;
        else if (daysSince < 7) score += 10;
        else if (daysSince < 30) score += 5;

        return { leadId: lead.id, name: lead.name, score: Math.min(score, 100), status: lead.status };
      })
    );

    return scored.sort((a, b) => b.score - a.score);
  }),

  // AI reply suggestion for a conversation
  suggestReply: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().int(),
        lastMessages: z.array(z.object({ role: z.string(), content: z.string() })).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { business } = await requireBusiness(ctx);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a helpful WhatsApp business assistant for ${business.name ?? "a business"} (${business.industry ?? "services"} industry). Suggest a short, friendly, professional reply in the same language as the customer. Keep it under 100 words. Reply only with the suggested message text, no explanation.`,
          },
          ...input.lastMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      });

      return {
        suggestion: response.choices[0]?.message?.content ?? "",
      };
    }),

  // Baseline regression: compare this week vs last week
  baselineRegression: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    const { leads, messages, conversations } = await import("../drizzle/schema");
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

    const metrics = ["leads", "messages", "conversations"] as const;
    const results: Array<{
      metric: string;
      thisWeek: number;
      lastWeek: number;
      change: number;
      trend: "up" | "down" | "stable";
    }> = [];

    for (const metric of metrics) {
      let thisWeekCount = 0;
      let lastWeekCount = 0;

      if (metric === "leads") {
        const [tw] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.businessId, business.id), gte(leads.createdAt, weekStart)));
        const [lw] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.businessId, business.id), gte(leads.createdAt, prevWeekStart), lte(leads.createdAt, weekStart)));
        thisWeekCount = Number(tw?.count ?? 0);
        lastWeekCount = Number(lw?.count ?? 0);
      } else if (metric === "messages") {
        const [tw] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.businessId, business.id), gte(messages.createdAt, weekStart)));
        const [lw] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.businessId, business.id), gte(messages.createdAt, prevWeekStart), lte(messages.createdAt, weekStart)));
        thisWeekCount = Number(tw?.count ?? 0);
        lastWeekCount = Number(lw?.count ?? 0);
      } else if (metric === "conversations") {
        const [tw] = await db.select({ count: sql<number>`count(*)` }).from(conversations).where(and(eq(conversations.businessId, business.id), gte(conversations.createdAt, weekStart)));
        const [lw] = await db.select({ count: sql<number>`count(*)` }).from(conversations).where(and(eq(conversations.businessId, business.id), gte(conversations.createdAt, prevWeekStart), lte(conversations.createdAt, weekStart)));
        thisWeekCount = Number(tw?.count ?? 0);
        lastWeekCount = Number(lw?.count ?? 0);
      }

      const change = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : 0;
      results.push({
        metric,
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
        change,
        trend: change > 5 ? "up" : change < -5 ? "down" : "stable",
      });
    }

    return results;
  }),
});

// ─── Coupons Router ───────────────────────────────────────────────────────────

export const couponsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(3).max(50).toUpperCase(),
        description: z.string().optional(),
        discountType: z.enum(["percent", "fixed"]).default("percent"),
        discountValue: z.number().int().min(1),
        maxUses: z.number().int().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        applicablePlans: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(coupons).values({
        code: input.code,
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUses: input.maxUses ?? null,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        applicablePlans: input.applicablePlans,
        isActive: 1,
        createdBy: ctx.user?.id ?? null,
      });
      return { success: true };
    }),

  validate: publicProcedure
    .input(z.object({ code: z.string(), plan: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, message: "Service unavailable" };
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.code, input.code.toUpperCase()), eq(coupons.isActive, 1)))
        .limit(1);

      if (!coupon) return { valid: false, message: "Invalid coupon code" };
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
        return { valid: false, message: "Coupon usage limit reached" };
      if (coupon.validUntil && new Date() > coupon.validUntil)
        return { valid: false, message: "Coupon has expired" };
      if (coupon.validFrom && new Date() < coupon.validFrom)
        return { valid: false, message: "Coupon is not yet active" };
      if (coupon.applicablePlans && (coupon.applicablePlans as string[]).length > 0) {
        if (!(coupon.applicablePlans as string[]).includes(input.plan))
          return { valid: false, message: `Coupon not valid for ${input.plan} plan` };
      }

      return {
        valid: true,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        message: `${coupon.discountValue}${coupon.discountType === "percent" ? "%" : "₹"} off applied!`,
      };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(coupons).set({ isActive: input.isActive }).where(eq(coupons.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),
});

// ─── Lead Comments Router ─────────────────────────────────────────────────────

export const leadCommentsRouter = router({
  list: protectedProcedure
    .input(z.object({ leadId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      return db
        .select()
        .from(leadComments)
        .where(and(eq(leadComments.leadId, input.leadId), eq(leadComments.businessId, business.id)))
        .orderBy(desc(leadComments.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({ leadId: z.number().int(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db.insert(leadComments).values({
        leadId: input.leadId,
        businessId: business.id,
        userId: ctx.user!.id,
        userName: ctx.user?.name ?? "Team Member",
        content: input.content,
        isInternal: 1,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .delete(leadComments)
        .where(and(eq(leadComments.id, input.id), eq(leadComments.businessId, business.id)));
      return { success: true };
    }),
});

// ─── Shared Reports Router ────────────────────────────────────────────────────

export const sharedReportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db
      .select()
      .from(sharedReports)
      .where(eq(sharedReports.businessId, business.id))
      .orderBy(desc(sharedReports.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["analytics", "leads", "conversations", "broadcast"]),
        title: z.string().optional(),
        filters: z.record(z.string(), z.unknown()).optional(),
        expiresInDays: z.number().int().min(1).max(90).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const token = nanoid(32);
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 3600 * 1000)
        : null;
      await db.insert(sharedReports).values({
        businessId: business.id,
        token,
        reportType: input.reportType,
        title: input.title ?? `${input.reportType} Report`,
        filters: input.filters ?? {},
        expiresAt,
        viewCount: 0,
        createdBy: ctx.user!.id,
      });
      return { token, url: `/shared/${token}` };
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [report] = await db
        .select()
        .from(sharedReports)
        .where(eq(sharedReports.token, input.token))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      if (report.expiresAt && new Date() > report.expiresAt)
        throw new TRPCError({ code: "FORBIDDEN", message: "This shared report has expired" });

      // Increment view count
      await db
        .update(sharedReports)
        .set({ viewCount: report.viewCount + 1 })
        .where(eq(sharedReports.id, report.id));

      return report;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .delete(sharedReports)
        .where(and(eq(sharedReports.id, input.id), eq(sharedReports.businessId, business.id)));
      return { success: true };
    }),
});

// ─── Scheduled Reports Router ─────────────────────────────────────────────────

export const scheduledReportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.businessId, business.id))
      .orderBy(desc(scheduledReports.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["analytics", "leads", "conversations", "broadcast"]),
        frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
        recipientEmails: z.array(z.string().email()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const nextSendAt = new Date();
      if (input.frequency === "daily") nextSendAt.setDate(nextSendAt.getDate() + 1);
      else if (input.frequency === "weekly") nextSendAt.setDate(nextSendAt.getDate() + 7);
      else nextSendAt.setMonth(nextSendAt.getMonth() + 1);

      await db.insert(scheduledReports).values({
        businessId: business.id,
        reportType: input.reportType,
        frequency: input.frequency,
        recipientEmails: input.recipientEmails,
        isActive: 1,
        nextSendAt,
      });
      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .update(scheduledReports)
        .set({ isActive: input.isActive })
        .where(and(eq(scheduledReports.id, input.id), eq(scheduledReports.businessId, business.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .delete(scheduledReports)
        .where(and(eq(scheduledReports.id, input.id), eq(scheduledReports.businessId, business.id)));
      return { success: true };
    }),
});

// ─── Integrations Router ──────────────────────────────────────────────────────

export const integrationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db
      .select()
      .from(integrationConfigs)
      .where(eq(integrationConfigs.businessId, business.id))
      .orderBy(desc(integrationConfigs.createdAt));
  }),

  save: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["jira", "pagerduty", "datadog", "slack", "zapier"]),
        config: z.record(z.string(), z.unknown()),
        isActive: z.number().int().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      // Upsert: delete existing then insert
      await db
        .delete(integrationConfigs)
        .where(
          and(
            eq(integrationConfigs.businessId, business.id),
            eq(integrationConfigs.provider, input.provider)
          )
        );
      await db.insert(integrationConfigs).values({
        businessId: business.id,
        provider: input.provider,
        config: input.config,
        isActive: input.isActive,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .delete(integrationConfigs)
        .where(
          and(eq(integrationConfigs.id, input.id), eq(integrationConfigs.businessId, business.id))
        );
      return { success: true };
    }),

  // Trigger Jira ticket creation from a lead
  createJiraTicket: protectedProcedure
    .input(
      z.object({
        leadId: z.number().int(),
        summary: z.string(),
        description: z.string().optional(),
        priority: z.enum(["Highest", "High", "Medium", "Low", "Lowest"]).default("Medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const [jiraConfig] = await db
        .select()
        .from(integrationConfigs)
        .where(
          and(
            eq(integrationConfigs.businessId, business.id),
            eq(integrationConfigs.provider, "jira"),
            eq(integrationConfigs.isActive, 1)
          )
        )
        .limit(1);

      if (!jiraConfig) throw new TRPCError({ code: "NOT_FOUND", message: "Jira integration not configured" });

      const cfg = jiraConfig.config as Record<string, string>;
      const { baseUrl, email, apiToken, projectKey } = cfg;

      if (!baseUrl || !email || !apiToken || !projectKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Incomplete Jira configuration" });
      }

      const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary: input.summary,
            description: {
              type: "doc",
              version: 1,
              content: [{ type: "paragraph", content: [{ type: "text", text: input.description ?? "" }] }],
            },
            issuetype: { name: "Task" },
            priority: { name: input.priority },
          },
        }),
      });

      if (!response.ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create Jira ticket" });
      }

      const data = await response.json() as { key: string; id: string };
      return { ticketKey: data.key, ticketId: data.id, url: `${baseUrl}/browse/${data.key}` };
    }),

  // Trigger PagerDuty incident
  triggerPagerDuty: protectedProcedure
    .input(z.object({ title: z.string(), severity: z.enum(["critical", "error", "warning", "info"]).default("warning"), details: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const [pdConfig] = await db
        .select()
        .from(integrationConfigs)
        .where(
          and(
            eq(integrationConfigs.businessId, business.id),
            eq(integrationConfigs.provider, "pagerduty"),
            eq(integrationConfigs.isActive, 1)
          )
        )
        .limit(1);

      if (!pdConfig) throw new TRPCError({ code: "NOT_FOUND", message: "PagerDuty integration not configured" });

      const cfg = pdConfig.config as Record<string, string>;
      const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routing_key: cfg.routingKey,
          event_action: "trigger",
          payload: {
            summary: input.title,
            severity: input.severity,
            source: `WaLeadBot - ${business.name}`,
            custom_details: { details: input.details, businessId: business.id },
          },
        }),
      });

      if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to trigger PagerDuty incident" });
      return { success: true };
    }),

  // Push metrics to Datadog
  pushDatadogMetrics: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    const [ddConfig] = await db
      .select()
      .from(integrationConfigs)
      .where(
        and(
          eq(integrationConfigs.businessId, business.id),
          eq(integrationConfigs.provider, "datadog"),
          eq(integrationConfigs.isActive, 1)
        )
      )
      .limit(1);

    if (!ddConfig) throw new TRPCError({ code: "NOT_FOUND", message: "Datadog integration not configured" });

    const cfg = ddConfig.config as Record<string, string>;
    const { leads, messages } = await import("../drizzle/schema");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);

    const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.businessId, business.id), gte(leads.createdAt, yesterday)));
    const [msgCount] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.businessId, business.id), gte(messages.createdAt, yesterday)));

    const series = [
      { metric: `waleadbot.leads.daily`, points: [[Math.floor(Date.now() / 1000), Number(leadCount?.count ?? 0)]], tags: [`business:${business.id}`] },
      { metric: `waleadbot.messages.daily`, points: [[Math.floor(Date.now() / 1000), Number(msgCount?.count ?? 0)]], tags: [`business:${business.id}`] },
    ];

    const response = await fetch("https://api.datadoghq.com/api/v1/series", {
      method: "POST",
      headers: { "Content-Type": "application/json", "DD-API-KEY": cfg.apiKey },
      body: JSON.stringify({ series }),
    });

    if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to push Datadog metrics" });
    return { success: true, metricsCount: series.length };
  }),
});

// ─── WhatsApp Agents (Scalability) Router ─────────────────────────────────────

export const agentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db
      .select()
      .from(whatsappAgents)
      .where(eq(whatsappAgents.businessId, business.id))
      .orderBy(desc(whatsappAgents.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNumberId: z.string().optional(),
        accessToken: z.string().optional(),
        region: z.string().optional(),
        phonePrefixes: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db.insert(whatsappAgents).values({
        businessId: business.id,
        name: input.name,
        phoneNumberId: input.phoneNumberId ?? null,
        accessToken: input.accessToken ?? null,
        region: input.region ?? null,
        phonePrefixes: input.phonePrefixes,
        isActive: 1,
        messagesSent: 0,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().optional(),
        phoneNumberId: z.string().optional(),
        accessToken: z.string().optional(),
        region: z.string().optional(),
        phonePrefixes: z.array(z.string()).optional(),
        isActive: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const { id, ...rest } = input;
      await db
        .update(whatsappAgents)
        .set(rest)
        .where(and(eq(whatsappAgents.id, id), eq(whatsappAgents.businessId, business.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db
        .delete(whatsappAgents)
        .where(and(eq(whatsappAgents.id, input.id), eq(whatsappAgents.businessId, business.id)));
      return { success: true };
    }),

  // Geo-route: find best agent for a phone number based on prefix
  routeByPhone: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const agents = await db
        .select()
        .from(whatsappAgents)
        .where(and(eq(whatsappAgents.businessId, business.id), eq(whatsappAgents.isActive, 1)));

      // Find agent whose phonePrefixes match the given phone
      const matched = agents.find((a) => {
        const prefixes = (a.phonePrefixes ?? []) as string[];
        return prefixes.some((p) => input.phone.startsWith(p));
      });

      return matched ?? agents[0] ?? null;
    }),
});
