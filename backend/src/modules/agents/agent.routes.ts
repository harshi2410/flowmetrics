import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { agentController } from "./agent.controller.js";

const router = Router();

// All agent endpoints require authentication and tenant context
router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

// Agent Execution & Tools
router.post("/execute", requirePermission("agents.execute"), (req, res) => {
  agentController.executeAgent(req as any, res);
});
router.get("/tools", (req, res) => {
  agentController.listTools(req as any, res);
});

// Observability & Traces
router.get("/executions", requirePermission("audit.read"), (req, res) => {
  agentController.listExecutions(req as any, res);
});
router.get("/executions/:id/trace", requirePermission("audit.read"), (req, res) => {
  agentController.getTrace(req as any, res);
});

// Approvals Inbox
router.get("/approvals", (req, res) => {
  agentController.listApprovals(req as any, res);
});
router.post("/approvals/:id/review", requirePermission("agents.approve"), (req, res) => {
  agentController.resolveApproval(req as any, res);
});

// Evaluations
router.post("/evaluations/run", requirePermission("agents.configure"), (req, res) => {
  agentController.runEvaluations(req as any, res);
});
router.get("/evaluations", (req, res) => {
  agentController.listEvaluations(req as any, res);
});

export default router;
