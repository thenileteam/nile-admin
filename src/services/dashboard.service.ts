import database from "../utils/database";
import getTimeBuckets from "../utils/get-time-buckets";
import { merchantManagementService } from "./merchant-management.service";

const merchantService = merchantManagementService;
class DashboardService {
 getThisWeekOrdersStats = async (): Promise<any> => {
  // 🧠 Helper gives you { year, month, week } for a given date
  const now = new Date();
  const thisWeek = getTimeBuckets(now);

  // Subtract 7 days to get last week’s range
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(now.getDate() - 7);
  const lastWeek = getTimeBuckets(lastWeekDate);

  // ✅ This week's orders
  const thisWeekOrders = await database.dashboardStat.findMany({
    where: {
      year: thisWeek.year,
      month: thisWeek.month,
      week: thisWeek.week,
      metricType: "orders",
    },
  });

  // ❌ This week's failed orders
  const thisWeekFailedOrders = await database.failedOrderReason.findMany({
    where: {
      year: thisWeek.year,
      month: thisWeek.month,
      week: thisWeek.week,
    },
  });

  // ✅ Last week's orders
  const lastWeekOrders = await database.dashboardStat.findMany({
    where: {
      year: lastWeek.year,
      month: lastWeek.month,
      week: lastWeek.week,
      metricType: "orders",
    },
  });

  // ❌ Last week's failed orders
  const lastWeekFailedOrders = await database.failedOrderReason.findMany({
    where: {
      year: lastWeek.year,
      month: lastWeek.month,
      week: lastWeek.week,
    },
  });

  // 🏪 Active merchants
  const stores = await merchantService.getAllStores({});
  const activeMerchants = stores.stores.filter((store: any) => store.isActive).length;

  // 📊 Return summarized stats
  return {
    orders: {
      thisWeek: thisWeekOrders.length,
      lastWeek: lastWeekOrders.length,
    },
    failedOrders: {
      thisWeek: thisWeekFailedOrders.length,
      lastWeek: lastWeekFailedOrders.length,
    },
    activeMerchants,
  };
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

    const topSum = topStats.reduce(
      (acc: number, s: { _sum: { value: number | null } }) =>
        acc + (s._sum.value || 0),
      0
    );
    const totalSum: number = total._sum.value || 0;
    const others: number = totalSum - topSum;

    // Format response
    const result = topStats.map(
      (s: { reason: string; _sum: { value: number | null } }) => ({
        reason: s.reason,
        value: s._sum.value || 0,
      })
    );

    if (others > 0) {
      result.push({ reason: "Others", value: others });
    }

    return result;
  };

  updateDashboardStat = async (
    metricType: "orders" | "settlements" | "failed_orders",
    createdAt: Date,
    value: number
  ): Promise<void> => {
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
        data: {
          metricType: metricType,
          year: year,
          month: month,
          week: week,
          value: value,
        },
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
        week: week,
      },
    });

    return failedOrderReasons;
  };

  updateFailedOrderReason = async (
    reason: string,
    createdAt: Date,
    value: number
  ): Promise<void> => {
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
