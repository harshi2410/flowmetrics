import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { pricingRouter } from "./routes/pricing.routes.js";
import { blogRouter } from "./routes/blog.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { organizationRouter } from "./modules/organizations/organization.routes.js";
import operationsRouter from "./modules/operations/operations.routes.js";
import supportRouter from "./modules/support/support.routes.js";
import knowledgeRouter from "./modules/knowledge/knowledge.routes.js";
import agentRouter from "./modules/agents/agent.routes.js";
import workflowRouter from "./modules/workflows/workflow.routes.js";
import auditRouter from "./modules/audit/audit.routes.js";
import mcpRouter from "./modules/mcp/mcp.routes.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { securityHeadersMiddleware } from "./middleware/security.middleware.js";
import { structuredLoggerMiddleware } from "./middleware/logger.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { sendSuccess, sendError } from "./utils/response.js";

export const app = express();

// Parse client URLs allowlist
const clientUrls = (env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

// 1. Request ID Middleware
app.use(requestIdMiddleware);

// 2. OWASP Security Headers
app.use(securityHeadersMiddleware);

// 3. Structured Request Logger
app.use(structuredLoggerMiddleware);

// 4. Strict CORS Protection
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow internal server-to-server or non-browser agents with no origin header
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        clientUrls.includes(origin) ||
        (env.NODE_ENV !== "production" && defaultAllowedOrigins.includes(origin)) ||
        (env.NODE_ENV === "production" && (origin.endsWith(".onrender.com") || origin.endsWith(".vercel.app")));

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Organization-Id",
      "X-Requested-With",
      "Accept",
    ],
    maxAge: 86400,
  })
);

// 5. Enforce Payload Size Limits (1MB maximum)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 6. Comprehensive Health Check & Diagnostic Endpoint
app.get("/api/health", async (_req, res) => {
  const startDb = Date.now();
  let dbConnected = false;
  let dbLatencyMs = -1;
  let dbError: string | undefined;

  try {
    await pool.query("SELECT 1 AS ping");
    dbConnected = true;
    dbLatencyMs = Date.now() - startDb;
  } catch (err) {
    dbConnected = false;
    dbError = (err as Error).message;
  }

  const healthData = {
    status: dbConnected ? "healthy" : "degraded",
    service: "flowmetrics-backend",
    version: "1.0.0",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: dbConnected,
      latencyMs: dbLatencyMs,
      error: dbError,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    },
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
  };

  if (!dbConnected) {
    // Return 200 with degraded status in dev, or 503 if required
    return res.status(env.NODE_ENV === "production" ? 503 : 200).json({
      success: false,
      data: healthData,
    });
  }

  sendSuccess(res, healthData);
});

// 7. Mount Public & Protected API Routes
app.use("/api/auth", authRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/operations", operationsRouter);
app.use("/api/support", supportRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/agents", agentRouter);
app.use("/api/workflows", workflowRouter);
app.use("/api/audit", auditRouter);
app.use("/api/mcp", mcpRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/blog", blogRouter);
app.use("/api/admin", adminRouter);

// 8. Centralized Error Handling Middleware
app.use(errorHandler);
