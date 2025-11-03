import cors from "cors";
import dotenv from "dotenv";


import express from "express";
import swaggerUi from "swagger-ui-express";
import { OrderRouter } from "./routes/order.routes";
import { AuthRouter } from "./routes/auth.routes";
import { openApiSpec } from "./docs/swagger";
import { DashboardRouter } from "./routes/dashboard.route";
import { MerchantRouter } from "./routes/merchant.routes";
import startListeners from "./rabbitMq/consumers";


dotenv.config();
const app = express();
app.use(express.json());
 interface CorsOptions {
   origin: (
     origin: string | undefined,
     callback: (err: Error | null, allow?: boolean) => void
   ) => void;
   credentials: boolean;
 }

 const corsOptions: CorsOptions = {
   origin: function (
     origin: string | undefined,
     callback: (err: Error | null, allow?: boolean) => void
   ): void {
     const allowedOrigins: string[] = [
       "http://localhost:5173",
       "http://app.nile.ng",
       "http://admin.nile.ng",
       "https://admin.nile.ng",
       "http://store.nile.ng",
       "http://cart.nile.ng",
     "http://payment.nile.ng",
     ];

//     console.log("CORS request origin:", origin);

     if (!origin || allowedOrigins.includes(origin)) {
       console.log("✅ CORS allowed for:", origin);
       callback(null, true);
     } else {
       console.log("❌ CORS denied for:", origin);
       callback(new Error("Not allowed by CORS"));
     }
   },
   credentials: true,
 };

 app.use(cors(corsOptions));
 app.options("*", cors(corsOptions));
// Routes
app.use("/api/merchants", MerchantRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/dashboard", DashboardRouter);



app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));



// Not found route
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: "ROUTE_NOT_FOUND",
  });
});


app.listen(9000, () => {
  console.log("🚀 Server running at http://localhost:9000");
  console.log("📖 Swagger docs at http://localhost:9000/docs");
});


startListeners();