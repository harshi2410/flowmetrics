import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { workflowController } from "./workflow.controller.js";

const router = Router();

router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

router.get("/rules", (req, res) => {
  workflowController.listRules(req as any, res);
});
router.post("/rules", requirePermission("agents.configure"), (req, res) => {
  workflowController.createRule(req as any, res);
});
router.post("/trigger", (req, res) => {
  workflowController.triggerEvent(req as any, res);
});

export default router;
