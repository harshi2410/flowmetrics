import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { auditRepository } from "./audit.repository.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export class AuditController {
  async listLogs(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const logs = await auditRepository.listLogs(req.organizationId);
      sendSuccess(res, logs, 200, { message: "Audit logs retrieved" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to list audit logs", 500);
    }
  }
}

export const auditController = new AuditController();
