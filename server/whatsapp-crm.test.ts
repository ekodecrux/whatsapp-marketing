import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getBusinessByOwner: vi.fn(),
  createBusiness: vi.fn().mockResolvedValue(1),
  updateBusiness: vi.fn().mockResolvedValue(undefined),
  updateUserBusiness: vi.fn().mockResolvedValue(undefined),
  getWhatsappConfig: vi.fn().mockResolvedValue(null),
  upsertWhatsappConfig: vi.fn().mockResolvedValue(undefined),
  getContacts: vi.fn().mockResolvedValue([]),
  updateContact: vi.fn().mockResolvedValue(undefined),
  deleteContact: vi.fn().mockResolvedValue(undefined),
  getContactsCount: vi.fn().mockResolvedValue(0),
  getConversations: vi.fn().mockResolvedValue([]),
  getMessages: vi.fn().mockResolvedValue([]),
  getConversationById: vi.fn().mockResolvedValue(null),
  createMessage: vi.fn().mockResolvedValue(1),
  updateConversation: vi.fn().mockResolvedValue(undefined),
  getContactByWaId: vi.fn().mockResolvedValue(null),
  getLeads: vi.fn().mockResolvedValue([]),
  createLead: vi.fn().mockResolvedValue(1),
  updateLead: vi.fn().mockResolvedValue(undefined),
  deleteLead: vi.fn().mockResolvedValue(undefined),
  getLeadsCount: vi.fn().mockResolvedValue(0),
  getFaqs: vi.fn().mockResolvedValue([]),
  createFaq: vi.fn().mockResolvedValue(1),
  updateFaq: vi.fn().mockResolvedValue(undefined),
  deleteFaq: vi.fn().mockResolvedValue(undefined),
  getAutoReplyRules: vi.fn().mockResolvedValue([]),
  createAutoReplyRule: vi.fn().mockResolvedValue(1),
  updateAutoReplyRule: vi.fn().mockResolvedValue(undefined),
  deleteAutoReplyRule: vi.fn().mockResolvedValue(undefined),
  getConversationFlows: vi.fn().mockResolvedValue([]),
  getConversationFlowById: vi.fn().mockResolvedValue(null),
  createConversationFlow: vi.fn().mockResolvedValue(1),
  updateConversationFlow: vi.fn().mockResolvedValue(undefined),
  deleteConversationFlow: vi.fn().mockResolvedValue(undefined),
  getBroadcastCampaigns: vi.fn().mockResolvedValue([]),
  getBroadcastCampaignById: vi.fn().mockResolvedValue(null),
  createBroadcastCampaign: vi.fn().mockResolvedValue(1),
  updateBroadcastCampaign: vi.fn().mockResolvedValue(undefined),
  getAnalyticsStats: vi.fn().mockResolvedValue({
    totalLeads: 5, newLeads: 2, wonLeads: 1,
    totalContacts: 10, totalConversations: 8, openConversations: 3,
    totalMessages: 50, autoReplies: 20, recentLeads: [],
  }),
  logActivity: vi.fn().mockResolvedValue(undefined),
  createOtp: vi.fn().mockResolvedValue(undefined),
  verifyOtp: vi.fn().mockResolvedValue(false),
  getUserByEmail: vi.fn().mockResolvedValue(null),
  createUserByEmail: vi.fn().mockResolvedValue(null),
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Test Context ─────────────────────────────────────────────────────────────

function makeCtx(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "otp",
      role: "user",
      phone: null,
      businessId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Business Tests ───────────────────────────────────────────────────────────

describe("business.get", () => {
  it("returns null when no business exists", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.business.get();
    expect(result).toBeUndefined();
  });

  it("returns business when it exists", async () => {
    const { getBusinessByOwner } = await import("./db");
    const mockBusiness = {
      id: 1, ownerId: 1, name: "Test Clinic", industry: "Clinic",
      phone: "+91 98765 43210", email: "clinic@test.com",
      website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(mockBusiness);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.business.get();
    expect(result?.name).toBe("Test Clinic");
  });
});

describe("business.create", () => {
  it("creates a new business", async () => {
    const { getBusinessByOwner, createBusiness } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.business.create({ name: "My Clinic" });
    expect(result.id).toBe(1);
    expect(createBusiness).toHaveBeenCalledWith(expect.objectContaining({ name: "My Clinic" }));
  });

  it("throws CONFLICT if business already exists", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Existing", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.business.create({ name: "Another" })).rejects.toThrow("Business already exists");
  });
});

// ─── Leads Tests ──────────────────────────────────────────────────────────────

describe("leads.list", () => {
  it("returns empty array when no business", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.list({ limit: 50, offset: 0 });
    expect(result).toEqual([]);
  });

  it("returns leads when business exists", async () => {
    const { getBusinessByOwner, getLeads } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const mockLeads = [{ id: 1, businessId: 1, name: "John", phone: "+91 98765 43210", status: "new" }];
    vi.mocked(getLeads).mockResolvedValueOnce(mockLeads as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.list({ limit: 50, offset: 0 });
    expect(result).toHaveLength(1);
    expect((result as any)[0].name).toBe("John");
  });
});

describe("leads.create", () => {
  it("creates a lead with required phone", async () => {
    const { getBusinessByOwner, createLead } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.create({ phone: "+91 98765 43210", name: "Jane" });
    expect(result.id).toBe(1);
  });
});

// ─── FAQ Tests ────────────────────────────────────────────────────────────────

describe("faq.list", () => {
  it("returns empty array when no business", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.faq.list();
    expect(result).toEqual([]);
  });
});

describe("faq.create", () => {
  it("creates FAQ with question and answer", async () => {
    const { getBusinessByOwner, createFaq } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.faq.create({
      question: "What are your hours?",
      answer: "9 AM to 6 PM, Mon-Sat",
    });
    expect(result.id).toBe(1);
    expect(createFaq).toHaveBeenCalledWith(expect.objectContaining({
      question: "What are your hours?",
    }));
  });
});

// ─── Auto-Reply Tests ─────────────────────────────────────────────────────────

describe("autoReply.create", () => {
  it("creates an auto-reply rule", async () => {
    const { getBusinessByOwner, createAutoReplyRule } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.autoReply.create({
      name: "Welcome",
      triggerType: "first_message",
      responseText: "Welcome to our clinic!",
    });
    expect(result.id).toBe(1);
  });
});

// ─── Analytics Tests ──────────────────────────────────────────────────────────

describe("analytics.stats", () => {
  it("returns null when no business", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.stats();
    expect(result).toBeNull();
  });

  it("returns stats when business exists", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.stats();
    expect(result).not.toBeNull();
    expect(result?.totalLeads).toBe(5);
    expect(result?.totalContacts).toBe(10);
  });
});

// ─── WhatsApp Config Tests ────────────────────────────────────────────────────

describe("whatsapp.getConfig", () => {
  it("returns null when no business", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.whatsapp.getConfig();
    expect(result).toBeNull();
  });
});

describe("whatsapp.saveConfig", () => {
  it("saves WhatsApp config", async () => {
    const { getBusinessByOwner, upsertWhatsappConfig } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.whatsapp.saveConfig({
      phoneNumberId: "123456789",
      wabaId: "987654321",
      accessToken: "EAAtest123",
      verifyToken: "my_verify_token",
    });
    expect(result.success).toBe(true);
    expect(upsertWhatsappConfig).toHaveBeenCalledWith(1, expect.objectContaining({
      phoneNumberId: "123456789",
      isConnected: true,
    }));
  });
});
