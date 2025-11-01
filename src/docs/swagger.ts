import { extendZodWithOpenApi, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';    
import { OpenApiGeneratorV3 as OpenAPIGenerator, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { CreateOrderSchema, OrderSchema } from '../schemas/order.schema';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Order schemas
registry.register("Order", OrderSchema);
registry.register("CreateOrder", CreateOrderSchema);

// Auth schemas - Create new schemas with openapi extension
const RegisterRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const ForgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

const ResendVerificationRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

registry.register("RegisterRequest", RegisterRequestSchema);
registry.register("LoginRequest", LoginRequestSchema);
registry.register("ChangePasswordRequest", ChangePasswordRequestSchema);
registry.register("ForgotPasswordRequest", ForgotPasswordRequestSchema);
registry.register("ResetPasswordRequest", ResetPasswordRequestSchema);
registry.register("VerifyEmailRequest", VerifyEmailRequestSchema);
registry.register("ResendVerificationRequest", ResendVerificationRequestSchema);

// User schema
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isEmailVerified: z.boolean(),
});

// Auth tokens schema
const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

// API Response schema
const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

// Store schemas
const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  isActive: z.boolean(),
  totalOrders: z.number(),
  totalRevenue: z.number(),
  lastOrderDate: z.string().optional(),
  isOld: z.boolean(),
});

const StoreStatsSchema = z.object({
  totalStores: z.number(),
  oldStores: z.number(),
  newStores: z.number(),
});

const StoreFiltersSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  isOld: z.boolean().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// Order schemas
const OrderStatusSchema = z.enum(['completed', 'pending', 'failed', 'cancelled']);

const OrderProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
});

const OrderSchemaExtended = z.object({
  id: z.string(),
  merchantId: z.string(),
  merchantName: z.string(),
  merchantEmail: z.string(),
  customerEmail: z.string(),
  amount: z.number(),
  status: OrderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  products: z.array(OrderProductSchema),
  isSuccessful: z.boolean(),
});

const OrderStatsSchema = z.object({
  totalOrders: z.number(),
  successfulOrders: z.number(),
  failedOrders: z.number(),
});

const OrderFiltersSchema = z.object({
  status: OrderStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  storeName: z.string().optional(),
  storeEmail: z.string().optional(),
  merchantId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// Dashboard schemas
const DashboardStatSchema = z.object({
  id: z.string(),
  metricType: z.string(),
  year: z.number(),
  month: z.number(),
  week: z.number(),
  value: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const FailedOrderReasonSchema = z.object({
  id: z.number(),
  reason: z.string(),
  year: z.number(),
  month: z.number(),
  week: z.number(),
  value: z.number(),
  updatedAt: z.string(),
});

const DashboardStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DashboardStatSchema),
  message: z.string(),
});

const FailedOrdersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(FailedOrderReasonSchema),
  message: z.string(),
});

const OrderTrendsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    month: z.number(),
    _sum: z.object({
      value: z.number(),
    }),
  })),
  message: z.string(),
});

registry.register("User", UserSchema);
registry.register("AuthTokens", AuthTokensSchema);
registry.register("ApiResponse", ApiResponseSchema);
registry.register("Store", StoreSchema);
registry.register("StoreStats", StoreStatsSchema);
registry.register("StoreFilters", StoreFiltersSchema);
registry.register("OrderExtended", OrderSchemaExtended);
registry.register("OrderStats", OrderStatsSchema);
registry.register("OrderFilters", OrderFiltersSchema);
registry.register("DashboardStat", DashboardStatSchema);
registry.register("FailedOrderReason", FailedOrderReasonSchema);
registry.register("DashboardStatsResponse", DashboardStatsResponseSchema);
registry.register("FailedOrdersResponse", FailedOrdersResponseSchema);
registry.register("OrderTrendsResponse", OrderTrendsResponseSchema);

registry.registerPath({
  method: "post",
  path: "/orders",
  request: {
    body: { content: { "application/json": { schema: CreateOrderSchema } } },
  },
  responses: {
    200: {
      description: "Order created",
      content: { "application/json": { schema: OrderSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/orders/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "Get order by ID",
      content: { "application/json": { schema: OrderSchema } },
    },
  },
});

// Auth endpoints
registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Authentication"],
  request: {
    body: { content: { "application/json": { schema: RegisterRequestSchema } } },
  },
  responses: {
    201: {
      description: "User registered successfully",
      content: { 
        "application/json": { 
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              user: UserSchema,
              tokens: AuthTokensSchema,
            }),
          })
        } 
      },
    },
    400: {
      description: "Registration failed",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Authentication"],
  request: {
    body: { content: { "application/json": { schema: LoginRequestSchema } } },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { 
        "application/json": { 
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              user: UserSchema,
              tokens: AuthTokensSchema,
            }),
          })
        } 
      },
    },
    401: {
      description: "Invalid credentials",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/change-password",
  tags: ["Authentication"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: ChangePasswordRequestSchema } } },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Authentication"],
  request: {
    body: { content: { "application/json": { schema: ForgotPasswordRequestSchema } } },
  },
  responses: {
    200: {
      description: "Password reset email sent",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    400: {
      description: "Forgot password failed",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Authentication"],
  request: {
    body: { content: { "application/json": { schema: ResetPasswordRequestSchema } } },
  },
  responses: {
    200: {
      description: "Password reset successfully",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    400: {
      description: "Password reset failed",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/verify-email",
  tags: ["Authentication"],
  request: {
    body: { content: { "application/json": { schema: VerifyEmailRequestSchema } } },
  },
  responses: {
    200: {
      description: "Email verified successfully",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    400: {
      description: "Email verification failed",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/resend-verification",
  tags: ["Authentication"],
  request: {
    body: { content: { "application/json": { schema: ResendVerificationRequestSchema } } },
  },
  responses: {
    200: {
      description: "Verification email sent successfully",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    400: {
      description: "Resend verification failed",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/profile",
  tags: ["Authentication"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User profile retrieved successfully",
      content: { 
        "application/json": { 
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              user: UserSchema,
            }),
          })
        } 
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

// Store Management Endpoints
registry.registerPath({
  method: "get",
  path: "/merchants",
  tags: ["Store Management"],
  security: [{ bearerAuth: [] }],
  request: {
    query: StoreFiltersSchema,
  },
  responses: {
    200: {
      description: "Stores retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(StoreSchema),
            total: z.number(),
            stats: StoreStatsSchema,
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/merchants/stats",
  tags: ["Store Management"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Store statistics retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: StoreStatsSchema,
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/merchants/{storeId}",
  tags: ["Store Management"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ storeId: z.string() }),
  },
  responses: {
    200: {
      description: "Store retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: StoreSchema,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Store ID required",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/merchants/{storeId}",
  tags: ["Store Management"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ storeId: z.string() }),
  },
  responses: {
    200: {
      description: "Store deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Store ID required",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

// Order Management Endpoints
registry.registerPath({
  method: "get",
  path: "/orders",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  request: {
    query: OrderFiltersSchema,
  },
  responses: {
    200: {
      description: "Orders retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(OrderSchemaExtended),
            total: z.number(),
            stats: OrderStatsSchema,
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/orders/stats",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Order statistics retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: OrderStatsSchema,
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/orders/{orderId}",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ orderId: z.string() }),
  },
  responses: {
    200: {
      description: "Order retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: OrderSchemaExtended,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Order ID required",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/orders/merchant/{merchantId}",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ merchantId: z.string() }),
    query: z.object({
      status: OrderStatusSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Merchant orders retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(OrderSchemaExtended),
            total: z.number(),
            stats: OrderStatsSchema,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Merchant ID required",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/orders",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            merchantId: z.string(),
            customerEmail: z.string().email(),
            amount: z.number(),
            products: z.array(z.object({
              productId: z.string(),
              quantity: z.number(),
            })),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Order created successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: OrderSchemaExtended,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Missing required fields",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/orders/{orderId}",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ orderId: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Order status updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: OrderSchemaExtended,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Order ID and status required",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/orders/{orderId}",
  tags: ["Order Management"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ orderId: z.string() }),
  },
  responses: {
    200: {
      description: "Order cancelled successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Order ID required",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

// Dashboard Endpoints
registry.registerPath({
  method: "get",
  path: "/dashboard/stats",
  tags: ["Dashboard"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Dashboard statistics retrieved successfully",
      content: {
        "application/json": {
          schema: DashboardStatsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/dashboard/month-orders-trends",
  tags: ["Dashboard"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Order trends retrieved successfully",
      content: {
        "application/json": {
          schema: OrderTrendsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/dashboard/failed-orders",
  tags: ["Dashboard"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Failed order reasons retrieved successfully",
      content: {
        "application/json": {
          schema: FailedOrdersResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/dashboard/stats",
  tags: ["Dashboard"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            metricType: z.enum(['orders', 'settlements', 'failed_orders']),
            createdAt: z.string(),
            value: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Dashboard stat updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Missing required fields",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/dashboard/failed-orders",
  tags: ["Dashboard"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string(),
            createdAt: z.string(),
            value: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Failed order reason updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad request - Missing required fields",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ApiResponseSchema } },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Nile Admin Service API",
    version: "1.0.0",
    description: "A comprehensive admin service API with authentication, store management, order management, and dashboard analytics. This service acts as an interface layer to external APIs for merchants/stores and orders.",
    contact: {
      name: "Nile Admin Service",
      email: "admin@nile.com",
    },
  },
  servers: [
    { 
      url: 'http://localhost:9000/api',
      description: 'Development server'
    },
    { 
      url: 'https://api.nile-admin.com/api',
      description: 'Production server'
    }
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],

  tags: [
    {
      name: "Authentication",
      description: "User authentication and account management endpoints",
    },
    {
      name: "Store Management",
      description: "Store/merchant management endpoints - interfaces to external store APIs",
    },
    {
      name: "Order Management", 
      description: "Order management endpoints - interfaces to external order APIs",
    },
    {
      name: "Dashboard",
      description: "Dashboard analytics and statistics endpoints",
    },
  ],
});