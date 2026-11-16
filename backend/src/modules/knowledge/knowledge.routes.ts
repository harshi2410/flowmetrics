import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { knowledgeController } from "./knowledge.controller.js";

const router = Router();

// All knowledge endpoints require authenticated organization context
router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

router.get("/documents", (req, res) => {
  knowledgeController.listDocuments(req as any, res);
});
router.post("/documents", requirePermission("knowledge.manage"), (req, res) => {
  knowledgeController.createDocument(req as any, res);
});
router.post("/query", (req, res) => {
  knowledgeController.query(req as any, res);
});

export default router;
