CREATE TABLE `user_google_login_master` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`google_id` text NOT NULL,
	`delete_flg` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_master`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_google_login_master_google_id_unique` ON `user_google_login_master` (`google_id`) WHERE delete_flg = 0;--> statement-breakpoint
CREATE UNIQUE INDEX `user_google_login_master_user_id_unique` ON `user_google_login_master` (`user_id`) WHERE delete_flg = 0;--> statement-breakpoint
DROP INDEX `user_login_master_login_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_login_master_user_id_unique` ON `user_login_master` (`user_id`) WHERE delete_flg = 0;--> statement-breakpoint
CREATE UNIQUE INDEX `user_login_master_login_id_unique` ON `user_login_master` (`login_id`) WHERE delete_flg = 0;--> statement-breakpoint
ALTER TABLE `user_login_master` DROP COLUMN `auth_provider`;--> statement-breakpoint
ALTER TABLE `user_login_master` DROP COLUMN `google_id`;--> statement-breakpoint
DROP INDEX `user_master_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_master_name_unique` ON `user_master` (`name`) WHERE delete_flg = 0;