import express from "express";
import swaggerUi from "swagger-ui-express";
import { OrderRouter } from "./routes/order.routes";
import { openApiSpec } from "./docs/swagger";

const app = express();
app.use(express.json());

// Routes
app.use("/api", OrderRouter);

// Swagger Docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.listen(9000, () => {
  console.log("🚀 Server running at http://localhost:9000");
  console.log("📖 Swagger docs at http://localhost:9000/docs");
});
