import { Router } from "express";
import { merchantManagementController } from "../controllers/merchant-management.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Merchant Management CRUD Endpoints (acting as interfaces to external APIs)

// GET /stores - Get all stores with optional filtering
router.get("/", merchantManagementController.getAllStores);

// GET /stores/stats - Get store statistics
router.get("/stats", merchantManagementController.getStoreStats);

// GET /stores/:storeId - Get single store by ID
router.get("/:storeId", merchantManagementController.getStoreById);



// DELETE /stores/:storeId - Delete store
router.delete("/:storeId", merchantManagementController.deleteStore);

export { router as MerchantRouter };
