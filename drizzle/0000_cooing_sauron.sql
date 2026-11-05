CREATE TABLE `ai_budget` (
	`day` text PRIMARY KEY NOT NULL,
	`reserved_micros` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL
);
