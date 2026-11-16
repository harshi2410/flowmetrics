import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware } from "../../middleware/tenant.middleware.js";
import { mcpController } from "./mcp.controller.js";

const router = Router();

// MCP endpoint accepts JSON-RPC 2.0 requests
router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

router.post("/", (req, res) => {
  mcpController.handleJsonRpc(req as any, res);
});

export default router;
