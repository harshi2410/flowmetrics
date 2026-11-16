import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { toolRegistry } from "../agents/tool.registry.js";

export class McpController {
  async handleJsonRpc(req: TenantRequest, res: Response): Promise<void> {
    const { jsonrpc, id, method, params } = req.body;

    if (jsonrpc !== "2.0") {
      res.status(400).json({
        jsonrpc: "2.0",
        id: id || null,
        error: { code: -32600, message: "Invalid Request: Expected JSON-RPC 2.0" },
      });
      return;
    }

    try {
      switch (method) {
        case "initialize": {
          res.json({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
              },
              serverInfo: {
                name: "flowmetrics-enterprise-mcp",
                version: "2.0.0",
              },
            },
          });
          return;
        }

        case "tools/list": {
          const tools = toolRegistry.listTools().map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: {
              type: "object",
              properties: t.parameters,
            },
          }));
          res.json({
            jsonrpc: "2.0",
            id,
            result: { tools },
          });
          return;
        }

        case "tools/call": {
          const { name, arguments: args } = params || {};
          const tool = toolRegistry.getTool(name);
          if (!tool) {
            res.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Tool '${name}' not found` },
            });
            return;
          }

          if (!req.organizationId) {
            res.status(403).json({
              jsonrpc: "2.0",
              id,
              error: { code: -32000, message: "Organization tenant context required for tool execution" },
            });
            return;
          }

          const result = await tool.execute(req.organizationId, args || {});
          res.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          });
          return;
        }

        default: {
          res.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method '${method}' not implemented` },
          });
        }
      }
    } catch (err: any) {
      res.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: err.message || "Internal MCP error" },
      });
    }
  }
}

export const mcpController = new McpController();
