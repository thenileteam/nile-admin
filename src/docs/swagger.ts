import { extendZodWithOpenApi, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';    
import { OpenApiGeneratorV3 as OpenAPIGenerator, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { CreateOrderSchema, OrderSchema } from '../schemas/order.schema';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  verifyEmailSchema, 
  resendVerificationSchema 
} from '../schemas/auth.schema';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Order schemas
registry.register("Order", OrderSchema);
registry.register("CreateOrder", CreateOrderSchema);

// Auth schemas
registry.register("RegisterRequest", registerSchema.shape.body);
registry.register("LoginRequest", loginSchema.shape.body);
registry.register("ChangePasswordRequest", changePasswordSchema.shape.body);
registry.register("ForgotPasswordRequest", forgotPasswordSchema.shape.body);
registry.register("ResetPasswordRequest", resetPasswordSchema.shape.body);
registry.register("VerifyEmailRequest", verifyEmailSchema.shape.body);
registry.register("ResendVerificationRequest", resendVerificationSchema.shape.body);

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

registry.register("User", UserSchema);
registry.register("AuthTokens", AuthTokensSchema);
registry.register("ApiResponse", ApiResponseSchema);

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
    body: { content: { "application/json": { schema: registerSchema.shape.body } } },
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
    body: { content: { "application/json": { schema: loginSchema.shape.body } } },
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
    body: { content: { "application/json": { schema: changePasswordSchema.shape.body } } },
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
    body: { content: { "application/json": { schema: forgotPasswordSchema.shape.body } } },
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
    body: { content: { "application/json": { schema: resetPasswordSchema.shape.body } } },
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
    body: { content: { "application/json": { schema: verifyEmailSchema.shape.body } } },
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
    body: { content: { "application/json": { schema: resendVerificationSchema.shape.body } } },
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

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Nile Admin Service API",
    version: "1.0.0",
    description: "A comprehensive admin service API with authentication and order management",
  },
  servers: [{ url: 'http://localhost:9000/api' }],
  
});
