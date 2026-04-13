import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "./db";
import {
  webhookDeliveries,
  webhookEndpoints,
  whatsappTemplates,
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// ─── Helper: get business for user ───────────────────────────────────────────
async function requireBusiness(ctx: { user: { id: number } }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const { businesses } = await import("../drizzle/schema");
  const biz = await db.select().from(businesses).where(eq(businesses.ownerId, ctx.user.id)).limit(1);
  if (!biz[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found. Complete onboarding first." });
  return { db, business: biz[0] };
}

// ─── WhatsApp Templates Router ────────────────────────────────────────────────

export const templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.businessId, business.id))
      .orderBy(desc(whatsappTemplates.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).default("MARKETING"),
        language: z.string().default("en"),
        headerType: z.enum(["none", "text", "image", "video", "document"]).default("none"),
        headerContent: z.string().optional(),
        body: z.string().min(1),
        footer: z.string().max(60).optional(),
        buttons: z
          .array(z.object({ type: z.string(), text: z.string(), url: z.string().optional(), phone: z.string().optional() }))
          .optional(),
        variables: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db.insert(whatsappTemplates).values({
        businessId: business.id,
        name: input.name,
        category: input.category,
        language: input.language,
        headerType: input.headerType,
        headerContent: input.headerContent ?? null,
        body: input.body,
        footer: input.footer ?? null,
        buttons: input.buttons ?? null,
        variables: input.variables,
        status: "draft",
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().optional(),
        category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).optional(),
        language: z.string().optional(),
        headerType: z.enum(["none", "text", "image", "video", "document"]).optional(),
        headerContent: z.string().nullable().optional(),
        body: z.string().optional(),
        footer: z.string().nullable().optional(),
        buttons: z.array(z.object({ type: z.string(), text: z.string(), url: z.string().optional(), phone: z.string().optional() })).nullable().optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const { id, ...rest } = input;
      // Only allow editing drafts or rejected templates
      const [tpl] = await db.select().from(whatsappTemplates).where(and(eq(whatsappTemplates.id, id), eq(whatsappTemplates.businessId, business.id))).limit(1);
      if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
      if (tpl.status === "approved" || tpl.status === "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot edit an approved or pending template." });
      }
      await db.update(whatsappTemplates).set(rest).where(and(eq(whatsappTemplates.id, id), eq(whatsappTemplates.businessId, business.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db.delete(whatsappTemplates).where(and(eq(whatsappTemplates.id, input.id), eq(whatsappTemplates.businessId, business.id)));
      return { success: true };
    }),

  // Submit to Meta for approval (simulated — real implementation calls Meta Graph API)
  submit: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const [tpl] = await db.select().from(whatsappTemplates).where(and(eq(whatsappTemplates.id, input.id), eq(whatsappTemplates.businessId, business.id))).limit(1);
      if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
      if (tpl.status !== "draft" && tpl.status !== "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft or rejected templates can be submitted." });
      }
      // In production: call Meta Graph API POST /v18.0/{waba_id}/message_templates
      await db.update(whatsappTemplates).set({ status: "pending", submittedAt: new Date() }).where(eq(whatsappTemplates.id, input.id));
      return { success: true, message: "Template submitted for Meta review. Approval typically takes 24-48 hours." };
    }),

  // Simulate Meta approval (for testing — in prod this comes via Meta webhook)
  simulateApproval: protectedProcedure
    .input(z.object({ id: z.number().int(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const status = input.approved ? "approved" : "rejected";
      const update: Record<string, unknown> = { status };
      if (input.approved) update.approvedAt = new Date();
      else update.rejectionReason = "Template does not comply with WhatsApp's Business Policy. Please review and resubmit.";
      await db.update(whatsappTemplates).set(update).where(and(eq(whatsappTemplates.id, input.id), eq(whatsappTemplates.businessId, business.id)));
      return { success: true };
    }),
});

// ─── Webhook Endpoints Router ─────────────────────────────────────────────────

export const webhooksRouter = router({
  listEndpoints: protectedProcedure.query(async ({ ctx }) => {
    const { db, business } = await requireBusiness(ctx);
    return db.select().from(webhookEndpoints).where(eq(webhookEndpoints.businessId, business.id)).orderBy(desc(webhookEndpoints.createdAt));
  }),

  createEndpoint: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        events: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const secret = nanoid(32);
      await db.insert(webhookEndpoints).values({
        businessId: business.id,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        isActive: 1,
        successCount: 0,
        failureCount: 0,
      });
      return { success: true, secret };
    }),

  updateEndpoint: protectedProcedure
    .input(z.object({ id: z.number().int(), isActive: z.number().int().optional(), events: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const { id, ...rest } = input;
      await db.update(webhookEndpoints).set(rest).where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.businessId, business.id)));
      return { success: true };
    }),

  deleteEndpoint: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      await db.delete(webhookEndpoints).where(and(eq(webhookEndpoints.id, input.id), eq(webhookEndpoints.businessId, business.id)));
      return { success: true };
    }),

  // Test endpoint by sending a ping event
  testEndpoint: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const [endpoint] = await db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.id, input.id), eq(webhookEndpoints.businessId, business.id))).limit(1);
      if (!endpoint) throw new TRPCError({ code: "NOT_FOUND" });

      const payload = { event: "ping", businessId: business.id, timestamp: new Date().toISOString(), data: { message: "WaLeadBot webhook test" } };
      let statusCode = 0;
      let responseBody = "";
      let success = false;

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-WaLeadBot-Secret": endpoint.secret, "X-WaLeadBot-Event": "ping" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        statusCode = res.status;
        responseBody = await res.text().catch(() => "");
        success = res.ok;
      } catch (err: unknown) {
        responseBody = err instanceof Error ? err.message : "Connection failed";
      }

      // Log delivery
      await db.insert(webhookDeliveries).values({
        endpointId: endpoint.id,
        businessId: business.id,
        event: "ping",
        payload,
        status: success ? "success" : "failed",
        statusCode,
        responseBody: responseBody.slice(0, 500),
        attempts: 1,
        lastAttemptAt: new Date(),
      });

      // Update endpoint stats
      if (success) {
        await db.update(webhookEndpoints).set({ successCount: (endpoint.successCount ?? 0) + 1, lastTriggeredAt: new Date() }).where(eq(webhookEndpoints.id, endpoint.id));
      } else {
        await db.update(webhookEndpoints).set({ failureCount: (endpoint.failureCount ?? 0) + 1 }).where(eq(webhookEndpoints.id, endpoint.id));
      }

      return { success, statusCode, responseBody: responseBody.slice(0, 200) };
    }),

  // List recent deliveries
  listDeliveries: protectedProcedure
    .input(z.object({ endpointId: z.number().int().optional(), limit: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      const { db, business } = await requireBusiness(ctx);
      const conditions = [eq(webhookDeliveries.businessId, business.id)];
      if (input.endpointId) conditions.push(eq(webhookDeliveries.endpointId, input.endpointId));
      return db.select().from(webhookDeliveries).where(and(...conditions)).orderBy(desc(webhookDeliveries.createdAt)).limit(input.limit);
    }),
});

// ─── Utility: fire webhook event (called from other routers) ─────────────────

export async function fireWebhookEvent(businessId: number, event: string, data: Record<string, unknown>) {
  try {
    const db = await getDb();
    if (!db) return;
    const endpoints = await db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.businessId, businessId), eq(webhookEndpoints.isActive, 1)));
    const payload = { event, businessId, timestamp: new Date().toISOString(), data };

    for (const endpoint of endpoints) {
      const events = (endpoint.events as string[]) ?? [];
      if (!events.includes(event) && !events.includes("*")) continue;

      let statusCode = 0;
      let responseBody = "";
      let success = false;

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-WaLeadBot-Secret": endpoint.secret, "X-WaLeadBot-Event": event },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        statusCode = res.status;
        responseBody = await res.text().catch(() => "");
        success = res.ok;
      } catch (err: unknown) {
        responseBody = err instanceof Error ? err.message : "Connection failed";
      }

      await db.insert(webhookDeliveries).values({
        endpointId: endpoint.id,
        businessId,
        event,
        payload,
        status: success ? "success" : "failed",
        statusCode,
        responseBody: responseBody.slice(0, 500),
        attempts: 1,
        lastAttemptAt: new Date(),
      });

      if (success) {
        await db.update(webhookEndpoints).set({ successCount: (endpoint.successCount ?? 0) + 1, lastTriggeredAt: new Date() }).where(eq(webhookEndpoints.id, endpoint.id));
      } else {
        await db.update(webhookEndpoints).set({ failureCount: (endpoint.failureCount ?? 0) + 1 }).where(eq(webhookEndpoints.id, endpoint.id));
      }
    }
  } catch (err) {
    console.error("[Webhook] Fire event error:", err);
  }
}
