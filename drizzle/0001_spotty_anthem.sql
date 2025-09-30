CREATE TABLE `cash_boxes` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`opened_by` text NOT NULL,
	`closed_by` text,
	`initial_amount` integer DEFAULT 0 NOT NULL,
	`final_amount` integer,
	`opening_notes` text,
	`closing_notes` text,
	`opened_at` integer NOT NULL,
	`closed_at` integer,
	`edited_flag` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`opened_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ruc` text,
	`address` text,
	`phone` text,
	`email` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operation_details` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`cash_box_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'PEN' NOT NULL,
	`operation_detail_id` text NOT NULL,
	`responsible_id` text NOT NULL,
	`stand_id` text NOT NULL,
	`company_id` text,
	`description` text,
	`voucher_number` text,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`operation_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`cash_box_id`) REFERENCES `cash_boxes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`operation_detail_id`) REFERENCES `operation_details`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsible_id`) REFERENCES `responsible_persons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stand_id`) REFERENCES `stands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `responsible_persons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`location` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
