import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  // XSS protection filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS in production
  if (env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Remove Express banner
  res.removeHeader("X-Powered-By");

  next();
}
