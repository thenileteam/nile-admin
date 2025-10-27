import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Generic External API Client Utility
 * Provides reusable methods for calling external APIs with proper error handling,
 * retry logic, and response transformation
 */
export class ExternalApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: {
    baseURL: string;
    apiKey: string;
    timeout?: number;
    headers?: Record<string, string>;
  }) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Nile-Admin-Service/1.0',
        ...config.headers
      }
    });

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[External API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[External API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[External API] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[External API] Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request with retry logic
   */
  async get<T = any>(
    endpoint: string, 
    params?: Record<string, any>,
    retries: number = 3
  ): Promise<T> {
    try {
      console.log("endpoint", this.baseURL + endpoint);
      console.log("params", params);
      const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`[External API] Retrying request to ${endpoint}, ${retries} retries left`);
        await this.delay(1000); // Wait 1 second before retry
        return this.get<T>(endpoint, params, retries - 1);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Generic POST request with retry logic
   */
  async post<T = any>(
    endpoint: string, 
    data?: any,
    retries: number = 3
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`[External API] Retrying POST request to ${endpoint}, ${retries} retries left`);
        await this.delay(1000);
        return this.post<T>(endpoint, data, retries - 1);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Generic PUT request with retry logic
   */
  async put<T = any>(
    endpoint: string, 
    data?: any,
    retries: number = 3
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`[External API] Retrying PUT request to ${endpoint}, ${retries} retries left`);
        await this.delay(1000);
        return this.put<T>(endpoint, data, retries - 1);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Generic DELETE request with retry logic
   */
  async delete<T = any>(
    endpoint: string,
    retries: number = 3
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`[External API] Retrying DELETE request to ${endpoint}, ${retries} retries left`);
        await this.delay(1000);
        return this.delete<T>(endpoint, retries - 1);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Generic PATCH request with retry logic
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any,
    retries: number = 3
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`[External API] Retrying PATCH request to ${endpoint}, ${retries} retries left`);
        await this.delay(1000);
        return this.patch<T>(endpoint, data, retries - 1);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Check if error is retryable (network errors, 5xx status codes)
   */
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network error - retryable
      return true;
    }
    
    const status = error.response.status;
    // Retry on 5xx errors and specific 4xx errors
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error(`Unauthorized: ${message}`);
        case 403:
          return new Error(`Forbidden: ${message}`);
        case 404:
          return new Error(`Not Found: ${message}`);
        case 429:
          return new Error(`Rate Limited: ${message}`);
        case 500:
          return new Error(`Internal Server Error: ${message}`);
        default:
          return new Error(`API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network Error: No response from external API');
    } else {
      // Something else happened
      return new Error(`Request Error: ${error.message}`);
    }
  }

  /**
   * Utility method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * Update API key
   */
  updateApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${newApiKey}`;
  }

  /**
   * Update base URL
   */
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = newBaseURL;
  }
}

/**
 * Factory function to create API clients for different services
 */
export const createApiClient = (serviceName: string): ExternalApiClient => {
  const config = {
    baseURL: process.env[`${serviceName.toUpperCase()}_API_BASE_URL`] || '',
    apiKey: process.env[`${serviceName.toUpperCase()}_API_KEY`] || '',
    timeout: parseInt(process.env[`${serviceName.toUpperCase()}_API_TIMEOUT`] || '10000')
  };

  // if (!config.baseURL || !config.apiKey) {
  //   throw new Error(`Missing configuration for ${serviceName} API client`);
  // }

  return new ExternalApiClient(config);
};

// Pre-configured clients for common services
export const storeApiClient = createApiClient('STORE');
export const paymentApiClient = createApiClient('PAYMENT');
export const notificationApiClient = createApiClient('NOTIFICATION');
