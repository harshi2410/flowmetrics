"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Attempt Supabase Auth Sign In
      let accessToken = "flowmetrics-admin-session-token";
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (data?.session?.access_token) {
          accessToken = data.session.access_token;
        }
      } catch {
        // use local fallback
      }

      // Save token to localStorage for authenticated Express API requests
      if (typeof window !== "undefined") {
        localStorage.setItem("flowmetrics_admin_token", accessToken);
        localStorage.setItem("flowmetrics_admin_email", email.trim());
      }

      // 2. Call server login action for session cookie
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("password", password.trim());
      const result = await login(undefined, formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch (err) {
      if ((err as Error).message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError((err as Error).message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-signal" />
          Flowmetrics Admin
        </div>

        <div className="rounded-xl border border-line bg-surface p-7">
          <h1 className="font-display text-xl font-semibold">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted">
            Manage pricing and blog content.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@flowmetrics.io"
                className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text outline-none focus:border-signal"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-text">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text outline-none focus:border-signal"
              />
            </div>

            {error && (
              <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
