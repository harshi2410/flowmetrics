import { operationsRepository, TeamRow, ProjectRow, TaskRow, MemberWorkload } from "./operations.repository.js";
import { CreateTeamSchema, CreateProjectSchema, UpdateProjectSchema, CreateTaskSchema, UpdateTaskSchema } from "./operations.schema.js";
import { z } from "zod";

export class OperationsService {
  // Teams
  async getTeams(orgId: string): Promise<TeamRow[]> {
    return operationsRepository.listTeams(orgId);
  }

  async createTeam(orgId: string, input: z.infer<typeof CreateTeamSchema>): Promise<TeamRow> {
    return operationsRepository.createTeam(orgId, input.name, input.description, input.leadUserId);
  }

  // Projects
  async getProjects(orgId: string): Promise<ProjectRow[]> {
    return operationsRepository.listProjects(orgId);
  }

  async createProject(orgId: string, input: z.infer<typeof CreateProjectSchema>): Promise<ProjectRow> {
    return operationsRepository.createProject(
      orgId,
      input.name,
      input.key,
      input.description,
      input.teamId,
      input.managerId,
      input.targetDate
    );
  }

  // Tasks
  async getTasks(orgId: string, projectId?: string, status?: string): Promise<TaskRow[]> {
    return operationsRepository.listTasks(orgId, projectId, status);
  }

  async createTask(orgId: string, input: z.infer<typeof CreateTaskSchema>): Promise<TaskRow> {
    return operationsRepository.createTask(
      orgId,
      input.projectId,
      input.title,
      input.description,
      input.status,
      input.priority,
      input.assigneeId,
      input.estimatedHours,
      input.dueDate,
      input.labels
    );
  }

  async updateTask(orgId: string, taskId: string, input: z.infer<typeof UpdateTaskSchema>): Promise<TaskRow> {
    const updated = await operationsRepository.updateTask(orgId, taskId, {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assignee_id: input.assigneeId,
      estimated_hours: input.estimatedHours,
      actual_hours: input.actualHours,
      due_date: input.dueDate,
    });
    if (!updated) {
      throw new Error("Task not found or does not belong to this organization");
    }
    return updated;
  }

  // Workload Metrics
  async getWorkload(orgId: string): Promise<MemberWorkload[]> {
    return operationsRepository.getWorkloadMetrics(orgId);
  }
}

export const operationsService = new OperationsService();
