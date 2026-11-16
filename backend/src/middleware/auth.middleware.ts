import { Request, Response, NextFunction } from "express";
import { createClient, User } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { verifyJwt, TokenPayload } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

const supabase =
  env.SUPABASE_URL && env.SUPABASE_ANON_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
    : null;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  orgId?: string;
  permissions?: string[];
  user_metadata?: { role?: string; name?: string };
  app_metadata?: { role?: string };
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawHeader =
    req.headers.authorization ||
    (req.headers as Record<string, string | string[] | undefined>)["authorization"];
  const authHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(
      res,
      "Unauthorized",
      "Missing or malformed Authorization header. Expected: Bearer <token>",
      401
    );
    return;
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    sendError(res, "Unauthorized", "Empty authentication token provided", 401);
    return;
  }

  // 1. Verify standard Flowmetrics cryptographic JWT
  try {
    const payload: TokenPayload = verifyJwt(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || "viewer",
      name: payload.name,
      orgId: payload.orgId,
      permissions: payload.permissions || [],
      user_metadata: { role: payload.role, name: payload.name },
      app_metadata: { role: payload.role },
    };
    return next();
  } catch {
    // If local JWT check fails, fall through to check Supabase
  }

  // 2. Verify Supabase JWT if Supabase is active
  if (supabase) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (user && !error) {
        const role =
          (user.user_metadata?.role as string) ||
          (user.app_metadata?.role as string) ||
          "viewer";

        req.user = {
          id: user.id,
          email: user.email || "",
          role,
          name: (user.user_metadata?.name as string) || user.email || "User",
          user_metadata: { role },
          app_metadata: { role },
        };
        return next();
      }
    } catch {
      // Supabase verification error
    }
  }

  // Reject untrusted, bypassed, or expired tokens
  sendError(
    res,
    "Unauthorized",
    "Invalid, expired, or untrusted authentication token",
    401
  );
}
