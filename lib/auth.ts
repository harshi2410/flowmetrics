"use server";

import { redirect } from "next/navigation";
import { query } from "./db";
import { ensureDbInitialized } from "./db/init-db";
import { verifyPassword } from "./auth/password";
import {
  createSession,
  invalidateSession,
  validateSession,
  getSessionTokenFromCookies,
} from "./auth/session";

export type LoginState = { error: string } | undefined;

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@flowmetrics.io").toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "flowmetrics2026";

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  let authenticated = false;
  let userId = "admin-default";
  let userName = "Flowmetrics Admin";
  let userRole = "admin";

  try {
    await ensureDbInitialized();

    const res = await query(
      `SELECT id, email, password_hash, name, role
       FROM admin_users
       WHERE email = $1`,
      [email]
    );

    if (res.rowCount && res.rowCount > 0) {
      const user = res.rows[0];
      const passwordValid = await verifyPassword(password, user.password_hash);
      if (passwordValid) {
        authenticated = true;
        userId = String(user.id);
        userName = String(user.name);
        userRole = String(user.role);
      }
    }
  } catch {
    // Database query fallback
  }

  // Fallback check against configured admin credentials
  if (!authenticated) {
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      authenticated = true;
    }
  }

  if (!authenticated) {
    return { error: "That email and password don't match our records." };
  }

  // Create session and set cookie
  await createSession(userId, {
    id: userId,
    email,
    name: userName,
    role: userRole,
  });

  redirect("/admin");
}

export async function logout() {
  const token = await getSessionTokenFromCookies();
  await invalidateSession(token);
  redirect("/admin/login");
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionTokenFromCookies();
  const session = await validateSession(token);
  return session !== null;
}
