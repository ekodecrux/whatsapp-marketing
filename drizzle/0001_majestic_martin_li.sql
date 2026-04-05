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
ALTER TABLE `users` ADD `businessId` int;