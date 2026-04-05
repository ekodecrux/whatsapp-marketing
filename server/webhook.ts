import { Router } from "express";
import * as db from "./db";

export const webhookRouter = Router();

// ─── Webhook Verification ─────────────────────────────────────────────────────

webhookRouter.get("/api/webhook/whatsapp", async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe") {
    // Find matching verify token across all businesses
    const dbInstance = await db.getDb();
    if (dbInstance) {
      const { whatsappConfigs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const configs = await dbInstance.select().from(whatsappConfigs).where(eq(whatsappConfigs.verifyToken, token as string));
      if (configs.length > 0) {
        console.log("[Webhook] Verified successfully");
        return res.status(200).send(challenge);
      }
    }
    return res.status(403).send("Forbidden");
  }
  return res.status(400).send("Bad Request");
});

// ─── Webhook Message Handler ──────────────────────────────────────────────────

webhookRouter.post("/api/webhook/whatsapp", async (req, res) => {
  // Acknowledge immediately
  res.status(200).send("OK");

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry || []) {
      const businessAccountId = entry.id;

      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;

        // Find business by WABA ID
        const dbInstance = await db.getDb();
        if (!dbInstance) continue;

        const { whatsappConfigs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const configs = await dbInstance.select().from(whatsappConfigs).where(eq(whatsappConfigs.wabaId, businessAccountId));
        const config = configs[0];
        if (!config) continue;

        const businessId = config.businessId;

        // Handle incoming messages
        for (const msg of value.messages || []) {
          await handleIncomingMessage(businessId, msg, value.contacts?.[0]);
        }

        // Handle status updates
        for (const status of value.statuses || []) {
          await db.updateMessageStatus(status.id, status.status, status.timestamp ? new Date(parseInt(status.timestamp) * 1000) : undefined);
        }
      }
    }
  } catch (error) {
    console.error("[Webhook] Error processing message:", error);
  }
});

async function handleIncomingMessage(businessId: number, msg: any, contactInfo: any) {
  const waId = msg.from;
  const messageText = msg.text?.body || msg.caption || "";

  // Upsert contact
  const contactId = await db.upsertContact(businessId, waId, {
    name: contactInfo?.profile?.name || waId,
    phone: waId,
  });

  // Check if first message
  const existingConvo = await db.getConversationByWaId(businessId, waId);
  const isFirstMessage = !existingConvo;

  // Upsert conversation
  const conversationId = await db.upsertConversation(businessId, waId, contactId, {
    lastMessageText: messageText,
    lastMessageAt: new Date(),
    unreadCount: (existingConvo?.unreadCount || 0) + 1,
  });

  // Save inbound message
  await db.createMessage({
    businessId,
    conversationId,
    contactId,
    waMessageId: msg.id,
    direction: "inbound",
    type: msg.type || "text",
    content: messageText,
    status: "delivered",
  });

  // Auto-reply engine
  if (messageText) {
    await processAutoReply(businessId, conversationId, contactId, waId, messageText, isFirstMessage);
  }
}

async function processAutoReply(
  businessId: number,
  conversationId: number,
  contactId: number,
  waId: string,
  messageText: string,
  isFirstMessage: boolean
) {
  const config = await db.getWhatsappConfig(businessId);
  if (!config?.isConnected || !config.accessToken || !config.phoneNumberId) return;

  // 1. Check FAQ match first
  const faqMatch = await db.findFaqMatch(businessId, messageText);
  if (faqMatch) {
    await sendAutoReply(config, waId, faqMatch.answer, businessId, conversationId, contactId, true);
    return;
  }

  // 2. Check auto-reply rules
  const rule = await db.findMatchingRule(businessId, messageText, isFirstMessage);
  if (rule && rule.responseText) {
    await sendAutoReply(config, waId, rule.responseText, businessId, conversationId, contactId, false);
    // Increment trigger count
    const dbInstance = await db.getDb();
    if (dbInstance) {
      const { autoReplyRules } = await import("../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      await dbInstance.update(autoReplyRules).set({ triggerCount: sql`${autoReplyRules.triggerCount} + 1` }).where(eq(autoReplyRules.id, rule.id));
    }
  }

  // 3. Auto-capture lead from first message
  if (isFirstMessage) {
    await db.createLead({
      businessId,
      contactId,
      conversationId,
      phone: waId,
      source: "whatsapp",
      status: "new",
    });
    await db.logActivity({
      businessId,
      entityType: "lead",
      action: "auto_captured",
      description: `Auto-captured lead from WhatsApp: ${waId}`,
    });
  }
}

async function sendAutoReply(
  config: any,
  to: string,
  text: string,
  businessId: number,
  conversationId: number,
  contactId: number,
  isBotMessage: boolean
) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
    const data = await response.json() as any;
    const waMessageId = data?.messages?.[0]?.id;

    await db.createMessage({
      businessId,
      conversationId,
      contactId,
      waMessageId,
      direction: "outbound",
      type: "text",
      content: text,
      status: "sent",
      isAutoReply: !isBotMessage,
      isBotMessage,
    });

    await db.updateConversation(conversationId, { lastMessageText: text, lastMessageAt: new Date() });
  } catch (error) {
    console.error("[AutoReply] Failed to send:", error);
  }
}
