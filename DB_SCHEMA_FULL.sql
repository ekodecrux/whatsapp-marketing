CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int,
	`entityType` varchar(50),
	`entityId` int,
	`action` varchar(100) NOT NULL,
	`description` text,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auto_reply_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`triggerType` enum('keyword','first_message','outside_hours','any_message','contains') NOT NULL,
	`triggerValue` text,
	`matchType` enum('exact','contains','starts_with','regex') DEFAULT 'contains',
	`responseType` enum('text','template','flow') NOT NULL DEFAULT 'text',
	`responseText` text,
	`responseTemplate` varchar(255),
	`flowId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`triggerCount` int NOT NULL DEFAULT 0,
	`businessHoursStart` varchar(5),
	`businessHoursEnd` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_reply_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`mediaUrl` varchar(1000),
	`status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`targetType` enum('all','tag','custom') NOT NULL DEFAULT 'all',
	`targetTags` json DEFAULT ('[]'),
	`targetContactIds` json DEFAULT ('[]'),
	`totalRecipients` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`deliveredCount` int NOT NULL DEFAULT 0,
	`readCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcast_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`website` varchar(500),
	`address` text,
	`logoUrl` varchar(1000),
	`plan` enum('free','starter','pro','enterprise') NOT NULL DEFAULT 'free',
	`planExpiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`waId` varchar(50) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`profilePicUrl` varchar(1000),
	`tags` json DEFAULT ('[]'),
	`customFields` json DEFAULT ('{}'),
	`isBlocked` boolean NOT NULL DEFAULT false,
	`optedOut` boolean NOT NULL DEFAULT false,
	`source` varchar(100) DEFAULT 'whatsapp',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_flows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerKeyword` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`steps` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_flows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`contactId` int NOT NULL,
	`waId` varchar(50) NOT NULL,
	`status` enum('open','resolved','pending','bot') NOT NULL DEFAULT 'open',
	`assignedTo` int,
	`lastMessageAt` timestamp DEFAULT (now()),
	`lastMessageText` text,
	`unreadCount` int NOT NULL DEFAULT 0,
	`isArchived` boolean NOT NULL DEFAULT false,
	`tags` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`keywords` json DEFAULT ('[]'),
	`category` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`matchCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fields` json DEFAULT ('[]'),
	`triggerKeyword` varchar(255),
	`thankYouMessage` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`submissionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`contactId` int,
	`conversationId` int,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(20) NOT NULL,
	`source` varchar(100) DEFAULT 'whatsapp',
	`status` enum('new','contacted','qualified','proposal','won','lost') NOT NULL DEFAULT 'new',
	`score` int DEFAULT 0,
	`assignedTo` int,
	`notes` text,
	`customFields` json DEFAULT ('{}'),
	`tags` json DEFAULT ('[]'),
	`lastContactedAt` timestamp,
	`estimatedValue` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`conversationId` int NOT NULL,
	`contactId` int NOT NULL,
	`waMessageId` varchar(255),
	`direction` enum('inbound','outbound') NOT NULL,
	`type` enum('text','image','audio','video','document','location','template','interactive','sticker') NOT NULL DEFAULT 'text',
	`content` text,
	`mediaUrl` varchar(1000),
	`mediaCaption` text,
	`status` enum('sent','delivered','read','failed','pending') NOT NULL DEFAULT 'pending',
	`isAutoReply` boolean NOT NULL DEFAULT false,
	`isBotMessage` boolean NOT NULL DEFAULT false,
	`metadata` json DEFAULT ('{}'),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`otp` varchar(8) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`phoneNumberId` varchar(100),
	`wabaId` varchar(100),
	`accessToken` text,
	`verifyToken` varchar(100),
	`phoneNumber` varchar(20),
	`displayName` varchar(255),
	`isConnected` boolean NOT NULL DEFAULT false,
	`webhookUrl` varchar(1000),
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `businessId` int;CREATE TABLE `business_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
	`invitedBy` int,
	`inviteEmail` varchar(320),
	`inviteToken` varchar(128),
	`inviteAccepted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`plan` enum('starter','growth','pro') NOT NULL,
	`status` enum('active','trialing','past_due','cancelled','expired') NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`amountPaise` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widget_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'Default Widget',
	`config` json DEFAULT ('{}'),
	`isActive` boolean NOT NULL DEFAULT true,
	`leadsGenerated` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widget_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `widget_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `otp_tokens` RENAME COLUMN `email` TO `identifier`;--> statement-breakpoint
ALTER TABLE `businesses` MODIFY COLUMN `plan` enum('free','starter','growth','pro') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `broadcast_campaigns` ADD `recipientCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `businesses` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `businesses` ADD `pincode` varchar(10);--> statement-breakpoint
ALTER TABLE `businesses` ADD `description` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `businesses` ADD `subscriptionStatus` enum('active','trialing','past_due','cancelled','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `maxContacts` int DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `maxMessagesPerMonth` int DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `messagesUsedThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `messagesResetAt` timestamp;--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboardingStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `closedAt` timestamp;--> statement-breakpoint
ALTER TABLE `otp_tokens` ADD `channel` enum('email','sms','whatsapp') DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `otp_tokens` ADD `attempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `whatsapp_configs` ADD `setupStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `broadcast_campaigns` DROP COLUMN `targetContactIds`;--> statement-breakpoint
ALTER TABLE `broadcast_campaigns` DROP COLUMN `totalRecipients`;CREATE TABLE `anomaly_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`metric` varchar(100) NOT NULL,
	`detectedValue` int NOT NULL,
	`baselineValue` int NOT NULL,
	`deviationPct` int NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`description` text,
	`isResolved` tinyint NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anomaly_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percent','fixed') NOT NULL DEFAULT 'percent',
	`discountValue` int NOT NULL,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`applicablePlans` json DEFAULT ('[]'),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `integration_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`provider` enum('jira','pagerduty','datadog','slack','zapier') NOT NULL,
	`config` json NOT NULL DEFAULT ('{}'),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`content` text NOT NULL,
	`isInternal` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`reportType` enum('analytics','leads','conversations','broadcast') NOT NULL,
	`frequency` enum('daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
	`recipientEmails` json NOT NULL DEFAULT ('[]'),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`reportType` enum('analytics','leads','conversations','broadcast') NOT NULL,
	`title` varchar(255),
	`filters` json DEFAULT ('{}'),
	`expiresAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_reports_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `slo_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`metric` varchar(100) NOT NULL,
	`operator` enum('lt','gt','lte','gte') NOT NULL DEFAULT 'lt',
	`threshold` int NOT NULL,
	`windowHours` int NOT NULL DEFAULT 24,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'warning',
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastBreachedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slo_thresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phoneNumberId` varchar(100),
	`accessToken` text,
	`region` varchar(50),
	`phonePrefixes` json DEFAULT ('[]'),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`messagesSent` int NOT NULL DEFAULT 0,
	`lastActiveAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_agents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpointId` int NOT NULL,
	`businessId` int NOT NULL,
	`event` varchar(100) NOT NULL,
	`payload` json,
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`statusCode` int,
	`responseBody` text,
	`attempts` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(2000) NOT NULL,
	`secret` varchar(64) NOT NULL,
	`events` json NOT NULL DEFAULT ('[]'),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastTriggeredAt` timestamp,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('MARKETING','UTILITY','AUTHENTICATION') NOT NULL DEFAULT 'MARKETING',
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`headerType` enum('none','text','image','video','document') DEFAULT 'none',
	`headerContent` text,
	`body` text NOT NULL,
	`footer` varchar(60),
	`buttons` json,
	`variables` json DEFAULT ('[]'),
	`status` enum('draft','pending','approved','rejected','paused') NOT NULL DEFAULT 'draft',
	`metaTemplateId` varchar(100),
	`rejectionReason` text,
	`submittedAt` timestamp,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_templates_id` PRIMARY KEY(`id`)
);
