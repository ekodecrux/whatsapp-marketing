/**
 * Public API — authenticated via widget token (no user session required)
 * Endpoints:
 *   GET  /api/public/health          — ping
 *   POST /api/public/leads           — create a lead from an external form
 *   GET  /api/public/widget/:token   — get widget config for embed
 */

import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { contacts, leads, widgetTokens, webhookEndpoints, webhookDeliveries } from "../drizzle/schema";
import { nanoid } from "nanoid";

export const publicApiRouter = Router();

// ─── Health ───────────────────────────────────────────────────────────────────

publicApiRouter.get("/api/public/health", (_req, res) => {
  res.json({ status: "ok", service: "WaLeadBot Public API", version: "1.0.0", timestamp: new Date().toISOString() });
});

// ─── Widget Config ────────────────────────────────────────────────────────────

publicApiRouter.get("/api/public/widget/:token", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Service unavailable" });

    const [widget] = await db.select().from(widgetTokens).where(eq(widgetTokens.token, req.params.token)).limit(1);
    if (!widget || !widget.isActive) return res.status(404).json({ error: "Widget not found or inactive" });

    const config = (widget.config as Record<string, unknown>) ?? {};
    res.json({
      businessId: widget.businessId,
      config: {
        primaryColor: config.primaryColor ?? "#25D366",
        welcomeMessage: config.welcomeMessage ?? "Hi! How can we help you today?",
        buttonText: config.buttonText ?? "Chat with us",
        position: config.position ?? "bottom-right",
        collectName: config.collectName ?? true,
        collectEmail: config.collectEmail ?? true,
        collectPhone: config.collectPhone ?? true,
      },
    });
  } catch (err) {
    console.error("[PublicAPI] widget config error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Create Lead (public form submission) ─────────────────────────────────────

publicApiRouter.post("/api/public/leads", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Service unavailable" });

    const { token, name, email, phone, message, source, customFields } = req.body as {
      token: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      source?: string;
      customFields?: Record<string, string>;
    };

    if (!token) return res.status(400).json({ error: "Widget token is required" });
    if (!name && !email && !phone) return res.status(400).json({ error: "At least one of name, email, or phone is required" });

    // Validate token
    const [widget] = await db.select().from(widgetTokens).where(eq(widgetTokens.token, token)).limit(1);
    if (!widget || !widget.isActive) return res.status(401).json({ error: "Invalid or inactive widget token" });

    const businessId = widget.businessId;

    // Upsert contact
    let contactId: number | undefined;
    if (phone) {
      const existing = await db.select().from(contacts).where(eq(contacts.phone, phone)).limit(1);
      if (existing[0]) {
        contactId = existing[0].id;
        // Update name/email if provided
        if (name || email) {
          await db.update(contacts).set({ ...(name ? { name } : {}), ...(email ? { email } : {}) }).where(eq(contacts.id, contactId));
        }
      } else {
        const result = await db.insert(contacts).values({
          businessId,
          waId: phone, // waId is required - use phone as WhatsApp ID
          name: name ?? null,
          email: email ?? null,
          phone: phone,
          source: source ?? "widget",
          tags: [],
          isBlocked: false,
          optedOut: false,
        });
        contactId = Number((result as { insertId?: number }).insertId ?? 0);
      }
    }

    // Create lead — phone is required in schema
    const leadPhone = phone ?? email ?? "unknown";
    const leadResult = await db.insert(leads).values({
      businessId,
      contactId: contactId ?? null,
      name: name ?? phone ?? email ?? "Unknown",
      email: email ?? null,
      phone: leadPhone,
      source: source ?? "widget",
      status: "new",
      notes: message ?? null,
      customFields: customFields ?? {},
      score: 50,
    });

    const leadId = Number((leadResult as { insertId?: number }).insertId ?? 0);

    // Fire webhook event asynchronously
    fireWebhookEventAsync(businessId, "lead.created", {
      leadId,
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      source: source ?? "widget",
      message: message ?? null,
    });

    res.status(201).json({
      success: true,
      leadId,
      message: "Lead captured successfully. We'll be in touch soon!",
    });
  } catch (err) {
    console.error("[PublicAPI] create lead error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Webhook event helper (async, non-blocking) ───────────────────────────────

async function fireWebhookEventAsync(businessId: number, event: string, data: Record<string, unknown>) {
  try {
    const db = await getDb();
    if (!db) return;

    const endpoints = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.businessId, businessId));
    const payload = { event, businessId, timestamp: new Date().toISOString(), data };

    for (const endpoint of endpoints) {
      if (!endpoint.isActive) continue;
      const events = (endpoint.events as string[]) ?? [];
      if (!events.includes(event) && !events.includes("*")) continue;

      let statusCode = 0;
      let responseBody = "";
      let success = false;

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WaLeadBot-Secret": endpoint.secret,
            "X-WaLeadBot-Event": event,
            "User-Agent": "WaLeadBot-Webhook/1.0",
          },
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

      const update = success
        ? { successCount: (endpoint.successCount ?? 0) + 1, lastTriggeredAt: new Date() }
        : { failureCount: (endpoint.failureCount ?? 0) + 1 };
      await db.update(webhookEndpoints).set(update).where(eq(webhookEndpoints.id, endpoint.id));
    }
  } catch (err) {
    console.error("[Webhook] async fire error:", err);
  }
}
