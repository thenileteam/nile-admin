import { ExternalApiClient } from "../utils/external-api-client";

// External API Configuration
const ORDER_API_BASE_URL = process.env.ORDER_API_BASE_URL || 'https://api.order-service.com';
const ORDER_API_KEY = process.env.ORDER_API_KEY;

// Types for external API responses
interface ExternalOrder {
  orderId: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  customerEmail: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

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
      const response = await this.apiClient.get<{
        orders: ExternalOrder[];
        total: number;
      }>('/orders', queryParams);

      // Transform orders
      let transformedOrders = response.orders.map(order => ({
        id: order.orderId,
        merchantId: order.merchantId,
        merchantName: order.merchantName,
        merchantEmail: order.merchantEmail,
        customerEmail: order.customerEmail,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        products: order.products,
        isSuccessful: order.status === 'completed'
      }));

      // Apply store name/email filtering if specified
      if (filters?.storeName) {
        transformedOrders = transformedOrders.filter(order => 
          order.merchantName.toLowerCase().includes(filters.storeName!.toLowerCase())
        );
      }

      if (filters?.storeEmail) {
        transformedOrders = transformedOrders.filter(order => 
          order.merchantEmail.toLowerCase().includes(filters.storeEmail!.toLowerCase())
        );
      }

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
        isSuccessful: order.status === 'completed'
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
        id: response.orderId,
        merchantId: response.merchantId,
        merchantName: response.merchantName,
        merchantEmail: response.merchantEmail,
        customerEmail: response.customerEmail,
        amount: response.amount,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        products: response.products,
        isSuccessful: response.status === 'completed'
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
        id: order.orderId,
        merchantId: order.merchantId,
        merchantName: order.merchantName,
        merchantEmail: order.merchantEmail,
        customerEmail: order.customerEmail,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        products: order.products,
        isSuccessful: order.status === 'completed'
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
        id: response.orderId,
        merchantId: response.merchantId,
        merchantName: response.merchantName,
        merchantEmail: response.merchantEmail,
        customerEmail: response.customerEmail,
        amount: response.amount,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        products: response.products,
        isSuccessful: response.status === 'completed'
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
        id: response.orderId,
        merchantId: response.merchantId,
        merchantName: response.merchantName,
        merchantEmail: response.merchantEmail,
        customerEmail: response.customerEmail,
        amount: response.amount,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        products: response.products,
        isSuccessful: response.status === 'completed'
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
