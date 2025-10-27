import { Request, Response } from "express";
import { orderManagementService } from "../services/order-management.service";

class OrderManagementController {
  /**
   * GET /orders
   * Fetch all orders with optional filtering
   */
  getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        status, 
        startDate, 
        endDate, 
        storeName, 
        storeEmail, 
        merchantId, 
        limit, 
        offset 
      } = req.query;

      const filters = {
        status: status as 'completed' | 'pending' | 'failed' | 'cancelled',
        startDate: startDate as string,
        endDate: endDate as string,
        storeName: storeName as string,
        storeEmail: storeEmail as string,
        merchantId: merchantId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const result = await orderManagementService.getAllOrders(filters);
      
      res.status(200).json({
        success: true,
        data: result.orders,
        total: result.total,
        stats: result.stats,
        message: "Orders retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getAllOrders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve orders",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /orders/stats
   * Fetch order statistics
   */
  getOrderStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await orderManagementService.getOrderStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: "Order statistics retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getOrderStats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve order statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /orders/:orderId
   * Fetch single order by ID
   */
  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          message: "Order ID is required" 
        });
        return;
      }

      const order = await orderManagementService.getOrderById(orderId);
      
      res.status(200).json({
        success: true,
        data: order,
        message: "Order retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getOrderById:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /orders/merchant/:merchantId
   * Fetch orders by merchant ID
   */
  getOrdersByMerchant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      const { status, startDate, endDate, limit } = req.query;
      
      if (!merchantId) {
        res.status(400).json({ 
          success: false, 
          message: "Merchant ID is required" 
        });
        return;
      }

      const filters = {
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await orderManagementService.getOrdersByMerchant(merchantId, filters);
      
      res.status(200).json({
        success: true,
        data: result.orders,
        total: result.total,
        stats: result.stats,
        message: "Merchant orders retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getOrdersByMerchant:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve merchant orders",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * POST /orders
   * Create new order
   */
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId, customerEmail, amount, products } = req.body;

      if (!merchantId || !customerEmail || !amount || !products) {
        res.status(400).json({ 
          success: false, 
          message: "merchantId, customerEmail, amount, and products are required" 
        });
        return;
      }

      const order = await orderManagementService.createOrder({
        merchantId,
        customerEmail,
        amount,
        products
      });
      
      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully"
      });
    } catch (error) {
      console.error("Error in createOrder:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * PUT /orders/:orderId
   * Update order status
   */
  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          message: "Order ID is required" 
        });
        return;
      }

      if (!status) {
        res.status(400).json({ 
          success: false, 
          message: "Status is required" 
        });
        return;
      }

      const order = await orderManagementService.updateOrderStatus(orderId, status);
      
      res.status(200).json({
        success: true,
        data: order,
        message: "Order status updated successfully"
      });
    } catch (error) {
      console.error("Error in updateOrderStatus:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update order status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * DELETE /orders/:orderId
   * Cancel order
   */
  cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          message: "Order ID is required" 
        });
        return;
      }

      const result = await orderManagementService.cancelOrder(orderId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: "Order cancelled successfully"
      });
    } catch (error) {
      console.error("Error in cancelOrder:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}

export const orderManagementController = new OrderManagementController();
