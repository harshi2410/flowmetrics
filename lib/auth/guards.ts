import { redirect } from "next/navigation";
import { getSessionTokenFromCookies, validateSession, type AuthenticatedUser } from "./session";

/**
 * Ensures the caller is an authenticated admin.
 * If not authenticated, redirects to /admin/login.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const token = await getSessionTokenFromCookies();
  const session = await validateSession(token);

  if (!session || !session.user) {
    redirect("/admin/login");
  }

  return session.user;
}

/**
 * Returns the authenticated admin user if logged in, or null.
 */
export async function getCurrentAdmin(): Promise<AuthenticatedUser | null> {
  const token = await getSessionTokenFromCookies();
  const session = await validateSession(token);
  return session?.user ?? null;
}
