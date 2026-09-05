import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pricingRouter } from "./routes/pricing.routes.js";
import { blogRouter } from "./routes/blog.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

export const app = express();

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mount Public & Admin API Routes
app.use("/api/pricing", pricingRouter);
app.use("/api/blog", blogRouter);
app.use("/api/admin", adminRouter);

// 404 handler for unmatched API routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found", message: "API route does not exist" });
});

// Centralized Error Handling Middleware
app.use(errorHandler);
