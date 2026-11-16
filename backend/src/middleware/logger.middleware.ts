import { Request, Response, NextFunction } from "express";

export function structuredLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Capture response finish
  res.on("finish", () => {
    // Skip static assets if any pass through
    if (req.path.startsWith("/_next/") || req.path.includes(".")) {
      return;
    }

    const durationMs = res.locals.startTime ? Date.now() - res.locals.startTime : 0;
    const requestId = res.locals.requestId || "-";

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent") || "-",
    };

    if (res.statusCode >= 500) {
      console.error(`[ERROR] ${JSON.stringify(logEntry)}`);
    } else if (res.statusCode >= 400) {
      console.warn(`[WARN]  ${JSON.stringify(logEntry)}`);
    } else {
      console.log(`[INFO]  ${JSON.stringify(logEntry)}`);
    }
  });

  next();
}
