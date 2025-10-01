import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

type ValidateSchema = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validateRequest =
  (schemas: ValidateSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as ParsedQs;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as ParamsDictionary;
      }
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ errors: e.issues });
      }
      next(e);
    }
  };
