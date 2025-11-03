import { ExternalOrder } from "../schemas/order.schema";
import { ExternalApiClient } from "../utils/external-api-client";

// External API Configuration
const ORDER_API_BASE_URL = process.env.ORDERS_API_BASE_URL || 'http://localhost:3003';
const ORDER_API_KEY = process.env.ORDER_API_KEY;



interface OrderStats {
  totalOrders: number;
  successfulOrders: number; // completed orders
  failedOrders: number; // failed + cancelled orders
}

interface OrderFilters {
  status?: 'completed' | 'pending' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  storeName?: string;
  storeEmail?: string;
  merchantId?: string;
  limit?: number;
  offset?: number;
}

class OrderManagementService {
  private apiClient: ExternalApiClient;

  constructor() {
    this.apiClient = new ExternalApiClient({
      baseURL: ORDER_API_BASE_URL,
      apiKey: ORDER_API_KEY || '',
      timeout: 10000
    });
  }

  /**
   * GET - Fetch all orders with optional filtering
   */
  async getAllOrders(filters?: OrderFilters): Promise<{
    orders: any[];
    total: number;
    stats: OrderStats;
  }> {
    try {
      // Build query parameters
      const queryParams: any = {};
      
      if (filters?.status) queryParams.status = filters.status;
      if (filters?.startDate) queryParams.startDate = filters.startDate;
      if (filters?.endDate) queryParams.endDate = filters.endDate;
      if (filters?.merchantId) queryParams.merchantId = filters.merchantId;
      if (filters?.limit) queryParams.limit = filters.limit;
      if (filters?.offset) queryParams.offset = filters.offset;

      // Call external API
      const response = await this.apiClient.get<
         ExternalOrder[]>('/all-orders', queryParams);

      // Transform orders
      let transformedOrders = response.map(order => ({
        id: order.id,
        merchantId: order.storeId,
        customerEmail: order.customerEmail,
        amount: order.grandTotal,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        products: order.items,
        isSuccessful: order.status === 'PENDING' || order.status === 'DELIVERED' || order.status === 'SHIPPED' || order.status === 'PROCESSING'
      }));

     

      // Calculate stats
      const stats = this.calculateOrderStats(transformedOrders);

      return {
        orders: transformedOrders,
        total: transformedOrders.length,
        stats
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * GET - Fetch order statistics
   */
  async getOrderStats(): Promise<OrderStats> {
    try {
      const response = await this.apiClient.get<ExternalOrder[]>('/orders');
      
      const orders = response.map(order => ({
        ...order,
        isSuccessful: order.status === 'DELIVERED' || order.status === 'SHIPPED'
      }));

      return this.calculateOrderStats(orders);
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw new Error('Failed to fetch order statistics');
    }
  }

  /**
   * GET - Fetch single order by ID
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const response = await this.apiClient.get<ExternalOrder>(`/orders/${orderId}`);
      
      return {
        id: response.id,
        merchantId: response.storeId,
        customerEmail: response.customerEmail,
        amount: response.grandTotal,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        products: response.items,
        isSuccessful: response.status === 'SHIPPED' || response.status === 'DELIVERED'
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }
  }

  /**
   * GET - Fetch orders by merchant ID
   */
  async getOrdersByMerchant(merchantId: string, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any> {
    try {
      const queryParams: any = { merchantId };
      
      if (filters?.status) queryParams.status = filters.status;
      if (filters?.startDate) queryParams.startDate = filters.startDate;
      if (filters?.endDate) queryParams.endDate = filters.endDate;
      if (filters?.limit) queryParams.limit = filters.limit;

      const response = await this.apiClient.get<ExternalOrder[]>(`/merchants/${merchantId}/orders`, queryParams);
      
      const orders = response.map(order => ({
        id: order.id,
        merchantId: order.storeId,
        customerEmail: order.customerEmail,
        amount: order.grandTotal,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        products: order.items,
        isSuccessful: order.status === 'DELIVERED' || order.status === 'SHIPPED'
      }));

      const stats = this.calculateOrderStats(orders);

      return {
        orders,
        total: orders.length,
        stats
      };
    } catch (error) {
      console.error('Error fetching merchant orders:', error);
      throw new Error('Failed to fetch merchant orders');
    }
  }

  /**
   * POST - Create new order
   */
  async createOrder(orderData: {
    merchantId: string;
    customerEmail: string;
    amount: number;
    products: Array<{
      productId: string;
      quantity: number;
    }>;
  }): Promise<any> {
    try {
      const response = await this.apiClient.post<ExternalOrder>('/orders', orderData);
      
      return {
    
        id: response.id,
        merchantId: response.storeId,
        customerEmail: response.customerEmail,
        amount: response.grandTotal,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        products: response.items,
        isSuccessful: response.status === 'DELIVERED' || response.status === 'SHIPPED'
      
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * PUT - Update order status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const response = await this.apiClient.put<ExternalOrder>(`/orders/${orderId}`, { status });
      
      return {
          id: response.id,
        merchantId: response.storeId,
        customerEmail: response.customerEmail,
        amount: response.grandTotal,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        products: response.items,
        isSuccessful: response.status === 'DELIVERED' || response.status === 'SHIPPED'
      
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * DELETE - Cancel order
   */
  async cancelOrder(orderId: string): Promise<any> {
    try {
      await this.apiClient.delete(`/orders/${orderId}`);
      return { success: true, message: 'Order cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Helper method to calculate order statistics
   */
  private calculateOrderStats(orders: any[]): OrderStats {
    const totalOrders = orders.length;
    const successfulOrders = orders.filter(order => order.isSuccessful).length;
    const failedOrders = totalOrders - successfulOrders;

    return {
      totalOrders,
      successfulOrders,
      failedOrders
    };
  }
}

export const orderManagementService = new OrderManagementService();
