import { extendZodWithOpenApi, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';    
import { OpenApiGeneratorV3 as OpenAPIGenerator, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { CreateOrderSchema, OrderSchema } from '../schemas/order.schema';


const registry = new OpenAPIRegistry();

registry.register("Order", OrderSchema);
registry.register("CreateOrder", CreateOrderSchema);

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
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Admin API",
    version: "1.0.0",
  },
  servers: [{ url: 'v1/api' }],
});
