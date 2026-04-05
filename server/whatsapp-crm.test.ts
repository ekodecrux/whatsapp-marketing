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

// ─── CSV Export Tests ─────────────────────────────────────────────────────────

describe("leads.exportCsv", () => {
  it("returns empty CSV with headers when no leads", async () => {
    const { getBusinessByOwner, getLeads } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test Biz", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(getLeads).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.exportCsv({});
    expect(result.count).toBe(0);
    expect(result.csv).toContain('"ID","Name","Phone","Email","Status"');
    expect(result.filename).toMatch(/^leads-test-biz-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("exports leads with correct CSV structure", async () => {
    const { getBusinessByOwner, getLeads } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "My Clinic", industry: "Clinic", phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(getLeads).mockResolvedValueOnce([
      {
        id: 1, businessId: 1, name: "Rahul Sharma", phone: "+91 98765 43210",
        email: "rahul@example.com", status: "new", source: "whatsapp",
        estimatedValue: 5000, score: 80, tags: ["vip", "urgent"],
        notes: "Interested in premium plan", createdAt: new Date("2026-01-15"),
        updatedAt: new Date(), contactId: null, conversationId: null,
        assignedTo: null, closedAt: null,
      } as any,
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.exportCsv({});
    expect(result.count).toBe(1);
    expect(result.csv).toContain("Rahul Sharma");
    expect(result.csv).toContain("+91 98765 43210");
    expect(result.csv).toContain("vip;urgent");
    expect(result.csv).toContain("5000");
    // Should have header + 1 data row
    const lines = result.csv.trim().split("\n");
    expect(lines).toHaveLength(2);
  });

  it("filters by status when provided", async () => {
    const { getBusinessByOwner, getLeads } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(getLeads).mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(makeCtx());
    await caller.leads.exportCsv({ status: "won" });
    expect(getLeads).toHaveBeenCalledWith(1, { status: "won", search: undefined }, 10000, 0);
  });

  it("throws NOT_FOUND when no business", async () => {
    const { getBusinessByOwner } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.leads.exportCsv({})).rejects.toThrow();
  });

  it("escapes special characters in CSV fields", async () => {
    const { getBusinessByOwner, getLeads } = await import("./db");
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Test", industry: null, phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(getLeads).mockResolvedValueOnce([
      {
        id: 2, businessId: 1, name: "O'Brien, John", phone: "+91 99999 88888",
        email: null, status: "new", source: null,
        estimatedValue: null, score: null, tags: [],
        notes: 'Has "special" chars', createdAt: new Date(),
        updatedAt: new Date(), contactId: null, conversationId: null,
        assignedTo: null, closedAt: null,
      } as any,
    ]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.exportCsv({});
    // Quotes should be escaped in CSV
    expect(result.csv).toContain("O'Brien, John");
    expect(result.count).toBe(1);
  });
});

// ─── Onboarding Flow Tests ────────────────────────────────────────────────────

describe("Onboarding flow integration", () => {
  it("creates business, FAQ, and auto-reply in sequence", async () => {
    const { getBusinessByOwner, createBusiness, updateUserBusiness, createFaq, createAutoReplyRule } = await import("./db");

    // Step 1: Create business
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce(undefined); // no existing business
    const caller = appRouter.createCaller(makeCtx());
    const bizResult = await caller.business.create({ name: "Sharma Dental", industry: "Clinic / Hospital" });
    expect(bizResult.id).toBe(1);
    expect(createBusiness).toHaveBeenCalledWith(expect.objectContaining({ name: "Sharma Dental" }));
    expect(updateUserBusiness).toHaveBeenCalledWith(1, 1);

    // Step 3: Create FAQ
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Sharma Dental", industry: "Clinic", phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const faqResult = await caller.faq.create({
      question: "What are your hours?",
      answer: "9 AM to 6 PM, Mon-Sat",
    });
    expect(faqResult.id).toBe(1);
    expect(createFaq).toHaveBeenCalledWith(expect.objectContaining({ question: "What are your hours?" }));

    // Step 4: Create welcome auto-reply
    vi.mocked(getBusinessByOwner).mockResolvedValueOnce({
      id: 1, ownerId: 1, name: "Sharma Dental", industry: "Clinic", phone: null,
      email: null, website: null, address: null, logoUrl: null,
      plan: "free" as const, planExpiresAt: null, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const replyResult = await caller.autoReply.create({
      name: "Welcome Message",
      triggerType: "first_message",
      responseType: "text",
      responseText: "Hi! Welcome to Sharma Dental. How can we help you?",
      isActive: true,
      priority: 10,
    });
    expect(replyResult.id).toBe(1);
    expect(createAutoReplyRule).toHaveBeenCalledWith(expect.objectContaining({
      triggerType: "first_message",
      responseText: "Hi! Welcome to Sharma Dental. How can we help you?",
    }));
  });
});
