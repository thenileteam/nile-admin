import database from "../utils/database";
import getTimeBuckets from "../utils/get-time-buckets";

class DashboardService {
    getThisWeekOrdersStats = async (): Promise<any> => {
        const { year, month, week } = getTimeBuckets(new Date());

        const stats = await database.dashboardStat.findMany({
            where: {
                // This structure is correct for filtering by individual fields
                year: year,
                month: month,
                week: week,
                metricType: "orders"
            },
        });

        return stats;
    };
    getMonthOrdersTrends = async (): Promise<any> => {
        const { year } = getTimeBuckets(new Date());
        const stats = await database.dashboardStat.groupBy({
            by: ["month"],
            where: { year: year, metricType: "orders" },
            _sum: { value: true },
        });
        return stats;
    };

    getFailedOrdersPieChartByReason = async (): Promise<any> => {
        const { year } = getTimeBuckets(new Date());

        // Get top 5 reasons
        const topStats = await database.failedOrderReason.groupBy({
            by: ["reason"],
            where: { year },
            _sum: { value: true },
            orderBy: { _sum: { value: "desc" } },
            take: 5,
        });

        // Get total across all reasons
        const total = await database.failedOrderReason.aggregate({
            where: { year },
            _sum: { value: true },
        });

        const topSum = topStats.reduce((acc: number, s: { _sum: { value: number | null } }) => acc + (s._sum.value || 0), 0);
        const totalSum: number = total._sum.value || 0;
        const others: number = totalSum - topSum;

        // Format response
        const result = topStats.map((s: { reason: string; _sum: { value: number | null } }) => ({
            reason: s.reason,
            value: s._sum.value || 0,
        }));

        if (others > 0) {
            result.push({ reason: "Others", value: others });
        }

        return result;
    };


    updateDashboardStat = async (metricType: "orders" | "settlements" | "failed_orders", createdAt: Date, value: number): Promise<void> => {
        const { year, month, week } = getTimeBuckets(createdAt);
        const confirmWeHaveThisStat = await database.dashboardStat.findFirst({
            where: {

                metricType: metricType,
                year: year,
                month: month,
                week: week,

            },
        });
        if (confirmWeHaveThisStat) {
            console.log("we have this dashboard stat", confirmWeHaveThisStat);
            await database.dashboardStat.update({
                where: {

                    metricType_year_month_week: {
                        metricType: metricType,
                        year: year,
                        month: month,
                        week: week,
                    },
                },
                data: { value: confirmWeHaveThisStat.value + value },
            });
        } else {
            console.log("we do not have this dashboard stat", confirmWeHaveThisStat);
            await database.dashboardStat.create({
                data: { metricType: metricType, year: year, month: month, week: week, value: value },
            });
        }
    };

    getThisWeekFailedOrdersReasons = async (): Promise<any> => {
        // This function is assumed to correctly calculate the current year, month, and week
        const { year, month, week } = getTimeBuckets(new Date());

        const failedOrderReasons = await database.failedOrderReason.findMany({
            where: {
                // Corrected filtering: use the individual field names
                reason: "failed_orders",
                year: year,
                month: month,
                week: week
            },
        });

        return failedOrderReasons;
    };

    updateFailedOrderReason = async (reason: string, createdAt: Date, value: number): Promise<void> => {
        const { year, month, week } = getTimeBuckets(createdAt);

        const confirmWeHaveThisStat = await database.failedOrderReason.findFirst({
            where: {
                reason: reason,
                year: year,
                month: month,
                week: week,
            },

        });
        if (confirmWeHaveThisStat) {
            await database.failedOrderReason.update({
                where: {
                    reason_year_month_week: {
                        reason,
                        year,
                        month,
                        week,
                    },
                },
                data: { value: confirmWeHaveThisStat.value + value },
            });
        } else {
            await database.failedOrderReason.create({
                data: { reason, year, month, week, value: value },
            });
        }
    };
}

export const dashboardService = new DashboardService();