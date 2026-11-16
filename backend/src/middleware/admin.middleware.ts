import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { sendError } from "../utils/response.js";

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendError(
      res,
      "Unauthorized",
      "Authentication required before role verification",
      401
    );
    return;
  }

  const role =
    req.user.role ||
    req.user.user_metadata?.role ||
    req.user.app_metadata?.role;

  if (role !== "admin" && role !== "owner") {
    sendError(
      res,
      "Forbidden",
      "Access denied. Administrator privileges required.",
      403
    );
    return;
  }

  next();
}
