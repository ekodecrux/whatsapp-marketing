# WaLeadBot — WhatsApp Auto-Replies & Lead Bot

> **WhatsApp Business Automation SaaS for Indian SMBs**
> Auto-reply to customers, capture leads, answer FAQs, and broadcast offers — all from one elegant dashboard.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11-398CCB)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-24%20passing-brightgreen)](#testing)

---

## Features

| Feature | Description |
|---|---|
| **OTP Login** | Passwordless email OTP login via Resend (dev fallback included) |
| **WhatsApp Connect** | Meta Cloud API integration with webhook setup guide |
| **Auto-Reply Rules** | Keyword/trigger-based auto-responses with priority ordering |
| **FAQ Bot** | Q&A pairs with keyword matching, auto-answered on WhatsApp |
| **Conversation Flows** | Multi-step conditional flows with branching logic |
| **Lead CRM** | Full pipeline (New → Contacted → Qualified → Proposal → Won/Lost) |
| **Contacts** | WhatsApp contact management with tags and block/unblock |
| **Conversations Inbox** | Real-time message thread view with send capability |
| **Broadcast Campaigns** | Bulk messaging to contacts with status tracking |
| **Analytics Dashboard** | KPI cards, 7-day charts, activity feed |
| **Business Settings** | Profile, business hours, notification preferences |
| **Onboarding Wizard** | 4-step guided setup for new users |
| **CSV Export** | Server-side lead export with filters and proper escaping |

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript 5.9**
- **Tailwind CSS 4** with OKLCH color system (WhatsApp green theme)
- **shadcn/ui** component library
- **tRPC** client with React Query
- **Recharts** for analytics charts
- **Wouter** for routing
- **Framer Motion** for animations

### Backend
- **Node.js** + **Express 4**
- **tRPC 11** for type-safe API
- **Drizzle ORM** with MySQL/TiDB
- **Resend** for transactional email (OTP)
- **Jose** for JWT session management
- **Meta Cloud API** for WhatsApp webhook

### Infrastructure
- **MySQL / TiDB** database
- **S3** for file storage
- **Vitest** for testing (24 tests)

---

## Project Structure

```
whatsapp-lead-bot/
├── client/                    # React frontend
│   └── src/
│       ├── pages/             # All page components
│       │   ├── Home.tsx       # Landing page
│       │   ├── Login.tsx      # OTP login
│       │   ├── Onboarding.tsx # 4-step setup wizard
│       │   ├── Dashboard.tsx  # Main overview
│       │   ├── Leads.tsx      # CRM with CSV export
│       │   ├── Contacts.tsx   # Contact management
│       │   ├── Conversations.tsx # Inbox + chat view
│       │   ├── Broadcast.tsx  # Campaign management
│       │   ├── AutoReply.tsx  # Auto-reply rules
│       │   ├── FaqBot.tsx     # FAQ management
│       │   ├── Flows.tsx      # Conversation flows
│       │   ├── Analytics.tsx  # Charts & metrics
│       │   ├── WhatsAppConnect.tsx # API setup
│       │   └── Settings.tsx   # Business settings
│       ├── components/
│       │   └── AppLayout.tsx  # Sidebar dashboard layout
│       └── index.css          # OKLCH green design system
├── server/
│   ├── routers.ts             # All tRPC routers (OTP, leads, FAQ, etc.)
│   ├── db.ts                  # All database query helpers
│   ├── webhook.ts             # WhatsApp Meta Cloud API webhook handler
│   ├── whatsapp-crm.test.ts   # 23 feature tests
│   └── auth.logout.test.ts    # Auth test
├── drizzle/
│   └── schema.ts              # Complete 14-table database schema
└── shared/
    └── const.ts               # Shared constants
```

---

## Database Schema

The application uses **14 tables**:

| Table | Purpose |
|---|---|
| `users` | Auth users with role (admin/user) |
| `businesses` | Business profiles linked to owners |
| `whatsapp_configs` | Meta Cloud API credentials per business |
| `contacts` | WhatsApp contacts with tags and block status |
| `conversations` | WhatsApp conversation threads |
| `messages` | Individual messages in conversations |
| `leads` | CRM leads with pipeline status |
| `faqs` | FAQ Q&A pairs with keyword matching |
| `auto_reply_rules` | Trigger-based auto-response rules |
| `conversation_flows` | Multi-step conversation flow definitions |
| `broadcast_campaigns` | Bulk message campaigns |
| `otp_tokens` | Email OTP tokens with expiry |
| `activity_logs` | Audit trail for all business actions |
| `lead_forms` | Custom lead capture form definitions |

---

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL or TiDB database

### Installation

```bash
# Clone the repository
git clone https://github.com/ekodecrux/whatsapp-marketing.git
cd whatsapp-marketing

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/waleadbot

# Auth
JWT_SECRET=your-secret-key-min-32-chars

# Manus OAuth (if using Manus platform)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Email OTP (optional — falls back to console in dev)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# WhatsApp Meta Cloud API (configured per business in UI)
# No global env needed — stored per business in DB
```

### Database Setup

```bash
# Generate migration SQL
pnpm drizzle-kit generate

# Apply migrations (review the SQL first)
pnpm drizzle-kit migrate
```

### Development

```bash
# Start dev server (frontend + backend on port 3000)
pnpm dev
```

### Testing

```bash
# Run all 24 tests
pnpm test
```

### Production Build

```bash
pnpm build
pnpm start
```

---

## WhatsApp Integration Setup

1. Go to [Meta Developer Console](https://developers.facebook.com)
2. Create a new **WhatsApp Business** app
3. Note your **Phone Number ID**, **WABA ID**, and **Access Token**
4. In WaLeadBot, go to **WhatsApp Connect** and enter these credentials
5. Set your webhook URL to: `https://yourdomain.com/api/webhook/whatsapp`
6. Set the verify token shown in the app
7. Subscribe to `messages` webhook field

---

## Pricing Tiers

| Plan | Price | Features |
|---|---|---|
| **Starter** | ₹299/month | 500 contacts, 1,000 messages/month, basic auto-replies |
| **Growth** | ₹599/month | 2,000 contacts, 5,000 messages/month, FAQ bot, broadcasts |
| **Pro** | ₹999/month | Unlimited contacts, unlimited messages, all features |

---

## Target Industries

- Clinics & Hospitals
- Real Estate Brokers
- Tuition & Education Centers
- Salons & Spas
- Restaurants & Food Delivery
- Retail Shops
- Gyms & Fitness Centers
- Travel Agencies

---

## License

MIT © 2026 WaLeadBot
