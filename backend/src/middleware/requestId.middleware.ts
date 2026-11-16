import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const incomingId = req.headers["x-request-id"];
  const requestId =
    typeof incomingId === "string" && incomingId.trim().length > 0
      ? incomingId.trim()
      : crypto.randomUUID();

  res.locals.requestId = requestId;
  res.locals.startTime = Date.now();
  res.setHeader("X-Request-Id", requestId);

  next();
}
