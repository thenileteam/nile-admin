import { Request, Response } from "express";
import { merchantManagementService } from "../services/merchant-management.service";

class MerchantManagementController {
  /**
   * GET /stores
   * Fetch all stores with optional filtering
   */
  getAllStores = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, isOld, isActive, limit, offset,page } = req.query;

      const filters = {
        name: name as string,
        email: email as string,
        isOld: isOld ? isOld === 'true' : undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        page: page ? parseInt(page as string) : undefined
      };

      const result = await merchantManagementService.getAllStores(filters);
    
      res.status(200).json({
        success: true,
        data: result.stores,
        total: result.total,
        stats: result.stats,
        message: "Stores retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getAllStores:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve stores",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /stores/stats
   * Fetch store statistics
   */
  getStoreStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await merchantManagementService.getStoreStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: "Store statistics retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getStoreStats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve store statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /stores/:storeId
   * Fetch single merchant by ID
   */
  getStoreById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storeId } = req.params;
      
      if (!storeId) {
        res.status(400).json({ 
          success: false, 
          message: "Store ID is required" 
        });
        return;
      }

      const store = await merchantManagementService.getStoreById(storeId);
      
      res.status(200).json({
        success: true,
        data: store,
        message: "Store retrieved successfully"
      });
    } catch (error) {
      console.error("Error in getStoreById:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve store",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

 

 

  /**
   * DELETE /merchants/:merchantId
   * Deactivate merchant
   */
  deleteStore = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storeId } = req.params;

      if (!storeId) {
        res.status(400).json({ 
          success: false, 
          message: "Store ID is required" 
        });
        return;
      }

      const result = await merchantManagementService.deleteStore(storeId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: "Store deleted successfully"
      });
    } catch (error) {
      console.error("Error in deleteStore:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete store",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}

export const merchantManagementController = new MerchantManagementController();
