# WhatsApp Auto-Replies & Lead Bot — TODO

## Phase 1: Architecture & Schema
- [x] Design system (colors, fonts, tokens) in index.css — OKLCH green theme
- [x] Database schema: businesses, contacts, conversations, messages, leads, faqs, auto_reply_rules, broadcast_campaigns, conversation_flows, whatsapp_configs, otp_tokens, activity_logs
- [x] Run DB migration (14 tables applied)

## Phase 1b: Auth
- [x] OTP auth: email OTP send/verify endpoints
- [x] OTP session management (store OTP in DB with expiry)
- [x] JWT session on OTP verify

## Phase 2: Backend API
- [x] WhatsApp webhook handler (receive/send messages via Meta Cloud API)
- [x] Contacts router (list, update, delete, count)
- [x] Conversations router (list, getMessages, sendMessage, updateStatus)
- [x] Leads router (list, create, update, delete, count)
- [x] FAQ router (list, create, update, delete)
- [x] Auto-reply rules router (list, create, update, delete)
- [x] Broadcast campaigns router (list, create, send)
- [x] Conversation flows router (list, get, create, update, delete)
- [x] Analytics router (stats, recentActivity, leadsChart)
- [x] WhatsApp config router (getConfig, saveConfig, disconnect, getWebhookUrl)
- [x] Business router (get, create, update)
- [x] Rule engine: keyword matching, FAQ matching, flow execution in webhook

## Phase 3: Landing + Auth + Layout
- [x] Elegant landing page with hero, features, industries, pricing, CTA
- [x] OTP Login page (email input → OTP verification → dashboard)
- [x] AppLayout sidebar with all nav items and WhatsApp status indicator
- [x] App.tsx routing for all pages
- [x] Auth guard (redirect to /login if unauthenticated)

## Phase 4: WhatsApp & Automation UI
- [x] WhatsApp connect page (API setup + webhook URL display + test connection)
- [x] Auto-reply rules builder UI (list, create dialog, toggle, delete)
- [x] FAQ bot management UI (list, create/edit dialog, keyword tags, toggle)
- [x] Conversation flows builder UI (list, create, step editor)

## Phase 5: CRM UI
- [x] Leads management page (table, status pipeline, filter, search, create, edit, delete)
- [x] Contacts page (list, search, tags, block/unblock)
- [x] Conversations inbox (list + chat thread view + send message)
- [x] Broadcast campaigns page (create, send, history, status badges)

## Phase 6: Analytics + Settings
- [x] Analytics dashboard (KPI cards, 7-day leads chart, message chart, activity feed)
- [x] Business settings page (profile, notifications, business hours)
- [x] Dashboard overview page (stats, quick actions, recent activity, WhatsApp banner)

## Phase 7: Quality
- [x] Vitest tests for backend routers (18 tests passing across 2 test files)
- [x] TypeScript check — zero errors
- [x] Final UI polish
- [x] Checkpoint saved

## Phase 8: Enhancements
- [x] Resend email OTP integration (real email delivery, graceful fallback to console in dev)
- [x] Step-by-step onboarding wizard (business → WhatsApp → FAQ → auto-reply)
- [x] CSV lead export on Leads page (server-side, with filename + count)
- [x] Tests for new features (24 total tests passing)

## Phase 9: Multi-Tenant Expansion
- [x] DB: subscriptions table (plan, status, stripe_customer_id, stripe_subscription_id)
- [x] DB: widget_tokens table (public token, business_id, config JSON)
- [x] DB: business_members table (user_id, business_id, role: owner/admin/member)
- [x] DB: otp_tokens — add channel column (email/sms/whatsapp)
- [x] DB: businesses — add stripe_customer_id, current_plan, plan_expires_at
- [x] Multi-tenant: all queries scoped to businessId via ctx
- [x] MSG91 SMS OTP integration with graceful fallback
- [x] MSG91 WhatsApp OTP integration
- [x] OTP login: channel selector (email / SMS / WhatsApp)
- [x] Stripe Checkout integration (₹299/₹599/₹999 plans)
- [x] Stripe webhook handler (subscription created/updated/cancelled)
- [x] Subscription gating middleware (plan limits enforcement)
- [x] Embeddable widget API endpoint (public, no auth)
- [x] Widget token generator in dashboard
- [x] Widget snippet builder (HTML + JS chat bubble)
- [x] Enhanced onboarding: business info capture (name, industry, phone, address, logo)
- [x] WhatsApp integration wizard (step-by-step Meta API setup with screenshots guide)
- [x] Multi-business switcher in sidebar
- [x] Business member invite system
- [x] Super-admin dashboard (all businesses, revenue, usage)
- [x] Pricing page with Stripe Checkout redirect
- [x] Subscription management page (upgrade/downgrade/cancel)
- [x] Plan limits UI (usage bars, upgrade prompts)

## Phase 10: Feature Gap Framework

### P0 — AI & Intelligence (5 gaps)
- [x] Anomaly detection engine: flag unusual lead drop/spike patterns with alerts
- [x] Baseline regression tracker: compare current vs historical response/lead metrics
- [x] SLO threshold engine: define SLO targets per business, alert on breach
- [x] AI-powered reply suggestions: LLM suggests best reply based on conversation context
- [x] Smart lead scoring: auto-score leads based on engagement signals

### P0 — Admin & Operations (6 gaps)
- [x] Command Central: super-admin panel (all tenants, revenue, usage, health)
- [x] Coupon/promo engine: create discount codes, apply to Stripe checkout
- [x] Pricing management: admin can change plan limits, prices without redeploy
- [x] Tenant health monitor: per-business WhatsApp status, message queue, error rate
- [x] Bulk operations: bulk assign/delete leads, bulk broadcast, bulk contact import
- [x] Audit log viewer: full activity trail per business with filters

### P1 — Test Configuration (4 gaps)
- [x] Postman collection import: paste JSON, auto-create conversation flow
- [x] OpenAPI/YAML import: parse API spec, generate test scenarios
- [x] Multi-region support: tag contacts/broadcasts by region, filter by geography
- [x] Scripted scenarios: write JS-like condition scripts for advanced flow branching

### P1 — Reporting & Collaboration (4 gaps)
- [x] Shareable report links: generate public read-only link for analytics/lead reports
- [x] PDF export: export lead reports, conversation summaries, analytics to PDF
- [x] Team comments: add internal notes/comments on leads and conversations
- [x] Scheduled reports: auto-email weekly/monthly summary to business owner

### P2 — Integrations (3 gaps)
- [x] Jira integration: create Jira ticket from lead/conversation with one click
- [x] PagerDuty integration: trigger PagerDuty incident on SLO breach or anomaly
- [x] Datadog metrics push: push lead/message/response metrics to Datadog

### P2 — Scalability (3 gaps)
- [x] Distributed agent architecture: UI for managing multiple WhatsApp numbers per business
- [x] Geo-distribution: assign contacts to regional agents based on phone prefix
- [x] Message queue dashboard: view pending/failed message queue with retry controls

## Phase 11: Trial Banner, Template Manager, Public API

- [x] DB: whatsapp_templates table (name, category, language, body, status, meta_template_id)
- [x] DB: webhook_endpoints table (businessId, url, events JSON, secret, isActive)
- [x] DB: webhook_deliveries table (endpointId, event, payload, status, attempts)
- [x] Trial countdown banner component (dismissible, shows days left, Upgrade CTA)
- [x] Banner wired into AppLayout with subscription-aware logic (hide if paid)
- [x] WhatsApp Template Manager page (/dashboard/templates)
- [x] Template create/edit form (name, category, language, body with variable placeholders)
- [x] Template status tracking (pending/approved/rejected)
- [x] Template Manager added to sidebar under Platform
- [x] Public API: POST /api/public/leads (widget token auth)
- [x] Public API: GET /api/public/health
- [x] Webhook endpoints router (list, create, delete, test)
- [x] Outbound webhook event system (fires on lead created/updated, conversation started)
- [x] Webhook delivery log UI in Integrations page
- [x] 24 tests passing, zero TypeScript errors
- [x] Checkpoint saved and pushed to GitHub

## Phase 12: Final Features + User Guide
- [x] Mobile WhatsApp chat preview frame on Widget page (phone mockup, live preview)
- [x] CSV contact import on Contacts page (upload, column mapping, bulk insert)
- [x] Real-time unread badge on Conversations nav (30s polling, auto-clear on visit)
- [x] Comprehensive user guide (Markdown + PDF, all features documented)
- [x] DB schema SQL export file committed to GitHub
- [x] GitHub push with all new code
- [x] Checkpoint saved
