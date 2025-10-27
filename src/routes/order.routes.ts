import { Router } from "express";
import { orderManagementController } from "../controllers/order-management.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Order Management CRUD Endpoints (acting as interfaces to external APIs)

// GET /orders - Get all orders with optional filtering
router.get("/", orderManagementController.getAllOrders);

// GET /orders/stats - Get order statistics
router.get("/stats", orderManagementController.getOrderStats);

// GET /orders/:orderId - Get single order by ID
router.get("/:orderId", orderManagementController.getOrderById);

// GET /orders/merchant/:merchantId - Get orders by merchant ID
router.get("/merchant/:merchantId", orderManagementController.getOrdersByMerchant);

// POST /orders - Create new order
router.post("/", orderManagementController.createOrder);

// PUT /orders/:orderId - Update order status
router.put("/:orderId", orderManagementController.updateOrderStatus);

// DELETE /orders/:orderId - Cancel order
router.delete("/:orderId", orderManagementController.cancelOrder);

export { router as OrderRouter };