import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required before role verification",
    });
    return;
  }

  const role =
    req.user.user_metadata?.role ||
    req.user.app_metadata?.role;

  if (role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
      message: "Access denied. Administrator privileges required.",
    });
    return;
  }

  next();
}
