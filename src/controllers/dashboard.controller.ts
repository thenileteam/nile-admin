import { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
class DashboardController {
    getThisWeekOrdersStats = async (req: Request, res: Response): Promise<void> => {
    const stats = await dashboardService.getThisWeekOrdersStats();
    res.status(200).json({ stats });
  };

  updateDashboardStat = async (req: Request, res: Response): Promise<void> => {
    const { metricType, createdAt, value } = req.body;
    await dashboardService.updateDashboardStat(metricType, createdAt, value);
    res.status(200).json({ message: "Dashboard stat updated successfully" });
  };

  getMonthOrdersTrends = async (req: Request, res: Response): Promise<void> => {
    const stats = await dashboardService.getMonthOrdersTrends();
    res.status(200).json({ stats });
  };

  getThisWeekFailedOrdersReasons = async (req: Request, res: Response): Promise<void> => {
    const failedOrderReasons = await dashboardService.getThisWeekFailedOrdersReasons();
    res.status(200).json({ failedOrderReasons });
  };

  updateFailedOrderReason = async (req: Request, res: Response): Promise<void> => {
    const { reason, createdAt, value } = req.body;
    await dashboardService.updateFailedOrderReason(reason, createdAt, value);
    res.status(200).json({ message: "Failed order reason updated successfully" });
  };
}






export const dashboardController = new DashboardController();