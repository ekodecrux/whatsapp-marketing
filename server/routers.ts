import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { SignJWT } from "jose";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── OTP Auth ─────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // Use Resend if API key is configured, otherwise fall back to console log
  if (ENV.resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(ENV.resendApiKey);
      await resend.emails.send({
        from: `WaLeadBot <${ENV.resendFromEmail}>`,
        to: [email],
        subject: `Your WaLeadBot login code: ${otp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
            <div style="margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 10px; background: #f0fdf4; border-radius: 12px; padding: 10px 16px;">
                <span style="font-size: 20px;">💬</span>
                <span style="font-weight: 700; font-size: 16px; color: #166534;">WaLeadBot</span>
              </div>
            </div>
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px;">Your login code</h1>
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">Use the code below to sign in to your WaLeadBot account. It expires in 10 minutes.</p>
            <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 32px;">
              <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #15803d; font-variant-numeric: tabular-nums;">${otp}</div>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.6;">If you didn't request this code, you can safely ignore this email. This code is valid for 10 minutes only.</p>
            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
            <p style="color: #d1d5db; font-size: 12px; margin: 0;">WaLeadBot · WhatsApp Business Automation for India</p>
          </div>
        `,
      });
      console.log(`[OTP] Email sent via Resend to ${email}`);
      return;
    } catch (err) {
      console.error(`[OTP] Resend failed, falling back to console:`, err);
    }
  }
  // Dev fallback — OTP is returned in the API response and shown as a toast
  console.log(`[OTP] DEV MODE — OTP for ${email}: ${otp}`);
}

const otpRouter = router({
  sendOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const otp = generateOtp();
      await db.createOtp(input.email, otp);
      await sendOtpEmail(input.email, otp);
      // In dev mode, return OTP directly for testing
      const isDev = process.env.NODE_ENV === "development";
      return { success: true, ...(isDev ? { devOtp: otp } : {}) };
    }),

  verifyOtp: publicProcedure
    .input(z.object({ email: z.string().email(), otp: z.string().min(6).max(6) }))
    .mutation(async ({ input, ctx }) => {
      const valid = await db.verifyOtp(input.email, input.otp);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired OTP" });

      let user = await db.getUserByEmail(input.email);
      if (!user) {
        user = await db.createUserByEmail(input.email);
      } else {
        // Update lastSignedIn
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await dbInstance.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user!.id));
        }
      }

      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

      // Issue JWT session
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT({ sub: user.openId, id: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(secret);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    }),
});

// ─── Business Router ──────────────────────────────────────────────────────────

const businessRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.businessId) {
      return db.getBusinessById(ctx.user.businessId);
    }
    return db.getBusinessByOwner(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      industry: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getBusinessByOwner(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Business already exists" });
      const id = await db.createBusiness({ ...input, ownerId: ctx.user.id });
      await db.updateUserBusiness(ctx.user.id, id);
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      industry: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      await db.updateBusiness(business.id, input);
      return { success: true };
    }),
});

// ─── WhatsApp Config Router ───────────────────────────────────────────────────

const whatsappRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return null;
    const config = await db.getWhatsappConfig(business.id);
    if (!config) return null;
    // Mask access token
    return { ...config, accessToken: config.accessToken ? "***" + config.accessToken.slice(-4) : null };
  }),

  saveConfig: protectedProcedure
    .input(z.object({
      phoneNumberId: z.string().min(1),
      wabaId: z.string().min(1),
      accessToken: z.string().min(1),
      verifyToken: z.string().min(1),
      phoneNumber: z.string().optional(),
      displayName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Create a business first" });
      await db.upsertWhatsappConfig(business.id, { ...input, isConnected: true, lastVerifiedAt: new Date() });
      return { success: true };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) throw new TRPCError({ code: "NOT_FOUND" });
    await db.upsertWhatsappConfig(business.id, { isConnected: false });
    return { success: true };
  }),

  getWebhookUrl: protectedProcedure.query(async ({ ctx }) => {
    const host = ctx.req.headers["x-forwarded-host"] || ctx.req.headers.host || "localhost:3000";
    const proto = ctx.req.headers["x-forwarded-proto"] || "https";
    return { webhookUrl: `${proto}://${host}/api/webhook/whatsapp` };
  }),
});

// ─── Contacts Router ──────────────────────────────────────────────────────────

const contactsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) return [];
      return db.getContacts(business.id, input.search, input.limit, input.offset);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      isBlocked: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateContact(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteContact(input.id);
      return { success: true };
    }),

  count: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return 0;
    return db.getContactsCount(business.id);
  }),
});

// ─── Conversations Router ─────────────────────────────────────────────────────

const conversationsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) return [];
      const convos = await db.getConversations(business.id, input.status, input.limit, input.offset);
      // Enrich with contact info
      const enriched = await Promise.all(
        convos.map(async (c) => {
          const contact = await db.getContactByWaId(business.id, c.waId);
          return { ...c, contact };
        })
      );
      return enriched;
    }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return db.getMessages(input.conversationId);
    }),

  sendMessage: protectedProcedure
    .input(z.object({ conversationId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const convo = await db.getConversationById(input.conversationId);
      if (!convo) throw new TRPCError({ code: "NOT_FOUND" });
      const config = await db.getWhatsappConfig(business.id);

      // Send via WhatsApp API if connected
      if (config?.isConnected && config.accessToken && config.phoneNumberId) {
        try {
          const response = await fetch(
            `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: convo.waId,
                type: "text",
                text: { body: input.content },
              }),
            }
          );
          const data = await response.json() as any;
          const waMessageId = data?.messages?.[0]?.id;
          const msgId = await db.createMessage({
            businessId: business.id,
            conversationId: input.conversationId,
            contactId: convo.contactId,
            waMessageId,
            direction: "outbound",
            type: "text",
            content: input.content,
            status: "sent",
          });
          await db.updateConversation(input.conversationId, { lastMessageText: input.content, lastMessageAt: new Date() });
          return { success: true, messageId: msgId };
        } catch (e) {
          console.error("[WhatsApp] Send error:", e);
        }
      }

      // Fallback: save as pending
      const msgId = await db.createMessage({
        businessId: business.id,
        conversationId: input.conversationId,
        contactId: convo.contactId,
        direction: "outbound",
        type: "text",
        content: input.content,
        status: "pending",
      });
      await db.updateConversation(input.conversationId, { lastMessageText: input.content, lastMessageAt: new Date() });
      return { success: true, messageId: msgId };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["open", "resolved", "pending", "bot"]) }))
    .mutation(async ({ input }) => {
      await db.updateConversation(input.id, { status: input.status });
      return { success: true };
    }),
});

// ─── Leads Router ─────────────────────────────────────────────────────────────

const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), search: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) return [];
      return db.getLeads(business.id, { status: input.status, search: input.search }, input.limit, input.offset);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().min(1),
      source: z.string().optional(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
      notes: z.string().optional(),
      estimatedValue: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createLead({ ...input, businessId: business.id });
      await db.logActivity({ businessId: business.id, userId: ctx.user.id, entityType: "lead", entityId: id, action: "created", description: `New lead: ${input.name || input.phone}` });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
      notes: z.string().optional(),
      estimatedValue: z.number().optional(),
      tags: z.array(z.string()).optional(),
      score: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateLead(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteLead(input.id);
      return { success: true };
    }),

  count: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return 0;
    return db.getLeadsCount(business.id);
  }),

  exportCsv: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const leads = await db.getLeads(business.id, { status: input.status, search: input.search }, 10000, 0);

      // Build CSV string server-side
      const headers = ["ID", "Name", "Phone", "Email", "Status", "Source", "Estimated Value", "Score", "Tags", "Notes", "Created At"];
      const rows = leads.map((l: any) => [
        l.id,
        l.name ?? "",
        l.phone ?? "",
        l.email ?? "",
        l.status ?? "",
        l.source ?? "",
        l.estimatedValue ?? "",
        l.score ?? "",
        Array.isArray(l.tags) ? l.tags.join(";") : (l.tags ?? ""),
        (l.notes ?? "").replace(/"/g, '""'),
        l.createdAt ? new Date(l.createdAt).toISOString() : "",
      ]);

      const escape = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [
        headers.map(escape).join(","),
        ...rows.map((r) => r.map(escape).join(",")),
      ].join("\n");

      return { csv, count: leads.length, filename: `leads-${business.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv` };
    }),
});

// ─── FAQ Router ───────────────────────────────────────────────────────────────

const faqRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getFaqs(business.id);
  }),

  create: protectedProcedure
    .input(z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      keywords: z.array(z.string()).optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createFaq({ ...input, businessId: business.id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      question: z.string().min(1).optional(),
      answer: z.string().min(1).optional(),
      keywords: z.array(z.string()).optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateFaq(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteFaq(input.id);
      return { success: true };
    }),
});

// ─── Auto-Reply Rules Router ──────────────────────────────────────────────────

const autoReplyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getAutoReplyRules(business.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      triggerType: z.enum(["keyword", "first_message", "outside_hours", "any_message", "contains"]),
      triggerValue: z.string().optional(),
      matchType: z.enum(["exact", "contains", "starts_with", "regex"]).optional(),
      responseType: z.enum(["text", "template", "flow"]).default("text"),
      responseText: z.string().optional(),
      flowId: z.number().optional(),
      isActive: z.boolean().default(true),
      priority: z.number().default(0),
      businessHoursStart: z.string().optional(),
      businessHoursEnd: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createAutoReplyRule({ ...input, businessId: business.id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      triggerType: z.enum(["keyword", "first_message", "outside_hours", "any_message", "contains"]).optional(),
      triggerValue: z.string().optional(),
      matchType: z.enum(["exact", "contains", "starts_with", "regex"]).optional(),
      responseType: z.enum(["text", "template", "flow"]).optional(),
      responseText: z.string().optional(),
      isActive: z.boolean().optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAutoReplyRule(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAutoReplyRule(input.id);
      return { success: true };
    }),
});

// ─── Conversation Flows Router ────────────────────────────────────────────────

const flowsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getConversationFlows(business.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getConversationFlowById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      triggerKeyword: z.string().optional(),
      isActive: z.boolean().default(true),
      steps: z.array(z.any()).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createConversationFlow({ ...input, businessId: business.id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      triggerKeyword: z.string().optional(),
      isActive: z.boolean().optional(),
      steps: z.array(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateConversationFlow(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteConversationFlow(input.id);
      return { success: true };
    }),
});

// ─── Broadcast Router ─────────────────────────────────────────────────────────

const broadcastRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getBroadcastCampaigns(business.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      message: z.string().min(1),
      targetType: z.enum(["all", "tag", "custom"]).default("all"),
      targetTags: z.array(z.string()).optional(),
      targetContactIds: z.array(z.number()).optional(),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const allContacts = await db.getContacts(business.id, undefined, 1000, 0);
      let recipients = allContacts.filter((c) => !c.isBlocked && !c.optedOut);
      if (input.targetType === "tag" && input.targetTags?.length) {
        recipients = recipients.filter((c) => {
          const tags = (c.tags as string[]) || [];
          return input.targetTags!.some((t) => tags.includes(t));
        });
      } else if (input.targetType === "custom" && input.targetContactIds?.length) {
        recipients = recipients.filter((c) => input.targetContactIds!.includes(c.id));
      }
      const id = await db.createBroadcastCampaign({
        ...input,
        businessId: business.id,
        recipientCount: recipients.length,
        status: input.scheduledAt ? "scheduled" : "draft",
      });
      return { id, totalRecipients: recipients.length };
    }),

  send: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const campaign = await db.getBroadcastCampaignById(input.id);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      const config = await db.getWhatsappConfig(business.id);

      await db.updateBroadcastCampaign(input.id, { status: "sending", startedAt: new Date() });

      const allContacts = await db.getContacts(business.id, undefined, 1000, 0);
      let recipients = allContacts.filter((c) => !c.isBlocked && !c.optedOut);

      let sentCount = 0;
      let failedCount = 0;

      for (const contact of recipients) {
        try {
          if (config?.isConnected && config.accessToken && config.phoneNumberId) {
            await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: contact.waId,
                type: "text",
                text: { body: campaign.message },
              }),
            });
          }
          sentCount++;
        } catch {
          failedCount++;
        }
      }

      await db.updateBroadcastCampaign(input.id, {
        status: "sent",
        sentCount,
        failedCount,
        completedAt: new Date(),
      });

      return { success: true, sentCount, failedCount };
    }),
});

// ─── Analytics Router ─────────────────────────────────────────────────────────

const analyticsRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return null;
    return db.getAnalyticsStats(business.id);
  }),

  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getRecentActivity(business.id);
  }),
});

// ─── Lead Forms Router ────────────────────────────────────────────────────────

const leadFormsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getLeadForms(business.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      fields: z.array(z.any()).default([]),
      triggerKeyword: z.string().optional(),
      thankYouMessage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await db.createLeadForm({ ...input, businessId: business.id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      fields: z.array(z.any()).optional(),
      triggerKeyword: z.string().optional(),
      thankYouMessage: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateLeadForm(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteLeadForm(input.id);
      return { success: true };
    }),
});

// ─── MSG91 SMS/WhatsApp OTP ─────────────────────────────────────────────────

async function sendOtpSms(phone: string, otp: string): Promise<void> {
  if (ENV.msg91AuthKey) {
    try {
      const url = `https://api.msg91.com/api/v5/otp?template_id=${ENV.msg91TemplateId}&mobile=${encodeURIComponent(phone)}&authkey=${ENV.msg91AuthKey}&otp=${otp}`;
      const resp = await fetch(url, { method: "POST" });
      const data = await resp.json() as { type?: string };
      if (data.type === "success") {
        console.log(`[OTP] SMS sent via MSG91 to ${phone}`);
        return;
      }
    } catch (err) {
      console.error(`[OTP] MSG91 SMS failed:`, err);
    }
  }
  console.log(`[OTP] DEV MODE — SMS OTP for ${phone}: ${otp}`);
}

async function sendOtpWhatsApp(phone: string, otp: string): Promise<void> {
  if (ENV.msg91AuthKey && ENV.msg91WhatsappTemplateId) {
    try {
      const resp = await fetch(`https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authkey: ENV.msg91AuthKey },
        body: JSON.stringify({
          integrated_number: ENV.msg91SenderId,
          content_type: "template",
          payload: {
            to: phone,
            type: "template",
            template: { name: ENV.msg91WhatsappTemplateId, language: { code: "en" }, components: [{ type: "body", parameters: [{ type: "text", text: otp }] }] },
          },
        }),
      });
      const data = await resp.json() as { type?: string };
      if (data.type === "success") {
        console.log(`[OTP] WhatsApp OTP sent via MSG91 to ${phone}`);
        return;
      }
    } catch (err) {
      console.error(`[OTP] MSG91 WhatsApp failed:`, err);
    }
  }
  console.log(`[OTP] DEV MODE — WhatsApp OTP for ${phone}: ${otp}`);
}

const smsOtpRouter = router({
  send: publicProcedure
    .input(z.object({ phone: z.string().min(10), channel: z.enum(["sms", "whatsapp"]).default("sms") }))
    .mutation(async ({ input }) => {
      const otp = generateOtp();
      await db.createOtp(input.phone, otp, input.channel);
      if (input.channel === "whatsapp") {
        await sendOtpWhatsApp(input.phone, otp);
      } else {
        await sendOtpSms(input.phone, otp);
      }
      const isDev = process.env.NODE_ENV === "development";
      return { success: true, ...(isDev ? { devOtp: otp } : {}) };
    }),

  verify: publicProcedure
    .input(z.object({ phone: z.string().min(10), otp: z.string().min(6).max(6) }))
    .mutation(async ({ input, ctx }) => {
      const valid = await db.verifyOtp(input.phone, input.otp);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired OTP" });

      let user = await db.getUserByPhone(input.phone);
      if (!user) {
        user = await db.createUserByPhone(input.phone);
      }
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT({ sub: user.openId, id: user.id, phone: user.phone, role: user.role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(secret);

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { success: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } };
    }),
});

// ─── Business Members Router ──────────────────────────────────────────────────

const membersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getBusinessMembers(business.id);
  }),

  invite: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(["admin", "member", "viewer"]).default("member") }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const inviteToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
      // Create placeholder user or find existing
      let invitedUser = await db.getUserByEmail(input.email);
      if (!invitedUser) {
        invitedUser = await db.createUserByEmail(input.email, input.email.split("@")[0]);
      }
      if (!invitedUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.addBusinessMember({
        businessId: business.id,
        userId: invitedUser.id,
        role: input.role,
        invitedBy: ctx.user.id,
        inviteEmail: input.email,
        inviteToken,
        inviteAccepted: false,
      });
      return { success: true, inviteToken };
    }),

  remove: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ input }) => {
      await db.removeBusinessMember(input.memberId);
      return { success: true };
    }),

  updateRole: protectedProcedure
    .input(z.object({ memberId: z.number(), role: z.enum(["admin", "member", "viewer"]) }))
    .mutation(async ({ input }) => {
      await db.updateBusinessMemberRole(input.memberId, input.role);
      return { success: true };
    }),

  myBusinesses: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserBusinesses(ctx.user.id);
  }),
});

// ─── Subscription / Stripe Router ────────────────────────────────────────────

const PLAN_PRICES: Record<string, { paise: number; label: string; priceId: string }> = {
  starter: { paise: 29900, label: "₹299/month", priceId: ENV.stripeStarterPriceId },
  growth: { paise: 59900, label: "₹599/month", priceId: ENV.stripeGrowthPriceId },
  pro: { paise: 99900, label: "₹999/month", priceId: ENV.stripeProPriceId },
};

const subscriptionRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return null;
    const sub = await db.getSubscription(business.id);
    return { business: { plan: business.plan, subscriptionStatus: business.subscriptionStatus, maxContacts: business.maxContacts, maxMessagesPerMonth: business.maxMessagesPerMonth, messagesUsedThisMonth: business.messagesUsedThisMonth }, subscription: sub };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "growth", "pro"]), successUrl: z.string(), cancelUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ENV.stripeSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe not configured" });
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(ENV.stripeSecretKey);
      const planInfo = PLAN_PRICES[input.plan];
      if (!planInfo) throw new TRPCError({ code: "BAD_REQUEST" });

      let customerId = business.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: ctx.user.email || undefined, name: business.name, metadata: { businessId: String(business.id) } });
        customerId = customer.id;
        await db.updateBusiness(business.id, { stripeCustomerId: customerId });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: planInfo.priceId, quantity: 1 }],
        success_url: input.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: input.cancelUrl,
        metadata: { businessId: String(business.id), plan: input.plan },
      });
      return { url: session.url, sessionId: session.id };
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ENV.stripeSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe not configured" });
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business || !business.stripeSubscriptionId) throw new TRPCError({ code: "NOT_FOUND" });
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(ENV.stripeSecretKey);
    await stripe.subscriptions.cancel(business.stripeSubscriptionId);
    await db.updateBusiness(business.id, { subscriptionStatus: "cancelled", plan: "free" });
    return { success: true };
  }),
});

// ─── Widget Tokens Router ─────────────────────────────────────────────────────

const widgetRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwner(ctx.user.id);
    if (!business) return [];
    return db.getWidgetTokens(business.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).default("Default Widget"), config: z.any().optional() }))
    .mutation(async ({ input, ctx }) => {
      const business = await db.getBusinessByOwner(ctx.user.id);
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });
      const token = `wlb_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const id = await db.createWidgetToken({ businessId: business.id, token, name: input.name, config: input.config || {} });
      return { id, token };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), config: z.any().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateWidgetToken(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteWidgetToken(input.id);
      return { success: true };
    }),

  getSnippet: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const widget = await db.getWidgetTokenByToken(input.token);
      if (!widget) throw new TRPCError({ code: "NOT_FOUND" });
      const config = (widget.config as Record<string, unknown>) || {};
      const waNumber = (config.waNumber as string) || "";
      const message = (config.welcomeMessage as string) || "Hi! I'm interested in your services.";
      const snippet = `<!-- WaLeadBot Widget -->
<script>
(function(w,d,s,l,i){
  w[l]=w[l]||[];w[l].push({'widgetId':i,'waNumber':'${waNumber}','message':'${message.replace(/'/g, "\\'")}'});
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s);
  j.async=true;j.src='${ENV.appUrl}/widget.js?t='+new Date().getTime();
  f.parentNode.insertBefore(j,f);
})(window,document,'script','_wlb','${input.token}');
</script>
<!-- End WaLeadBot Widget -->`;
      return { snippet, widget };
    }),
});

// ─── Admin Router (Super Admin) ───────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [totalBusinesses, totalUsers] = await Promise.all([
      db.getBusinessesCount(),
      db.getUsersCount(),
    ]);
    return { totalBusinesses, totalUsers };
  }),

  businesses: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return db.getAllBusinesses(input.limit, input.offset);
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  otp: otpRouter,
  smsOtp: smsOtpRouter,
  business: businessRouter,
  members: membersRouter,
  subscription: subscriptionRouter,
  widget: widgetRouter,
  admin: adminRouter,
  whatsapp: whatsappRouter,
  contacts: contactsRouter,
  conversations: conversationsRouter,
  leads: leadsRouter,
  faq: faqRouter,
  autoReply: autoReplyRouter,
  flows: flowsRouter,
  broadcast: broadcastRouter,
  analytics: analyticsRouter,
  leadForms: leadFormsRouter,
});

export type AppRouter = typeof appRouter;
