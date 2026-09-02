CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`currency_code` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
