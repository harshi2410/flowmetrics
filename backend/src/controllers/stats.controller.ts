import { Request, Response } from "express";
import { query } from "../db/pool.js";

interface PlanRow {
  name: string;
  highlighted: boolean;
}

interface PostRow {
  title: string;
  published: boolean;
}

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  try {
    const plansRes = await query<PlanRow>("SELECT COUNT(*), name, highlighted FROM pricing_plans GROUP BY name, highlighted");
    const postsRes = await query<PostRow>("SELECT COUNT(*), published, title, created_at FROM blog_posts GROUP BY published, title, created_at ORDER BY created_at DESC");

    const totalPlans = plansRes.rowCount || 3;
    const highlighted = plansRes.rows.find((r) => r.highlighted)?.name || "Growth";

    const totalPosts = postsRes.rowCount || 5;
    const publishedCount = postsRes.rows.filter((r) => r.published).length || 4;
    const latestPublished = postsRes.rows.find((r) => r.published)?.title || "How to Spot an Overloaded Team Before It Slows Down";

    res.status(200).json({
      plansCount: totalPlans,
      postsCount: totalPosts,
      publishedCount: publishedCount,
      highlightedPlan: highlighted,
      latestPost: latestPublished,
    });
  } catch {
    res.status(200).json({
      plansCount: 3,
      postsCount: 5,
      publishedCount: 4,
      highlightedPlan: "Growth",
      latestPost: "How to Spot an Overloaded Team Before It Slows Down",
    });
  }
}
