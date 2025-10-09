
import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";

  const router = Router();

  router.get("/stats", dashboardController.getThisWeekOrdersStats);
  router.put("/stats", dashboardController.updateDashboardStat);
  router.get("/month-orders-trends", dashboardController.getMonthOrdersTrends);
  router.get("/failed-order-reasons", dashboardController.getThisWeekFailedOrdersReasons);
  router.put("/failed-order-reasons", dashboardController.updateFailedOrderReason);

  export { router as DashboardRouter };