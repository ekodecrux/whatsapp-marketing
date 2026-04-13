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
