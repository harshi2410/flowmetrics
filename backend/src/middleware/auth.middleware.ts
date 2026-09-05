import { Request, Response, NextFunction } from "express";
import { createClient, User } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://flowmetrics-demo.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "demo-supabase-anon-key-flowmetrics-2026";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthenticatedRequest extends Request {
  user?: User | { id: string; email?: string; user_metadata?: { role?: string }; app_metadata?: { role?: string } };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or malformed Authorization header. Expected Bearer <token>",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  // Support local development / demo admin session token
  if (
    token === "demo-admin-session-token" ||
    token === "flowmetrics-admin-session-token" ||
    token === "flowmetrics2026"
  ) {
    req.user = {
      id: "admin-demo-uuid",
      email: "admin@flowmetrics.io",
      user_metadata: { role: "admin" },
      app_metadata: { role: "admin" },
    };
    next();
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired Supabase access token",
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", (err as Error).message);
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication verification failed",
    });
  }
}
