import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { operationsService } from "./operations.service.js";
import {
  CreateTeamSchema,
  CreateProjectSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
} from "./operations.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export class OperationsController {
  // Teams
  async listTeams(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const teams = await operationsService.getTeams(req.organizationId);
      sendSuccess(res, teams, 200, { message: "Teams fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch teams", 500);
    }
  }

  async createTeam(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = CreateTeamSchema.parse(req.body);
      const team = await operationsService.createTeam(req.organizationId, validated);
      sendSuccess(res, team, 201, { message: "Team created successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid team parameters", 400, err.errors);
        return;
      }
      sendError(res, "CreateError", err.message || "Failed to create team", 500);
    }
  }

  // Projects
  async listProjects(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const projects = await operationsService.getProjects(req.organizationId);
      sendSuccess(res, projects, 200, { message: "Projects fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch projects", 500);
    }
  }

  async createProject(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = CreateProjectSchema.parse(req.body);
      const project = await operationsService.createProject(req.organizationId, validated);
      sendSuccess(res, project, 201, { message: "Project created successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid project parameters", 400, err.errors);
        return;
      }
      sendError(res, "CreateError", err.message || "Failed to create project", 500);
    }
  }

  // Tasks
  async listTasks(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { projectId, status } = req.query;
      const tasks = await operationsService.getTasks(
        req.organizationId,
        projectId ? String(projectId) : undefined,
        status ? String(status) : undefined
      );
      sendSuccess(res, tasks, 200, { message: "Tasks fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch tasks", 500);
    }
  }

  async createTask(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = CreateTaskSchema.parse(req.body);
      const task = await operationsService.createTask(req.organizationId, validated);
      sendSuccess(res, task, 201, { message: "Task created successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid task parameters", 400, err.errors);
        return;
      }
      sendError(res, "CreateError", err.message || "Failed to create task", 500);
    }
  }

  async updateTask(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const validated = UpdateTaskSchema.parse(req.body);
      const updated = await operationsService.updateTask(req.organizationId, id, validated);
      sendSuccess(res, updated, 200, { message: "Task updated successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid update parameters", 400, err.errors);
        return;
      }
      sendError(res, "UpdateError", err.message || "Failed to update task", 400);
    }
  }

  // Workload
  async getWorkload(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const workload = await operationsService.getWorkload(req.organizationId);
      sendSuccess(res, workload, 200, { message: "Workload metrics calculated" });
    } catch (err: any) {
      sendError(res, "WorkloadError", err.message || "Failed to get workload metrics", 500);
    }
  }

  // Sprints
  async listSprints(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { projectId } = req.query;
      const sprints = await operationsService.getSprints(
        req.organizationId,
        projectId ? String(projectId) : undefined
      );
      sendSuccess(res, sprints, 200, { message: "Sprints fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch sprints", 500);
    }
  }

  async createSprint(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { projectId, name, goal, startDate, endDate } = req.body;
      if (!projectId || !name || !startDate || !endDate) {
        sendError(res, "ValidationError", "Missing required sprint fields", 400);
        return;
      }
      const sprint = await operationsService.createSprint(req.organizationId, {
        projectId,
        name,
        goal,
        startDate,
        endDate,
      });
      sendSuccess(res, sprint, 201, { message: "Sprint created successfully" });
    } catch (err: any) {
      sendError(res, "CreateError", err.message || "Failed to create sprint", 500);
    }
  }
}

export const operationsController = new OperationsController();
