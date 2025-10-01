import express from "express";
import { z } from "zod";
import { validateRequest } from "../utils/validateRequest";
import { CreateOrderSchema, OrderSchema } from "../schemas/order.schema";

export const OrderRouter = express.Router();

OrderRouter.post(
  "/orders",
  validateRequest({ body: CreateOrderSchema }),
  (req, res) => {
    const newOrder = { id: "ord_123", ...req.body, createdAt: new Date().toISOString() };
    res.json(newOrder);
  }
);

OrderRouter.get(
  "/orders/:id",
  validateRequest({ params: z.object({ id: z.string() }) }),
  (req, res) => {
    res.json({
      id: req.params.id,
      merchantId: "merch_001",
      amount: 5000,
      status: "SUCCESS",
      createdAt: new Date().toISOString()
    });
  }
);


