import { NextFunction, Request, Response } from "express";
import { z, ZodSchema } from "zod";

export const validateRequest =
  (schema: ZodSchema<any>) =>
  (req: Request & { body: any; query: any; params: any }, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      (req as any).body = result.body;
      (req as any).query = result.query;
      req.params = result.params;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: (err as z.ZodError).issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),  
        });
      }
      next(err);
    }
  };
