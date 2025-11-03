import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);
// --- 1. Enums (matching your Prisma enums) ---

export const OrderStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "ON_HOLD",
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const PaymentStatusEnum = z.enum([
  "UNPAID",
  "PENDING_PAYMENT", // More specific initial state
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "AUTHORIZED", // Payment authorized but not captured yet
  "VOIDED", // Authorized payment cancelled
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const ShippingStatusEnum = z.enum([
  "PENDING", // Not yet processed for shipping
  "PROCESSING", // Shipping label created, awaiting pickup
  "SHIPPED", // In transit
  "DELIVERED",
  "RETURNED", // Returned to sender
  "EXCEPTION", // Delivery exception (e.g., address issue)
]);
export type ShippingStatus = z.infer<typeof ShippingStatusEnum>;

// --- 2. Nested Schemas ---

// For creating an OrderItem (e.g., from cart)
export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid("Product ID must be a valid UUID."), // Assuming product IDs are UUIDs
  productName: z.string().min(1, "Product name is required."),
  productPrice: z.number().positive("Product price must be positive."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  //   variant: z.record(z.string(), z.any()).optional(), // e.g., { "color": "red", "size": "M" }
});
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().openapi({ example: "ord_12345" }),
  merchantId: z.string().openapi({ example: "merch_001" }),
  amount: z.number().openapi({ example: 5000 }),
  status: z.enum(["SUCCESS", "FAILED"]).openapi({ example: "SUCCESS" }),
  createdAt: z.string().datetime().openapi({ example: "2025-10-01T12:00:00Z" }),
});

export const CreateOrderSchema = OrderSchema.omit({ id: true, createdAt: true });



// For OrderItem as returned in a response (includes DB-generated fields)
export const OrderItemResponseSchema = CreateOrderItemSchema.extend({
  id: z.number().int().positive(),
  orderId: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type OrderItemResponse = z.infer<typeof OrderItemResponseSchema>;

// Simplified Customer schema for embedding in order responses or inputs
// This assumes you're only returning basic customer info with the order, not the full Customer model
export const CustomerRelationSchema = z.object({
  id: z.string().uuid("Customer ID must be a valid UUID."),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email format."),
  phone: z.string().optional(),
});
export type CustomerRelation = z.infer<typeof CustomerRelationSchema>;

// This assumes you're only returning basic payment info with the order
export const PaymentRelationSchema = z.object({
  id: z.string().uuid("Payment ID must be a valid UUID."),
  amount: z.number().positive("Payment amount must be positive."),
  status: PaymentStatusEnum,
  transactionId: z.string().optional(),
});
export type PaymentRelation = z.infer<typeof PaymentRelationSchema>;

// Audit Trail Schema (as returned)
export const AuditTrailResponseSchema = z.object({
  id: z.number().int().positive(),
  orderId: z.number().int().positive(),
  timestamp: z.string().datetime(),
  action: z.string(),
  details: z.any().optional(), // Use z.unknown() or a more specific schema if possible
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AuditTrailResponse = z.infer<typeof AuditTrailResponseSchema>;



export const ExternalOrderSchema = z.object({
  id: z.number().int().positive(),
  storeId: z.string().min(1),
  customerId: z.string().uuid(), // Required on response
  customer: CustomerRelationSchema, // Include basic c
  // ustomer details
  customerAssigned: z.boolean(),

  customerFullName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),

  items: z.array(OrderItemResponseSchema),

  status: OrderStatusEnum,
  payment: PaymentRelationSchema.optional(), // Can be null if payment not yet created/failed
  paymentStatus: PaymentStatusEnum,

  subtotalAmount: z.number(),
  shippingFee: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number(),
  grandTotal: z.number(),

  shippingMethodId: z.string().uuid().nullable(), // Use nullable for Prisma optional fields
  shippingZoneName: z.string().nullable(),
  shippingAddress: z.string(), // @db.Text in Prisma
  deliveryTrackingNumber: z.string().nullable(),
  shippingStatus: ShippingStatusEnum,

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  auditTrail: z.array(AuditTrailResponseSchema), // Assuming auditTrail is loaded
  // shippingId removed as it's redundant with shippingMethodId and shippingAddress
});
export type ExternalOrder = z.infer<typeof ExternalOrderSchema>;
