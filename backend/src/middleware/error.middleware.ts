import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // If response has already started streaming, delegate to Express default handler
  if (res.headersSent) {
    return;
  }

  // Handle Zod validation error
  if (err instanceof ZodError) {
    sendError(
      res,
      "Validation Error",
      "Request data failed schema validation",
      400,
      err.issues
    );
    return;
  }

  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && "body" in err) {
    sendError(
      res,
      "Bad Request",
      "Malformed JSON payload in request body",
      400
    );
    return;
  }

  // Log unhandled server error
  console.error("Unhandled Error:", {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  // Safe error message for clients
  const message =
    env.NODE_ENV === "production"
      ? "An internal server error occurred. Please try again later."
      : err.message || "An unexpected error occurred.";

  sendError(
    res,
    "Internal Server Error",
    message,
    500,
    env.NODE_ENV !== "production" ? { stack: err.stack } : undefined
  );
}
