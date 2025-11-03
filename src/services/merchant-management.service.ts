import { ExternalApiClient } from "../utils/external-api-client";

// External API Configuration
const MERCHANT_API_BASE_URL =
  process.env.MERCHANT_API_BASE_URL || "http://localhost:3004";
const ORDERS_API_BASE_URL =
  process.env.ORDERS_API_BASE_URL || "http://localhost:3003";
const MERCHANT_API_KEY = process.env.MERCHANT_API_KEY;

// Types for external API responses
interface StoreResponse {
  id: string;
  name: string;
  email: string;
  logo: string | null;
  storeBaseCurrency: string;
  banner: string | null;
  address: string;
  phone: string;
  category: string;
  website: string | null;
  about: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  whitelabel: boolean;
  facebook: string | null;
  whatsappLink: string | null;
  whatsappPhone: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  ownerId: string;
  storeUrl: string;
  createdAt: string;
  totalSales?: string;
  totalOrders?: string;
}

interface StoreStats {
  totalStores: number;
  oldStores: number; // stores older than 1 year
  newStores: number; // stores newer than 1 year
}

interface StoreFilters {
  name?: string;
  email?: string;
  isOld?: boolean; // true for stores > 1 year, false for stores < 1 year
  isActive?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
}

class MerchantManagementService {
  private apiClient: ExternalApiClient;
  private orderApiClient: ExternalApiClient;

  constructor() {
    this.apiClient = new ExternalApiClient({
      baseURL: MERCHANT_API_BASE_URL,
      apiKey: MERCHANT_API_KEY || "",
      timeout: 10000,
    });
    this.orderApiClient = new ExternalApiClient({
      baseURL: ORDERS_API_BASE_URL,
      apiKey: MERCHANT_API_KEY || "",
      timeout: 10000,
    });
  }

  /**
   * GET - Fetch all stores with optional filtering
   */
  async getAllStores(filters?: StoreFilters): Promise<{
    stores: StoreResponse[];
    total: number;
    stats: StoreStats;
  }> {
    try {
      // Build query parameters
      const queryParams: any = {};

      if (filters?.name) queryParams.name = filters.name;
      if (filters?.email) queryParams.email = filters.email;
      if (filters?.isActive !== undefined)
        queryParams.isActive = filters.isActive;
      if (filters?.limit) queryParams.limit = filters.limit;
      if (filters?.offset) queryParams.offset = filters.offset;
      if (filters?.page) queryParams.page = filters.page;

      // Call external API
      const response = await this.apiClient.get<StoreResponse[]>(
        "/all-stores",
        queryParams
      );
      const orders = await this.getAllOrders();

      const getStoreSales = (storeId: string): string => {
        console.log("storeId", storeId);
        const storeOrders = orders.filter(
          (order: any) =>
            order.storeId === storeId &&
            order.paymentStatus === "PAID" 
        );

        const totalSales = storeOrders.reduce(
          (sum: number, order: any) => sum + parseFloat(order.grandTotal),
          0
        );
        return totalSales.toFixed(2);
      };
      const getStoreOrders = (storeId: string): string => {
        
        const storeOrders = orders.filter(
          (order: any) => order.storeId === storeId
        );
        return storeOrders.length.toString();
      }
      // console.log("response", response);
      // Transform merchants and apply old/new filtering
      let transformedStores = response.map((store: StoreResponse) => ({
        id: store.id,
        name: store.name,
        email: store.email,
        logo: store.logo,
        storeBaseCurrency: store.storeBaseCurrency,
        banner: store.banner,
        address: store.address,
        phone: store.phone,
        category: store.category,
        website: store.website,
        about: store.about,
        country: store.country,
        state: store.state,
        city: store.city,
        status: store.status,
        whitelabel: store.whitelabel,
        facebook: store.facebook,
        whatsappLink: store.whatsappLink,
        whatsappPhone: store.whatsappPhone,
        instagram: store.instagram,
        twitter: store.twitter,
        linkedin: store.linkedin,
        ownerId: store.ownerId,
        storeUrl: store.storeUrl,
        createdAt: new Date(store.createdAt).toISOString(),
        totalSales: getStoreSales(store.id),
        totalOrders: getStoreOrders(store.id),
      }));

      // Apply old/new filter if specified
      if (filters?.isOld !== undefined) {
        transformedStores = transformedStores.filter(
          (store) =>
            store.createdAt >
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        );
      }

      // Calculate stats
      const stats = this.calculateStoreStats(transformedStores);

      return {
        stores: transformedStores,
        total: response.length,
        stats,
      };
    } catch (error) {
      console.error("Error fetching stores:", error);
      throw new Error("Failed to fetch stores");
    }
  }
  /**
   * GET - Fetch all orders with optional filtering
   */
  async getAllOrders(): Promise<any> {
    try {
      // Build query parameters

      // Call external API
      const response = await this.orderApiClient.get<any[]>("/all-orders");
      // console.log("response", response);

      return response;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }
  }

  /**
   * GET - Fetch store statistics
   */
  async getStoreStats(): Promise<StoreStats> {
    try {
      const response = await this.apiClient.get<StoreStats>("/stores/stats");

      return response;
    } catch (error) {
      console.error("Error fetching store stats:", error);
      throw new Error("Failed to fetch store stats");
    }
  }

  /**
   * GET - Fetch single store by ID
   */
  async getStoreById(storeId: string): Promise<any> {
    try {
      const response = await this.apiClient.get<StoreResponse>(
        `/stores/${storeId}`
      );

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        logo: response.logo,
        storeBaseCurrency: response.storeBaseCurrency,
        banner: response.banner,
        address: response.address,
        phone: response.phone,
        category: response.category,
        website: response.website,
        about: response.about,
        country: response.country,
        state: response.state,
        city: response.city,
        status: response.status,
        whitelabel: response.whitelabel,
        facebook: response.facebook,
        whatsappLink: response.whatsappLink,
        whatsappPhone: response.whatsappPhone,
        instagram: response.instagram,
        twitter: response.twitter,
        linkedin: response.linkedin,
        ownerId: response.ownerId,
        storeUrl: response.storeUrl,
        createdAt: new Date(response.createdAt).toISOString(),
      };
    } catch (error) {
      console.error("Error fetching store:", error);
      throw new Error("Failed to fetch store");
    }
  }

  /**
   * DELETE - Delete store
   */
  async deleteStore(storeId: string): Promise<any> {
    try {
      await this.apiClient.delete(`/stores/${storeId}`);
      return { success: true, message: "Store deleted successfully" };
    } catch (error) {
      console.error("Error deleting store:", error);
      throw new Error("Failed to delete store");
    }
  }

  /**
   * Helper method to determine if store is old (> 1 year)
   */
  private isStoreOld(createdAt: string): boolean {
    const storeDate = new Date(createdAt);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return storeDate < oneYearAgo;
  }

  /**
   * Helper method to calculate store statistics
   */
  private calculateStoreStats(stores: any[]): StoreStats {
    const totalStores = stores.length;
    const oldStores = stores.filter((store) => store.isOld).length;
    const newStores = totalStores - oldStores;

    return {
      totalStores: totalStores,
      oldStores: oldStores,
      newStores: newStores,
    };
  }
}

export const merchantManagementService = new MerchantManagementService();
