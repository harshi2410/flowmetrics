import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { operationsController } from "./operations.controller.js";

const router = Router();

// All operations endpoints require JWT authentication and active Organization membership
router.use(authMiddleware as any);
router.use(tenantMiddleware as any);

// Teams
router.get("/teams", requirePermission("projects.update"), (req, res) => {
  operationsController.listTeams(req as any, res);
});
router.post("/teams", requirePermission("projects.create"), (req, res) => {
  operationsController.createTeam(req as any, res);
});

// Projects
router.get("/projects", (req, res) => {
  operationsController.listProjects(req as any, res);
});
router.post("/projects", requirePermission("projects.create"), (req, res) => {
  operationsController.createProject(req as any, res);
});

// Tasks
router.get("/tasks", (req, res) => {
  operationsController.listTasks(req as any, res);
});
router.post("/tasks", requirePermission("tasks.assign"), (req, res) => {
  operationsController.createTask(req as any, res);
});
router.put("/tasks/:id", requirePermission("tasks.assign"), (req, res) => {
  operationsController.updateTask(req as any, res);
});

// Workload Metrics
router.get("/workload", (req, res) => {
  operationsController.getWorkload(req as any, res);
});

export default router;
