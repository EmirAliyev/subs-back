-- CreateTable
CREATE TABLE `currency_rate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from` VARCHAR(8) NOT NULL,
    `to` VARCHAR(8) NOT NULL,
    `rate` DOUBLE NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `currency_rate_from_to_key`(`from`, `to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
