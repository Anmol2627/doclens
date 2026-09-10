ALTER TABLE `operations` ADD `operationFinished` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `operations` ADD `operationErrored` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `operations` ADD `operationErrorMessage` text;