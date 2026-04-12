export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Email OTP
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "noreply@waleadbot.com",
  // SMS/WhatsApp OTP via MSG91
  msg91AuthKey: process.env.MSG91_AUTH_KEY ?? "",
  msg91SenderId: process.env.MSG91_SENDER_ID ?? "WALEDB",
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID ?? "",
  msg91WhatsappTemplateId: process.env.MSG91_WHATSAPP_TEMPLATE_ID ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeStarterPriceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
  stripeGrowthPriceId: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  // App
  appUrl: process.env.APP_URL ?? "https://whatsappbot-ilpmcrnf.manus.space",
};
