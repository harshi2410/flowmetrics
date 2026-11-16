/**
 * Client-side authentication helpers for admin operations
 */

export function getAdminAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("flowmetrics_token") ||
    localStorage.getItem("flowmetrics_admin_token") ||
    ""
  );
}

export function getAdminHeaders(): Record<string, string> {
  const token = getAdminAuthToken();
  let orgId = "flowmetrics-hq-id";

  if (typeof window !== "undefined") {
    try {
      const currentOrg = localStorage.getItem("flowmetrics_current_org");
      if (currentOrg) {
        const parsed = JSON.parse(currentOrg);
        if (parsed?.id) orgId = parsed.id;
      }
    } catch {
      // ignore
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Organization-Id": orgId,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}
