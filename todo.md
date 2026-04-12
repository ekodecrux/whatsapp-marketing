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
