# WaLeadBot — Complete User Guide

**Version 1.0 · April 2026**

WaLeadBot is a multi-tenant WhatsApp Business Automation and CRM platform built for Indian SMBs — clinics, real estate agencies, tuition centres, salons, and local service businesses. This guide walks through every feature from first login to advanced automation.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [OTP Login](#2-otp-login)
3. [Onboarding Wizard](#3-onboarding-wizard)
4. [Connecting WhatsApp](#4-connecting-whatsapp)
5. [Dashboard Overview](#5-dashboard-overview)
6. [Conversations Inbox](#6-conversations-inbox)
7. [Leads CRM](#7-leads-crm)
8. [Contacts Management](#8-contacts-management)
9. [Auto-Reply Rules](#9-auto-reply-rules)
10. [FAQ Bot](#10-faq-bot)
11. [Conversation Flows](#11-conversation-flows)
12. [Broadcast Campaigns](#12-broadcast-campaigns)
13. [WhatsApp Templates](#13-whatsapp-templates)
14. [Analytics & Reporting](#14-analytics--reporting)
15. [AI Intelligence](#15-ai-intelligence)
16. [Embeddable Widget](#16-embeddable-widget)
17. [Webhooks & Public API](#17-webhooks--public-api)
18. [Integrations](#18-integrations)
19. [Team Management](#19-team-management)
20. [Billing & Subscription](#20-billing--subscription)
21. [Settings](#21-settings)
22. [Admin Command Central](#22-admin-command-central)
23. [Scalability & Agents](#23-scalability--agents)
24. [Frequently Asked Questions](#24-frequently-asked-questions)
25. [Secrets & API Keys Reference](#25-secrets--api-keys-reference)

---

## 1. Getting Started

WaLeadBot is accessed entirely through the web browser — no app installation is required. Navigate to your deployed URL (e.g., `https://your-project.manus.space`) to begin.

**Supported browsers:** Chrome, Firefox, Edge (Chromium). Safari Private Browsing and Brave Shields may block session cookies — use a standard browser window.

**System requirements:** Any device with a modern browser and internet connection. The dashboard is fully responsive and works on mobile phones, tablets, and desktops.

---

## 2. OTP Login

WaLeadBot uses a passwordless OTP (One-Time Password) login system. There is no password to remember — you receive a 6-digit code each time you sign in.

### Step 1 — Choose your channel

On the login page, select how you want to receive your OTP:

| Channel | Description | Requires |
|---|---|---|
| **Email** | 6-digit code sent to your email inbox | Resend API key configured |
| **SMS** | Code sent via SMS to your mobile number | MSG91 API key configured |
| **WhatsApp** | Code sent as a WhatsApp message | MSG91 API key configured |

In development mode (before API keys are added), the OTP is printed to the server console and shown as a toast notification in the browser — useful for testing.

### Step 2 — Enter your identifier

Type your email address (for Email channel) or phone number with country code (for SMS/WhatsApp, e.g. `+919876543210`).

### Step 3 — Enter the OTP

A 6-digit code is sent to your chosen channel. Enter it within **10 minutes**. If the code expires, click **Resend OTP**.

### First-time users

New users are automatically redirected to the **Onboarding Wizard** after their first successful login.

---

## 3. Onboarding Wizard

The 4-step onboarding wizard guides new businesses through the essential setup. Each step can be skipped and completed later from the Settings or WhatsApp Connect pages.

### Step 1 — Business Profile

Fill in your business details:

- **Business Name** (required)
- **Industry** — Clinic, Real Estate, Tuition, Salon, Restaurant, Retail, or Other
- **Phone Number** — your business contact number
- **Address** — city and full address
- **Website** — optional
- **Description** — a brief description shown in your widget

### Step 2 — Connect WhatsApp

This step links your Meta WhatsApp Business account. You will need:

1. A **Meta Business Account** at [business.facebook.com](https://business.facebook.com)
2. A **WhatsApp Business App** registered under that account
3. A **Phone Number ID** and **WhatsApp Business Account ID** from the Meta Developer Console
4. A **Permanent Access Token** (not a temporary one — generate a System User token)

The webhook URL shown in this step must be entered in the Meta Developer Console under **Webhooks → WhatsApp Business Account**.

### Step 3 — First FAQ

Add your first FAQ entry. This teaches the bot how to respond to common questions automatically. Example:

- **Question:** "What are your timings?"
- **Answer:** "We are open Monday to Saturday, 9 AM to 7 PM."

### Step 4 — Welcome Auto-Reply

Configure the message that is automatically sent to every new customer who messages you for the first time. A live WhatsApp-style preview is shown as you type.

---

## 4. Connecting WhatsApp

Navigate to **Platform → WhatsApp** from the sidebar to manage your WhatsApp connection at any time.

### Meta Cloud API Setup

WaLeadBot uses the **Meta Cloud API** (not the unofficial WhatsApp Web API). This is the official, production-grade integration that Meta supports for businesses.

**Required credentials:**

| Field | Where to find it |
|---|---|
| Phone Number ID | Meta Developer Console → Your App → WhatsApp → API Setup |
| WhatsApp Business Account ID | Meta Business Manager → Business Settings → WhatsApp Accounts |
| Access Token | Meta Developer Console → System Users → Generate Token |
| Webhook Verify Token | Any random string you choose (e.g., `my-secret-token-2026`) |

**Webhook setup in Meta Developer Console:**

1. Go to your Meta App → **WhatsApp → Configuration**
2. Set **Callback URL** to the webhook URL shown in WaLeadBot (e.g., `https://your-project.manus.space/api/webhook/whatsapp`)
3. Set **Verify Token** to the same string you entered in WaLeadBot
4. Subscribe to the **messages** webhook field

### Testing the connection

After saving your credentials, click **Test Connection** to verify the API is reachable. A green "Connected" badge will appear in the sidebar when the connection is active.

---

## 5. Dashboard Overview

The main dashboard (`/dashboard`) provides a real-time overview of your business performance.

**KPI Cards** at the top show:

- Total Leads (all time)
- New Leads this month
- Active Conversations (open status)
- Total Contacts

**7-day Leads Chart** shows daily lead volume as a bar chart.

**Quick Actions** provide one-click shortcuts to the most common tasks: Add Lead, Send Broadcast, Add FAQ, and View Conversations.

**Recent Activity Feed** lists the last 10 events across your account — new leads, messages received, broadcasts sent, and more.

---

## 6. Conversations Inbox

Navigate to **Core → Conversations** to view all WhatsApp conversations.

### Conversation list

Conversations are listed with the contact name (or phone number), last message preview, timestamp, and status badge. The **Conversations** nav item shows a red unread badge that auto-refreshes every 30 seconds.

**Status types:**

| Status | Meaning |
|---|---|
| **Open** | Active conversation requiring attention |
| **Resolved** | Marked as handled |
| **Pending** | Waiting for customer reply |
| **Bot** | Being handled by the auto-reply/FAQ bot |

### Message thread

Click any conversation to open the message thread. Messages are displayed in a WhatsApp-style chat bubble layout — your messages on the right (green), customer messages on the left (white).

### Sending a message

Type in the message input at the bottom and press **Enter** or click **Send**. If your WhatsApp API is connected, the message is delivered via the Meta Cloud API in real time.

### Updating status

Use the status dropdown in the conversation header to change the status. Marking a conversation as **Resolved** removes it from the active queue.

---

## 7. Leads CRM

Navigate to **Core → Leads** to manage your sales pipeline.

### Lead pipeline

Leads move through 6 stages:

| Stage | Description |
|---|---|
| **New** | Just captured, not yet contacted |
| **Contacted** | Initial outreach made |
| **Qualified** | Confirmed interest and budget |
| **Proposal** | Quote or proposal sent |
| **Won** | Deal closed successfully |
| **Lost** | Deal did not close |

### Adding a lead manually

Click **Add Lead** and fill in:

- Name, Phone (required), Email
- Source (WhatsApp, Website, Referral, Walk-in, Other)
- Status, Estimated Value (₹)
- Tags (comma-separated labels)
- Notes

### Filtering and searching

Use the **Status** dropdown and **Search** box to filter leads. The search matches against name, phone, and email.

### Exporting to CSV

Click **Export CSV** to download all leads matching the current filter. The file is named `leads-{business-name}-{date}.csv` and includes all fields including tags, notes, and estimated value.

### Lead scoring (AI)

The AI Intelligence page can auto-score leads based on engagement signals. Scores appear as a coloured badge on each lead card.

---

## 8. Contacts Management

Navigate to **Core → Contacts** to view and manage your WhatsApp contacts.

Contacts are created automatically when a customer messages your WhatsApp number. You can also import contacts in bulk via CSV.

### Importing contacts from CSV

1. Click **Import CSV** in the top-right corner
2. **Upload** your CSV file (drag-and-drop or click to browse)
3. **Map columns** — WaLeadBot auto-detects common column names (Phone, Name, Email, Tags, Notes). Adjust the mapping if needed. The WhatsApp Number column is required.
4. **Preview** the first 5 contacts before committing
5. Click **Import** — duplicate phone numbers are updated, not duplicated

**Download the template** from the upload screen to get a correctly formatted sample CSV.

### Editing a contact

Click **Edit** on any contact card to update the name, email, tags, notes, or block status.

### Blocking a contact

Toggle **Block this contact** in the edit dialog. Blocked contacts will not receive auto-replies or be included in broadcasts.

---

## 9. Auto-Reply Rules

Navigate to **Automation → Auto-Reply** to configure keyword-triggered automatic responses.

### How auto-replies work

When a customer sends a message, WaLeadBot checks it against all active auto-reply rules in priority order. The first matching rule sends its configured response.

### Creating a rule

Click **Add Rule** and configure:

| Field | Description |
|---|---|
| **Rule Name** | Internal label (e.g., "Pricing Query") |
| **Trigger Type** | Keyword, Exact Match, Contains, Regex, or Any Message |
| **Keywords** | Comma-separated list of trigger words |
| **Response** | The message to send back |
| **Priority** | Lower number = higher priority (1 is checked first) |

### Trigger types explained

- **Keyword** — matches if any keyword appears anywhere in the message (case-insensitive)
- **Exact Match** — matches only if the entire message equals the keyword
- **Contains** — matches if the message contains the phrase
- **Regex** — matches using a regular expression pattern
- **Any Message** — matches every incoming message (use as a fallback/welcome rule)

### Enabling/disabling rules

Use the toggle switch on each rule card to enable or disable it without deleting it.

---

## 10. FAQ Bot

Navigate to **Automation → FAQ Bot** to manage your question-and-answer knowledge base.

### How the FAQ bot works

When a customer message does not match any auto-reply rule, the FAQ bot checks if the message is semantically similar to any FAQ question using keyword matching. If a match is found, the answer is sent automatically.

### Adding a FAQ entry

Click **Add FAQ** and enter:

- **Question** — the question as a customer would ask it
- **Answer** — the response to send
- **Keywords** — comma-separated keywords that trigger this FAQ (e.g., `price, cost, fee, charges`)
- **Category** — optional grouping label

### Best practices

Write questions in natural language as customers would phrase them. Add multiple keyword variations to improve matching. For example, for a pricing FAQ, add keywords: `price, cost, fee, charges, rate, how much`.

---

## 11. Conversation Flows

Navigate to **Automation → Flows** to build multi-step automated conversation sequences.

### What are flows?

Flows are scripted conversation sequences that guide customers through a series of questions and responses. For example, a "Appointment Booking" flow might ask for the customer's name, preferred date, and service type — collecting this information as a lead automatically.

### Creating a flow

1. Click **Create Flow**
2. Give it a name and description
3. Add **steps** — each step has a message to send and optionally captures a variable (e.g., `{{name}}`, `{{date}}`)
4. Set the **trigger** — the keyword or event that starts this flow

### Flow step types

| Type | Description |
|---|---|
| **Message** | Send a text message |
| **Question** | Send a message and wait for a reply (saves reply as a variable) |
| **Condition** | Branch the flow based on the customer's reply |
| **End** | Terminate the flow and optionally create a lead |

---

## 12. Broadcast Campaigns

Navigate to **Automation → Broadcast** to send bulk messages to your contacts.

> **Important:** Meta requires all outbound broadcast messages to use pre-approved **Message Templates** (HSM). Create and get your templates approved first (see Section 13) before sending broadcasts.

### Creating a campaign

1. Click **Create Campaign**
2. Enter a campaign name and select the target audience (All Contacts, or filter by tag)
3. Write your message or select an approved template
4. Click **Send Now** or schedule for later

### Campaign status

| Status | Meaning |
|---|---|
| **Draft** | Not yet sent |
| **Sending** | Currently being delivered |
| **Sent** | Delivery complete |
| **Failed** | Delivery failed (check WhatsApp connection) |

### Recipient count

The campaign creation form shows the estimated recipient count based on your audience filter before you send.

---

## 13. WhatsApp Templates

Navigate to **Platform → Templates** to manage your Meta-approved message templates.

### Why templates are required

Meta's WhatsApp Business Policy requires that all **business-initiated** messages (broadcasts, follow-ups) use pre-approved templates. Customer-initiated conversations (replies) can use free-form text.

### Template categories

| Category | Use case |
|---|---|
| **Marketing** | Promotions, offers, announcements |
| **Utility** | Appointment reminders, order updates |
| **Authentication** | OTP codes, verification |

### Creating a template

1. Click **Create Template**
2. Enter a template name (lowercase, underscores only, e.g., `appointment_reminder`)
3. Select category and language
4. Write the body text. Use `{{1}}`, `{{2}}` etc. for variable placeholders
5. Add a header (text or image) and footer (optional)
6. Click **Submit for Approval**

### Approval process

After submission, Meta reviews the template (typically within 24 hours). The status changes from **Pending** to **Approved** or **Rejected**. Rejected templates show the rejection reason.

### Live preview

As you type the template body, a live WhatsApp-style phone preview updates in real time, showing exactly how the message will appear to recipients.

---

## 14. Analytics & Reporting

### Analytics page

Navigate to **Intelligence → Analytics** for a comprehensive view of your business metrics.

**Available charts:**

- 7-day message volume (sent vs. received)
- Lead conversion funnel (new → won)
- Top performing auto-reply rules
- Contact growth over time
- Response time distribution

### Reporting page

Navigate to **Intelligence → Reporting** for advanced reporting features:

- **Shareable Report Links** — generate a public read-only URL for any report to share with stakeholders
- **PDF Export** — download any report as a formatted PDF
- **Team Comments** — add internal notes to reports for team collaboration
- **Scheduled Reports** — configure weekly or monthly email summaries sent automatically to the business owner

---

## 15. AI Intelligence

Navigate to **Intelligence → AI Intelligence** for AI-powered insights and automation.

### Anomaly Detection

The system monitors your lead volume, message volume, and response times. When a metric deviates significantly from the baseline (e.g., lead volume drops 50% vs. last week), an alert is raised with the severity level and recommended action.

### SLO Thresholds

Define Service Level Objectives for your business:

- **Response Time SLO** — target time to first reply (e.g., under 5 minutes)
- **Lead Conversion SLO** — target conversion rate (e.g., 20% of leads to Won)
- **Resolution Time SLO** — target time to resolve a conversation

Breaches are highlighted with red badges and trigger notifications.

### Lead Scoring

Click **Score All Leads** to run the AI scoring engine. Each lead receives a score from 0–100 based on:

- Recency of last interaction
- Number of messages exchanged
- Estimated deal value
- Tags and source

### AI Reply Suggestions

In the Conversations page, the AI can suggest the best reply based on the conversation context. Click the suggestion to insert it into the message box.

---

## 16. Embeddable Widget

Navigate to **Platform → Widget** to create a WhatsApp chat bubble for your website.

### Creating a widget

1. Click **Create Widget**
2. Configure the appearance:
   - **Button Color** — matches your brand
   - **Position** — bottom-right or bottom-left
   - **Welcome Message** — shown when the bubble is expanded
   - **Pre-filled Message** — text pre-filled in WhatsApp when the customer clicks
3. A live **mobile phone mockup preview** shows exactly how the widget looks on a smartphone

### Getting the embed code

Click **Get Embed Code** on any widget to copy the HTML snippet. Paste it before the `</body>` tag on your website.

```html
<!-- WaLeadBot Chat Widget -->
<script>
  window.WaLeadBotConfig = {
    token: "your-widget-token",
    phone: "919876543210",
    message: "Hi, I'm interested in your services!"
  };
</script>
<script src="https://your-project.manus.space/widget.js" async></script>
```

### How leads are captured

When a visitor clicks the chat bubble and sends a WhatsApp message, WaLeadBot automatically creates a contact and lead in your CRM, tagged with the source `widget`.

---

## 17. Webhooks & Public API

### Public API

WaLeadBot exposes a public REST API for external integrations:

**Endpoint:** `POST /api/public/leads`

**Authentication:** Pass your widget token in the `Authorization` header:
```
Authorization: Bearer your-widget-token
```

**Request body:**
```json
{
  "name": "Rahul Sharma",
  "phone": "+919876543210",
  "email": "rahul@example.com",
  "source": "website-form",
  "notes": "Interested in 2BHK"
}
```

**Response:**
```json
{
  "success": true,
  "leadId": 42,
  "contactId": 15
}
```

### Outbound Webhooks

Navigate to **Platform → Webhooks** to configure outbound webhook endpoints. WaLeadBot fires events to your URL when key actions occur.

**Available events:**

| Event | Triggered when |
|---|---|
| `lead.created` | A new lead is added to the CRM |
| `lead.updated` | A lead's status or details change |
| `message.received` | A new WhatsApp message arrives |
| `conversation.started` | A new conversation is opened |
| `broadcast.sent` | A broadcast campaign completes |

**Security:** Each webhook endpoint has a secret key. WaLeadBot signs every request with an HMAC-SHA256 signature in the `X-WaLeadBot-Signature` header. Verify this in your server to ensure requests are genuine.

---

## 18. Integrations

Navigate to **Platform → Integrations** to connect WaLeadBot with external tools.

| Integration | What it does |
|---|---|
| **Slack** | Post new lead notifications to a Slack channel |
| **Zapier** | Connect to 5,000+ apps via Zapier webhooks |
| **Jira** | Create a Jira issue from any lead with one click |
| **PagerDuty** | Trigger an incident when an SLO is breached |
| **Datadog** | Push lead/message metrics to your Datadog dashboard |

Each integration requires the corresponding API key or webhook URL. Keys are stored securely and never exposed in the frontend.

---

## 19. Team Management

Navigate to **Account → Team** to manage who has access to your WaLeadBot workspace.

### Roles

| Role | Permissions |
|---|---|
| **Owner** | Full access, billing, delete workspace |
| **Admin** | Full access except billing and workspace deletion |
| **Member** | View and edit leads, contacts, conversations |
| **Viewer** | Read-only access to all data |

### Inviting a team member

1. Click **Invite Member**
2. Enter their email address and select a role
3. They receive an invitation email with a login link

### Removing a member

Click the **Remove** button next to any team member. The owner cannot be removed.

---

## 20. Billing & Subscription

Navigate to **Account → Billing** to manage your subscription plan.

### Plans

| Plan | Price | Contacts | Broadcasts/month | Team Members |
|---|---|---|---|---|
| **Starter** | ₹299/month | 500 | 1,000 | 1 |
| **Growth** | ₹599/month | 2,000 | 5,000 | 5 |
| **Pro** | ₹999/month | Unlimited | Unlimited | Unlimited |

All plans include: Auto-replies, FAQ bot, Conversation flows, Lead CRM, Analytics, and WhatsApp API integration.

### Upgrading

Click **Upgrade** on any plan card to be redirected to Stripe Checkout. Use test card `4242 4242 4242 4242` (any future expiry, any CVV) to test payments.

### 14-day free trial

New accounts automatically start on a 14-day free trial of the Pro plan. A countdown banner in the dashboard header shows the days remaining. After the trial, the account is downgraded to Starter unless a paid plan is activated.

### Cancelling

Click **Cancel Subscription** on the Billing page. Your plan remains active until the end of the current billing period.

---

## 21. Settings

Navigate to **Account → Settings** to configure your business profile and notification preferences.

### Business Profile

Update your business name, industry, phone, address, website, and description. These details are used in the embeddable widget and email notifications.

### Business Hours

Configure your operating hours per day of the week. Outside business hours, the auto-reply bot can send a custom "We're closed" message.

### Notifications

Toggle email notifications for:

- New lead captured
- New WhatsApp message received
- SLO breach alert
- Weekly summary report

---

## 22. Admin Command Central

Navigate to **Account → Admin** (visible only to users with the Admin role).

The Admin Command Central provides a platform-wide view for managing all tenants:

- **Platform Stats** — total businesses, leads, messages, and monthly revenue
- **Tenant Health** — per-business WhatsApp connection status, message queue depth, and error rate
- **Coupon Engine** — create discount codes (percentage or fixed amount) for Stripe checkout
- **Pricing Management** — adjust plan limits (contact limits, broadcast limits) without redeployment
- **Audit Log** — full activity trail across all businesses with date and user filters

---

## 23. Scalability & Agents

Navigate to **Platform → Scalability** to manage distributed WhatsApp agents.

### What are agents?

For high-volume businesses, WaLeadBot supports multiple WhatsApp phone numbers (agents) under a single business account. Each agent handles a subset of conversations, enabling parallel processing.

### Geo-routing

Assign contacts to agents based on phone number prefix (e.g., `+9180` → Mumbai agent, `+9144` → Chennai agent). This ensures customers are handled by the most relevant team.

### Message queue dashboard

View the current message queue depth per agent, retry failed messages, and monitor delivery rates in real time.

---

## 24. Frequently Asked Questions

**Q: Can I use WaLeadBot without the Meta Cloud API?**
No. WaLeadBot uses the official Meta Cloud API for all WhatsApp messaging. Unofficial WhatsApp Web scraping is against Meta's Terms of Service and is not supported.

**Q: How do I get a permanent access token?**
In the Meta Developer Console, go to **Business Settings → System Users**, create a System User, assign it to your WhatsApp Business Account with full permissions, and generate a token. System User tokens do not expire.

**Q: Why is my OTP not arriving?**
In development mode, OTPs are logged to the server console. For production, ensure `RESEND_API_KEY` (for email) or `MSG91_API_KEY` (for SMS/WhatsApp) is configured in Settings → Secrets.

**Q: Can I import contacts from WhatsApp directly?**
WhatsApp does not provide an API to export contacts. Use the CSV import feature to bulk-import contacts from your phone's exported contact list or an existing CRM export.

**Q: What happens if a customer sends a message outside business hours?**
If business hours are configured in Settings, the bot automatically sends your "outside hours" message. Auto-reply rules and FAQ bot are still active 24/7 unless you configure them otherwise.

**Q: How do I test broadcasts without sending to real customers?**
Create a test contact with your own WhatsApp number and tag it `test`. Create a broadcast targeting only the `test` tag to verify the message before sending to all contacts.

**Q: Is customer data stored securely?**
All data is stored in a managed MySQL/TiDB database with encrypted connections. Webhook secrets are stored as hashed values. API keys are stored server-side and never exposed to the frontend.

---

## 25. Secrets & API Keys Reference

The following environment variables must be configured in **Settings → Secrets** to enable full functionality:

| Key | Service | Purpose |
|---|---|---|
| `RESEND_API_KEY` | [Resend](https://resend.com) | Email OTP delivery |
| `RESEND_FROM_EMAIL` | Resend | Sender email address (e.g., `noreply@yourdomain.com`) |
| `MSG91_API_KEY` | [MSG91](https://msg91.com) | SMS and WhatsApp OTP delivery |
| `MSG91_SENDER_ID` | MSG91 | SMS sender ID (6-character alphanumeric) |
| `MSG91_WHATSAPP_NUMBER` | MSG91 | WhatsApp number for OTP delivery |
| `STRIPE_SECRET_KEY` | [Stripe](https://stripe.com) | Payment processing (server-side) |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signature verification |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe | Payment processing (client-side) |

All keys are optional — the platform runs in demo/development mode without them, with graceful fallbacks (OTPs logged to console, payments disabled).

---

## Quick Start Checklist

Use this checklist to go live in under 30 minutes:

- [ ] Sign up with your email and verify OTP
- [ ] Complete the onboarding wizard (business profile + WhatsApp connection)
- [ ] Add 5–10 FAQ entries for your most common questions
- [ ] Create a welcome auto-reply (trigger: Any Message, priority: 99)
- [ ] Import your existing contacts via CSV
- [ ] Add your team members
- [ ] Configure your embeddable widget and paste it on your website
- [ ] Create your first broadcast campaign
- [ ] Set up your Stripe billing to activate a paid plan
- [ ] Configure Resend/MSG91 API keys for production OTP delivery

---

*WaLeadBot is built for Indian SMBs. For support, contact your administrator or refer to the in-app help tooltips.*
