-- CreateTable
CREATE TABLE `dashboard_stats` (
    `id` VARCHAR(191) NOT NULL,
    `metricType` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `day` INTEGER NOT NULL,
    `value` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dashboard_stats_metricType_year_month_day_key`(`metricType`, `year`, `month`, `day`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FailedOrderReason` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reason` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `week` INTEGER NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FailedOrderReason_reason_year_month_week_key`(`reason`, `year`, `month`, `week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
