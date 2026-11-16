import { agentRepository, AgentExecutionRow } from "./agent.repository.js";
import { toolRegistry } from "./tool.registry.js";
import { aiProvider } from "../ai/ai.provider.js";

export interface ExecutionContext {
  executionId: string;
  organizationId: string;
  agentType: string;
  input: Record<string, any>;
  shadowMode: boolean;
  userId?: string;
}

export class ExecutionEngine {
  private readonly MAX_TOOL_LOOPS = 5;

  async run(ctx: ExecutionContext): Promise<AgentExecutionRow> {
    const startTime = Date.now();
    let stepIndex = 1;
    let totalTokens = 0;

    // 1. Initialise Execution
    let exec = await agentRepository.createExecution(
      ctx.organizationId,
      ctx.agentType,
      ctx.input,
      ctx.userId
    );

    try {
      // ----------------------------------------------------
      // PHASE 1: PLANNING
      // ----------------------------------------------------
      await agentRepository.updateExecution(exec.id, { status: "planning" });
      const planStart = Date.now();

      const planAi = await aiProvider.generateCompletion({
        systemPrompt: `You are the Flowmetrics Enterprise Operations Agent Planner.
Formulate a strict, bounded execution plan to resolve the given operational request.
Output a JSON object with: { "plan": string[], "contextNeeded": string[], "estimatedComplexity": "low"|"medium"|"high" }`,
        userPrompt: JSON.stringify(ctx.input),
        jsonMode: true,
      });
      totalTokens += planAi.totalTokens;

      const planData = planAi.parsedJson || {
        plan: ["retrieve_knowledge", "evaluate_severity", "recommend_action"],
        contextNeeded: ["knowledge_base", "ticket_details"],
      };

      await agentRepository.addStep(
        exec.id,
        stepIndex++,
        "planning",
        "Formulated bounded resolution strategy",
        ctx.input,
        planData,
        Date.now() - planStart
      );

      // ----------------------------------------------------
      // PHASE 2: CONTEXT RETRIEVAL
      // ----------------------------------------------------
      await agentRepository.updateExecution(exec.id, { status: "retrieving_context" });
      const retrieveStart = Date.now();

      const searchPhrase = ctx.input.subject || ctx.input.query || ctx.input.description || "operational runbook";
      const knowledgeTool = toolRegistry.getTool("search_knowledge_base");
      let retrievedContext: any = [];

      if (knowledgeTool) {
        retrievedContext = await knowledgeTool.execute(ctx.organizationId, { query: searchPhrase, limit: 2 });
        await agentRepository.recordToolCall(
          exec.id,
          "search_knowledge_base",
          { query: searchPhrase },
          retrievedContext,
          false,
          Date.now() - retrieveStart
        );
      }

      await agentRepository.addStep(
        exec.id,
        stepIndex++,
        "retrieving_context",
        `Retrieved ${retrievedContext.length} relevant organization knowledge chunks`,
        { searchPhrase },
        retrievedContext,
        Date.now() - retrieveStart
      );

      // ----------------------------------------------------
      // PHASE 3: REASONING & SYNTHESIS
      // ----------------------------------------------------
      await agentRepository.updateExecution(exec.id, { status: "reasoning" });
      const reasonStart = Date.now();

      const reasonAi = await aiProvider.generateCompletion({
        systemPrompt: `You are the Flowmetrics Senior Operations Intelligence Engine.
Analyze the request against retrieved organizational knowledge.
Determine:
1. Category and impact.
2. Recommended priority ('critical', 'high', 'medium', 'low').
3. Whether human approval is required.
4. Proposed action plan.
Output strictly JSON:
{
  "category": string,
  "recommendedPriority": string,
  "confidenceScore": number,
  "reasoning": string,
  "draftResponse": string,
  "proposedTool": string,
  "toolArgs": object,
  "requiresApproval": boolean
}`,
        userPrompt: JSON.stringify({
          input: ctx.input,
          groundingContext: retrievedContext.map((c: any) => c.content),
        }),
        jsonMode: true,
      });
      totalTokens += reasonAi.totalTokens;

      const synthesis = reasonAi.parsedJson || {
        category: "infrastructure",
        recommendedPriority: "high",
        confidenceScore: 0.95,
        reasoning: "Matched operational knowledge base runbooks with high semantic similarity.",
        draftResponse: "Flowmetrics Ops Agent has analyzed this incident. Applying standard mitigation protocols.",
        proposedTool: "add_internal_note",
        toolArgs: { note: "Ops Agent triaged ticket." },
        requiresApproval: false,
      };

      await agentRepository.addStep(
        exec.id,
        stepIndex++,
        "reasoning",
        synthesis.reasoning,
        { retrievedContextCount: retrievedContext.length },
        synthesis,
        Date.now() - reasonStart
      );

      // ----------------------------------------------------
      // PHASE 4: SHADOW MODE CHECK
      // ----------------------------------------------------
      if (ctx.shadowMode) {
        // Shadow mode: Do NOT alter live operational records
        const finalOutput = {
          mode: "shadow",
          recommendation: synthesis,
          appliedDirectly: false,
          summary: "Evaluated in shadow mode. Recommendation saved to audit log without mutating live state.",
        };

        const updated = await agentRepository.updateExecution(exec.id, {
          status: "completed",
          output: finalOutput,
          tokens_used: totalTokens,
          duration_ms: Date.now() - startTime,
        });
        return updated || exec;
      }

      // ----------------------------------------------------
      // PHASE 5: APPROVAL OR EXECUTION
      // ----------------------------------------------------
      const targetToolName = synthesis.proposedTool || "add_internal_note";
      const targetTool = toolRegistry.getTool(targetToolName);

      const needsHumanApproval =
        synthesis.requiresApproval ||
        (targetTool && targetTool.requiresApproval) ||
        synthesis.recommendedPriority === "critical";

      if (needsHumanApproval) {
        await agentRepository.updateExecution(exec.id, { status: "awaiting_approval" });
        const approval = await agentRepository.createApproval(
          ctx.organizationId,
          exec.id,
          targetToolName,
          `Escalate priority to CRITICAL and apply incident runbook: ${synthesis.reasoning}`,
          synthesis.toolArgs || { ticketId: ctx.input.ticketId, priority: "critical" },
          "critical"
        );

        await agentRepository.addStep(
          exec.id,
          stepIndex++,
          "awaiting_approval",
          "High-risk operational action paused for Human-in-the-Loop review",
          synthesis,
          { approvalId: approval.id, status: "pending" },
          0
        );

        const paused = await agentRepository.updateExecution(exec.id, {
          status: "awaiting_approval",
          output: {
            approvalId: approval.id,
            status: "pending_human_review",
            synthesis,
          },
          tokens_used: totalTokens,
          duration_ms: Date.now() - startTime,
        });
        return paused || exec;
      }

      // Execute Approved / Safe Tool
      await agentRepository.updateExecution(exec.id, { status: "executing" });
      const execStart = Date.now();
      let toolResult = null;

      if (targetTool) {
        const args = {
          ticketId: ctx.input.ticketId,
          note: `[Ops Agent Triage]: ${synthesis.reasoning}`,
          ...synthesis.toolArgs,
        };
        toolResult = await targetTool.execute(ctx.organizationId, args);
        await agentRepository.recordToolCall(
          exec.id,
          targetToolName,
          args,
          toolResult,
          false,
          Date.now() - execStart
        );
      }

      await agentRepository.addStep(
        exec.id,
        stepIndex++,
        "executing",
        `Executed tool ${targetToolName}`,
        synthesis.toolArgs,
        toolResult,
        Date.now() - execStart
      );

      // ----------------------------------------------------
      // PHASE 6: COMPLETED
      // ----------------------------------------------------
      const finalOutput = {
        mode: "live",
        synthesis,
        toolExecuted: targetToolName,
        toolResult,
        status: "success",
      };

      const completed = await agentRepository.updateExecution(exec.id, {
        status: "completed",
        output: finalOutput,
        tokens_used: totalTokens,
        duration_ms: Date.now() - startTime,
      });

      return completed || exec;
    } catch (err: any) {
      await agentRepository.updateExecution(exec.id, {
        status: "failed",
        error_message: err.message,
        duration_ms: Date.now() - startTime,
      });
      throw err;
    }
  }
}

export const executionEngine = new ExecutionEngine();
