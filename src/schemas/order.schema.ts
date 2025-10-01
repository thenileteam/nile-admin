import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const OrderSchema = z.object({
  id: z.string().openapi({ example: "ord_12345" }),
  merchantId: z.string().openapi({ example: "merch_001" }),
  amount: z.number().openapi({ example: 5000 }),
  status: z.enum(["SUCCESS", "FAILED"]).openapi({ example: "SUCCESS" }),
  createdAt: z.string().datetime().openapi({ example: "2025-10-01T12:00:00Z" }),
});

export const CreateOrderSchema = OrderSchema.omit({ id: true, createdAt: true });
