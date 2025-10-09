import { dashboardService } from "../../services/dashboard.service";

export const handleOrderEvent = async (event: any) => {
    const { status, reason, createdAt } = event.payload;

    if (status === "SUCCESS") {
        await dashboardService.updateDashboardStat("orders", new Date(createdAt), 1);
    } else {
        await dashboardService.updateDashboardStat("failed_orders", new Date(createdAt), 1);
        if (reason) {
            await dashboardService.updateFailedOrderReason(reason, new Date(createdAt), 1);
        }
    }
};
