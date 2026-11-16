import crypto from "node:crypto";
import { query } from "../../db/pool.js";

export interface AgentExecutionRow {
  id: string;
  organization_id: string;
  agent_type: string;
  status:
    | "queued"
    | "planning"
    | "retrieving_context"
    | "reasoning"
    | "awaiting_approval"
    | "executing"
    | "completed"
    | "failed";
  input: Record<string, any>;
  output: Record<string, any> | null;
  tokens_used: number;
  duration_ms: number;
  error_message: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AgentExecutionStepRow {
  id: string;
  execution_id: string;
  step_number: number;
  state: string;
  description: string;
  input_data: any;
  output_data: any;
  duration_ms: number;
  created_at: Date;
}

export interface AgentToolCallRow {
  id: string;
  execution_id: string;
  tool_name: string;
  arguments: Record<string, any>;
  result: any;
  is_error: boolean;
  duration_ms: number;
  created_at: Date;
}

export interface AgentApprovalRow {
  id: string;
  organization_id: string;
  execution_id: string;
  tool_name: string;
  proposed_action: string;
  payload: Record<string, any>;
  risk_level: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewer_comment: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

export interface AgentEvaluationRow {
  id: string;
  organization_id: string;
  test_suite_name: string;
  test_scenario: string;
  passed: boolean;
  score: number;
  actual_output: Record<string, any>;
  expected_output: Record<string, any>;
  reasoning: string;
  created_at: Date;
}

// In-Memory Fallback
const memExecutions = new Map<string, AgentExecutionRow>();
const memSteps = new Map<string, AgentExecutionStepRow[]>();
const memTools = new Map<string, AgentToolCallRow[]>();
const memApprovals = new Map<string, AgentApprovalRow>();
const memEvaluations = new Map<string, AgentEvaluationRow>();

export class AgentRepository {
  async createExecution(
    orgId: string,
    agentType: string,
    input: Record<string, any>,
    createdBy?: string
  ): Promise<AgentExecutionRow> {
    const id = crypto.randomUUID();
    try {
      const sql = `
        INSERT INTO agent_executions (id, organization_id, agent_type, status, input, created_by)
        VALUES ($1, $2, $3, 'queued', $4::jsonb, $5)
        RETURNING *
      `;
      const res = await query<AgentExecutionRow>(sql, [
        id,
        orgId,
        agentType,
        JSON.stringify(input),
        createdBy || null,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const row: AgentExecutionRow = {
      id,
      organization_id: orgId,
      agent_type: agentType,
      status: "queued",
      input,
      output: null,
      tokens_used: 0,
      duration_ms: 0,
      error_message: null,
      created_by: createdBy || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memExecutions.set(id, row);
    return row;
  }

  async updateExecution(
    executionId: string,
    updates: Partial<AgentExecutionRow>
  ): Promise<AgentExecutionRow | null> {
    try {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.output !== undefined) {
        fields.push(`output = $${idx++}::jsonb`);
        values.push(JSON.stringify(updates.output));
      }
      if (updates.tokens_used !== undefined) {
        fields.push(`tokens_used = $${idx++}`);
        values.push(updates.tokens_used);
      }
      if (updates.duration_ms !== undefined) {
        fields.push(`duration_ms = $${idx++}`);
        values.push(updates.duration_ms);
      }
      if (updates.error_message !== undefined) {
        fields.push(`error_message = $${idx++}`);
        values.push(updates.error_message);
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(executionId);

        const sql = `
          UPDATE agent_executions
          SET ${fields.join(", ")}
          WHERE id = $${idx}
          RETURNING *
        `;
        const res = await query<AgentExecutionRow>(sql, values);
        if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
      }
    } catch {
      // fallback
    }

    const exec = memExecutions.get(executionId);
    if (exec) {
      Object.assign(exec, updates, { updated_at: new Date() });
      return exec;
    }
    return null;
  }

  async addStep(
    executionId: string,
    stepNumber: number,
    state: string,
    description: string,
    inputData: any,
    outputData: any,
    durationMs: number = 0
  ): Promise<AgentExecutionStepRow> {
    const id = crypto.randomUUID();
    try {
      const sql = `
        INSERT INTO agent_execution_steps (id, execution_id, step_number, state, description, input_data, output_data, duration_ms)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
        RETURNING *
      `;
      const res = await query<AgentExecutionStepRow>(sql, [
        id,
        executionId,
        stepNumber,
        state,
        description,
        JSON.stringify(inputData ?? null),
        JSON.stringify(outputData ?? null),
        durationMs,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const row: AgentExecutionStepRow = {
      id,
      execution_id: executionId,
      step_number: stepNumber,
      state,
      description,
      input_data: inputData,
      output_data: outputData,
      duration_ms: durationMs,
      created_at: new Date(),
    };
    const list = memSteps.get(executionId) || [];
    list.push(row);
    memSteps.set(executionId, list);
    return row;
  }

  async recordToolCall(
    executionId: string,
    toolName: string,
    args: Record<string, any>,
    result: any,
    isError: boolean = false,
    durationMs: number = 0
  ): Promise<AgentToolCallRow> {
    const id = crypto.randomUUID();
    try {
      const sql = `
        INSERT INTO agent_tool_calls (id, execution_id, tool_name, arguments, result, is_error, duration_ms)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
        RETURNING *
      `;
      const res = await query<AgentToolCallRow>(sql, [
        id,
        executionId,
        toolName,
        JSON.stringify(args),
        JSON.stringify(result ?? null),
        isError,
        durationMs,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const row: AgentToolCallRow = {
      id,
      execution_id: executionId,
      tool_name: toolName,
      arguments: args,
      result,
      is_error: isError,
      duration_ms: durationMs,
      created_at: new Date(),
    };
    const list = memTools.get(executionId) || [];
    list.push(row);
    memTools.set(executionId, list);
    return row;
  }

  async createApproval(
    orgId: string,
    executionId: string,
    toolName: string,
    proposedAction: string,
    payload: Record<string, any>,
    riskLevel: AgentApprovalRow["risk_level"] = "high"
  ): Promise<AgentApprovalRow> {
    const id = crypto.randomUUID();
    try {
      const sql = `
        INSERT INTO agent_approvals (id, organization_id, execution_id, tool_name, proposed_action, payload, risk_level, status)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 'pending')
        RETURNING *
      `;
      const res = await query<AgentApprovalRow>(sql, [
        id,
        orgId,
        executionId,
        toolName,
        proposedAction,
        JSON.stringify(payload),
        riskLevel,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const row: AgentApprovalRow = {
      id,
      organization_id: orgId,
      execution_id: executionId,
      tool_name: toolName,
      proposed_action: proposedAction,
      payload,
      risk_level: riskLevel,
      status: "pending",
      reviewed_by: null,
      reviewer_comment: null,
      reviewed_at: null,
      created_at: new Date(),
    };
    memApprovals.set(id, row);
    return row;
  }

  async listApprovals(orgId: string, status?: string): Promise<AgentApprovalRow[]> {
    try {
      const conditions = ["organization_id = $1"];
      const params: any[] = [orgId];
      if (status) {
        conditions.push("status = $2");
        params.push(status);
      }
      const sql = `SELECT * FROM agent_approvals WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
      const res = await query<AgentApprovalRow>(sql, params);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    return Array.from(memApprovals.values())
      .filter((a) => a.organization_id === orgId && (!status || a.status === status))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async resolveApproval(
    approvalId: string,
    status: "approved" | "rejected",
    reviewerUserId: string,
    comment?: string
  ): Promise<AgentApprovalRow | null> {
    try {
      const sql = `
        UPDATE agent_approvals
        SET status = $1, reviewed_by = $2, reviewer_comment = $3, reviewed_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      const res = await query<AgentApprovalRow>(sql, [status, reviewerUserId, comment || null, approvalId]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const item = memApprovals.get(approvalId);
    if (item) {
      item.status = status;
      item.reviewed_by = reviewerUserId;
      item.reviewer_comment = comment || null;
      item.reviewed_at = new Date();
      return item;
    }
    return null;
  }

  async listExecutions(orgId: string, limit: number = 20): Promise<AgentExecutionRow[]> {
    try {
      const sql = `SELECT * FROM agent_executions WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2`;
      const res = await query<AgentExecutionRow>(sql, [orgId, limit]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    return Array.from(memExecutions.values())
      .filter((e) => e.organization_id === orgId)
      .slice(0, limit);
  }

  async getExecutionTrace(executionId: string): Promise<{
    execution: AgentExecutionRow | null;
    steps: AgentExecutionStepRow[];
    toolCalls: AgentToolCallRow[];
  }> {
    try {
      const execRes = await query<AgentExecutionRow>("SELECT * FROM agent_executions WHERE id = $1", [
        executionId,
      ]);
      const stepsRes = await query<AgentExecutionStepRow>(
        "SELECT * FROM agent_execution_steps WHERE execution_id = $1 ORDER BY step_number ASC",
        [executionId]
      );
      const toolsRes = await query<AgentToolCallRow>(
        "SELECT * FROM agent_tool_calls WHERE execution_id = $1 ORDER BY created_at ASC",
        [executionId]
      );

      return {
        execution: execRes.rows[0] || null,
        steps: stepsRes.rows,
        toolCalls: toolsRes.rows,
      };
    } catch {
      // fallback
    }

    return {
      execution: memExecutions.get(executionId) || null,
      steps: memSteps.get(executionId) || [],
      toolCalls: memTools.get(executionId) || [],
    };
  }

  async recordEvaluation(
    orgId: string,
    evalData: {
      suiteName: string;
      scenario: string;
      passed: boolean;
      score: number;
      actualOutput: any;
      expectedOutput: any;
      reasoning: string;
    }
  ): Promise<AgentEvaluationRow> {
    const id = crypto.randomUUID();
    try {
      const sql = `
        INSERT INTO agent_evaluations (id, organization_id, test_suite_name, test_scenario, passed, score, actual_output, expected_output, reasoning)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
        RETURNING *
      `;
      const res = await query<AgentEvaluationRow>(sql, [
        id,
        orgId,
        evalData.suiteName,
        evalData.scenario,
        evalData.passed,
        evalData.score,
        JSON.stringify(evalData.actualOutput),
        JSON.stringify(evalData.expectedOutput),
        evalData.reasoning,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const row: AgentEvaluationRow = {
      id,
      organization_id: orgId,
      test_suite_name: evalData.suiteName,
      test_scenario: evalData.scenario,
      passed: evalData.passed,
      score: evalData.score,
      actual_output: evalData.actualOutput,
      expected_output: evalData.expectedOutput,
      reasoning: evalData.reasoning,
      created_at: new Date(),
    };
    memEvaluations.set(id, row);
    return row;
  }

  async listEvaluations(orgId: string): Promise<AgentEvaluationRow[]> {
    try {
      const sql = `SELECT * FROM agent_evaluations WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50`;
      const res = await query<AgentEvaluationRow>(sql, [orgId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    return Array.from(memEvaluations.values())
      .filter((e) => e.organization_id === orgId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
}

export const agentRepository = new AgentRepository();
