CREATE TABLE `anomaly_events` (
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
