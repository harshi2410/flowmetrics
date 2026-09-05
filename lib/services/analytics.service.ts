import { query } from "../db";
import { ensureDbInitialized } from "../db/init-db";

export type AnalyticsEvent = {
  id: string;
  name: string;
  meta: string;
  tone: "signal" | "muted";
  createdAt: Date;
};

export type DashboardStats = {
  pricingPlansCount: number;
  blogPostsCount: number;
  highlightedPlanName: string;
  latestPostTitle: string | null;
};

const defaultEvents: AnalyticsEvent[] = [
  { id: "1", name: "checkout_completed", meta: "user_8841 · $84.00", tone: "signal", createdAt: new Date() },
  { id: "2", name: "signup_started", meta: "user_9213 · web", tone: "muted", createdAt: new Date() },
  { id: "3", name: "trial_activated", meta: "user_7750 · Growth plan", tone: "signal", createdAt: new Date() },
  { id: "4", name: "invite_sent", meta: "user_2204 · 3 recipients", tone: "muted", createdAt: new Date() },
  { id: "5", name: "checkout_completed", meta: "user_5567 · $49.00", tone: "signal", createdAt: new Date() },
];

/**
 * Fetch the most recent live stream analytics events.
 */
export async function getRecentEvents(limit: number = 5): Promise<AnalyticsEvent[]> {
  try {
    await ensureDbInitialized();

    const res = await query(
      `SELECT id, name, meta, tone, created_at
       FROM analytics_events
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    if (res.rowCount && res.rowCount > 0) {
      return res.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        meta: String(row.meta),
        tone: (row.tone as "signal" | "muted") || "signal",
        createdAt: new Date(row.created_at),
      }));
    }
    return defaultEvents.slice(0, limit);
  } catch {
    return defaultEvents.slice(0, limit);
  }
}

/**
 * Log a new analytics event.
 */
export async function logEvent(
  name: string,
  meta: string,
  tone: "signal" | "muted" = "signal"
): Promise<AnalyticsEvent> {
  await ensureDbInitialized();

  const res = await query(
    `INSERT INTO analytics_events (name, meta, tone)
     VALUES ($1, $2, $3)
     RETURNING id, name, meta, tone, created_at`,
    [name, meta, tone]
  );

  const row = res.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    meta: String(row.meta),
    tone: (row.tone as "signal" | "muted") || "signal",
    createdAt: new Date(row.created_at),
  };
}

/**
 * Fetch high-level summary statistics for the admin dashboard.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    await ensureDbInitialized();

    const [plansRes, postsRes, highlightedRes, latestPostRes] = await Promise.all([
      query("SELECT COUNT(*) as count FROM pricing_plans"),
      query("SELECT COUNT(*) as count FROM blog_posts WHERE published = TRUE"),
      query("SELECT name FROM pricing_plans WHERE highlighted = TRUE LIMIT 1"),
      query("SELECT title FROM blog_posts WHERE published = TRUE ORDER BY date DESC, created_at DESC LIMIT 1"),
    ]);

    return {
      pricingPlansCount: Number(plansRes.rows[0]?.count ?? 0),
      blogPostsCount: Number(postsRes.rows[0]?.count ?? 0),
      highlightedPlanName: highlightedRes.rows[0]?.name ?? "—",
      latestPostTitle: latestPostRes.rows[0]?.title ?? null,
    };
  } catch {
    return {
      pricingPlansCount: 3,
      blogPostsCount: 3,
      highlightedPlanName: "Growth",
      latestPostTitle: "Instrumenting your first funnel in under an hour",
    };
  }
}
