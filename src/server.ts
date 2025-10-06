import express from "express";
import swaggerUi from "swagger-ui-express";
import { OrderRouter } from "./routes/order.routes";
import { AuthRouter } from "./routes/auth.routes";
import { openApiSpec } from "./docs/swagger";

const app = express();
app.use(express.json());

// Routes
app.use("/api", OrderRouter);
app.use("/api/auth", AuthRouter);



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
