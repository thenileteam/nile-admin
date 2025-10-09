/*
  Warnings:

  - You are about to drop the column `day` on the `dashboard_stats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[metricType,year,month,week]` on the table `dashboard_stats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `week` to the `dashboard_stats` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `dashboard_stats_metricType_year_month_day_key` ON `dashboard_stats`;

-- AlterTable
ALTER TABLE `dashboard_stats` DROP COLUMN `day`,
    ADD COLUMN `week` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `dashboard_stats_metricType_year_month_week_key` ON `dashboard_stats`(`metricType`, `year`, `month`, `week`);
