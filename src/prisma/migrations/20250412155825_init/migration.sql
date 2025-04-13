-- CreateTable
CREATE TABLE `sub_card` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price_per_month` DOUBLE NOT NULL,
    `description` TEXT NOT NULL,
    `last_updated` DATETIME(3) NOT NULL,
    `currency` VARCHAR(8) NOT NULL,
    `img` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_card_category_pivot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sub_card_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sub_card_category_pivot_sub_card_id_category_id_key`(`sub_card_id`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(30) NULL,
    `last_name` VARCHAR(30) NULL,
    `username` VARCHAR(30) NULL,
    `photo_url` VARCHAR(255) NULL,
    `create_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `telegram_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `user_telegram_id_key`(`telegram_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sub_cards_pivot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sub_card_id` INTEGER NOT NULL,
    `date_start` VARCHAR(191) NOT NULL,
    `date_end` VARCHAR(191) NOT NULL,
    `period` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_sub_cards_pivot_user_id_sub_card_id_key`(`user_id`, `sub_card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sub_card_category_pivot` ADD CONSTRAINT `sub_card_category_pivot_sub_card_id_fkey` FOREIGN KEY (`sub_card_id`) REFERENCES `sub_card`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_card_category_pivot` ADD CONSTRAINT `sub_card_category_pivot_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sub_cards_pivot` ADD CONSTRAINT `user_sub_cards_pivot_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sub_cards_pivot` ADD CONSTRAINT `user_sub_cards_pivot_sub_card_id_fkey` FOREIGN KEY (`sub_card_id`) REFERENCES `sub_card`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
