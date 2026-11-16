import { Response } from "express";

export interface ApiResponseMeta {
  requestId?: string;
  timestamp: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  extraMeta?: Record<string, unknown>
): void {
  const requestId = (res.locals.requestId as string) || (res.getHeader("X-Request-Id") as string) || undefined;
  const startTime = res.locals.startTime as number | undefined;
  const durationMs = startTime ? Date.now() - startTime : undefined;

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs,
      ...extraMeta,
    },
  };

  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
): void {
  const requestId = (res.locals.requestId as string) || (res.getHeader("X-Request-Id") as string) || undefined;

  const response: ApiErrorResponse = {
    success: false,
    error,
    message,
    requestId,
    details,
  };

  res.status(statusCode).json(response);
}
