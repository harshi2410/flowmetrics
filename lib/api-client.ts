import { supabase } from "./supabase/client";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "";
  }
  const port = process.env.PORT || 5000;
  return `http://127.0.0.1:${port}`;
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("flowmetrics_admin_token");
    if (localToken) return localToken;
  }

  return null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const err: ApiError = new Error(
      errorData.message || errorData.error || `Request failed with status ${response.status}`
    );
    err.status = response.status;
    err.details = errorData.details;
    throw err;
  }

  return response.json();
}
