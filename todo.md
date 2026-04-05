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
- [ ] Checkpoint saved
