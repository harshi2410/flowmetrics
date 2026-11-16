import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { supportController } from "./support.controller.js";

const router = Router();

// All support endpoints require JWT authentication and active Organization membership
router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

router.get("/tickets", (req, res) => {
  supportController.listTickets(req as any, res);
});
router.get("/tickets/:id", (req, res) => {
  supportController.getTicket(req as any, res);
});
router.post("/tickets", (req, res) => {
  supportController.createTicket(req as any, res);
});
router.put("/tickets/:id", requirePermission("tickets.manage"), (req, res) => {
  supportController.updateTicket(req as any, res);
});

router.get("/tickets/:id/comments", (req, res) => {
  supportController.listComments(req as any, res);
});
router.post("/tickets/:id/comments", (req, res) => {
  supportController.addComment(req as any, res);
});

export default router;
