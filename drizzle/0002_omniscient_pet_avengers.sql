CREATE TABLE `business_members` (
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
ALTER TABLE `broadcast_campaigns` DROP COLUMN `totalRecipients`;