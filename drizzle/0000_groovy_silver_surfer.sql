CREATE TABLE `workspace_entries` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`entry_key` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `entry_key`)
);
