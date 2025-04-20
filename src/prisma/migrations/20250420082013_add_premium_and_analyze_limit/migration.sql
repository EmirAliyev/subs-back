-- AlterTable
ALTER TABLE `user` ADD COLUMN `is_premium` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `premium_expiry_date` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `user_analysis_counter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `limit` INTEGER NOT NULL DEFAULT 1,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sub_card_id` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_analysis_counter_user_id_date_key`(`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_analysis_counter` ADD CONSTRAINT `user_analysis_counter_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_analysis_counter` ADD CONSTRAINT `user_analysis_counter_sub_card_id_fkey` FOREIGN KEY (`sub_card_id`) REFERENCES `sub_card`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
