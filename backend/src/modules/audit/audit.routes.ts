import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { auditController } from "./audit.controller.js";

const router = Router();

router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

router.get("/logs", requirePermission("audit.read"), (req, res) => {
  auditController.listLogs(req as any, res);
});

export default router;
