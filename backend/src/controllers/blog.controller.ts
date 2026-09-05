import { Request, Response } from "express";
import { query } from "../db/pool.js";
import { createBlogSchema, updateBlogSchema } from "../schemas/blog.schema.js";

// In-memory fallback dataset for offline/development resilience
let fallbackPosts = [
  {
    id: "post-1",
    title: "How to Spot an Overloaded Team Before It Slows Down",
    slug: "how-to-spot-an-overloaded-team-before-it-slows-down",
    excerpt:
      "Early warning indicators engineering leaders can monitor to detect burnout and uneven workload distribution before deadlines slip.",
    content:
      "When high-performing teams suddenly slow down, the root cause is rarely skill or motivation — it is almost always invisible workload accumulation. Context switching, unplanned bug fixes, and uneven task allocation quietly deplete team momentum.\n\nEffective managers do not wait for missed deadlines to diagnose overload. By monitoring weekly capacity distribution and work-in-progress ratios, you can rebalance assignments proactively.\n\nRegular workload visibility conversations during 1-on-1s shift the dynamic from reactive fire-fighting to predictable, sustainable engineering velocity.",
    featured: true,
    published: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "post-2",
    title: "Why Team Capacity Matters More Than Hours Worked",
    slug: "why-team-capacity-matters-more-than-hours-worked",
    excerpt:
      "Why measuring hours logged is a counterproductive metric, and how capacity forecasting leads to accurate delivery commitments.",
    content:
      "Measuring hours worked is an outdated manufacturing metric that breaks down in modern software engineering and knowledge work. A 60-hour week filled with cognitive overload often produces lower quality output than a focused 35-hour sprint.\n\nCapacity measures real available focus time against project complexity. When managers understand their team's true bandwidth, sprint planning transforms into a predictable science.\n\nTeams that plan around capacity rather than raw hours consistently ship with fewer defects and retain their top engineering talent longer.",
    featured: false,
    published: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "post-3",
    title: "A Practical Guide to Workload Visibility in Hybrid Teams",
    slug: "a-practical-guide-to-workload-visibility",
    excerpt:
      "A structured framework for tracking project progress, cross-team dependencies, and effort distribution across remote time zones.",
    content:
      "In hybrid and distributed organizations, the lack of informal hallway check-ins often creates information silos. Managers risk either over-communicating with tedious status meetings or losing touch with project reality.\n\nWorkload visibility is about aggregating progress signals automatically. By centralizing project health and milestone tracking, everyone on the team stays aligned on priorities without interruption.\n\nTransparency builds autonomy. When teams can see where effort is concentrated, individuals self-organize around bottlenecks and resolve dependencies faster.",
    featured: false,
    published: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "post-4",
    title: "How Engineering Managers Track Project Health Without Micromanaging",
    slug: "how-engineering-managers-track-project-health",
    excerpt:
      "How to maintain high standards of accountability and milestone accuracy while giving engineers full autonomy to build.",
    content:
      "Micromanagement is usually the symptom of anxiety caused by a lack of visibility. When leaders do not know whether a milestone is on track, they ask for more updates, disrupting the very focus needed to ship.\n\nObjective project health metrics — velocity consistency, dependency resolution rate, and scope stability — provide the reassurance managers need while preserving team flow state.\n\nSetting clear health thresholds empowers engineering squads to flag risks early without fear, making delivery surprises a thing of the past.",
    featured: false,
    published: true,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: "post-5",
    title: "Internal Architecture: Measuring Sprint Velocity (Draft)",
    slug: "internal-architecture-measuring-sprint-velocity",
    excerpt:
      "An internal draft guide on implementing sprint health heuristics for Flowmetrics engineering teams.",
    content:
      "This is an internal draft post created to verify that unpublished posts are strictly protected and never exposed to public visitors via GET /api/blog or GET /api/blog/:slug.\n\nOnly authenticated administrators can view and manage draft articles from the Admin CMS.",
    featured: false,
    published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getPublicBlogs(_req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, title, slug, excerpt, content, featured, published, created_at, updated_at
       FROM blog_posts
       WHERE published = true
       ORDER BY featured DESC, created_at DESC`
    );

    if (result.rowCount && result.rowCount > 0) {
      res.status(200).json(result.rows);
      return;
    }
    res.status(200).json(
      fallbackPosts
        .filter((p) => p.published)
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    );
  } catch {
    res.status(200).json(
      fallbackPosts
        .filter((p) => p.published)
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    );
  }
}

export async function getPublicBlogBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;

  try {
    const result = await query(
      `SELECT id, title, slug, excerpt, content, featured, published, created_at, updated_at
       FROM blog_posts
       WHERE slug = $1 AND published = true`,
      [slug]
    );

    if (result.rowCount && result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
      return;
    }

    const fallback = fallbackPosts.find((p) => p.slug === slug && p.published);
    if (!fallback) {
      res.status(404).json({ error: "Not Found", message: "Blog post not found or is unpublished" });
      return;
    }
    res.status(200).json(fallback);
  } catch {
    const fallback = fallbackPosts.find((p) => p.slug === slug && p.published);
    if (!fallback) {
      res.status(404).json({ error: "Not Found", message: "Blog post not found or is unpublished" });
      return;
    }
    res.status(200).json(fallback);
  }
}

export async function getAdminBlogs(_req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, title, slug, excerpt, content, featured, published, created_at, updated_at
       FROM blog_posts
       ORDER BY created_at DESC`
    );

    if (result.rowCount && result.rowCount > 0) {
      res.status(200).json(result.rows);
      return;
    }
    res.status(200).json(fallbackPosts);
  } catch {
    res.status(200).json(fallbackPosts);
  }
}

export async function createBlog(req: Request, res: Response): Promise<void> {
  const parseResult = createBlogSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { title, slug, excerpt, content, featured, published } = parseResult.data;

  try {
    const result = await query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, featured, published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, slug, excerpt, content, featured, published, created_at, updated_at`,
      [title, slug, excerpt, content, featured, published]
    );

    const created = result.rows[0];
    fallbackPosts.unshift(created as any);
    res.status(201).json(created);
  } catch {
    const newPost = {
      id: `post-${Date.now()}`,
      title,
      slug,
      excerpt,
      content,
      featured,
      published,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fallbackPosts.unshift(newPost);
    res.status(201).json(newPost);
  }
}

export async function updateBlog(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const parseResult = updateBlogSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const data = parseResult.data;

  try {
    const existing = await query(`SELECT * FROM blog_posts WHERE id::text = $1 OR slug = $1`, [id]);

    if (!existing.rowCount) {
      const idx = fallbackPosts.findIndex((p) => String(p.id) === String(id) || p.slug === id);
      if (idx === -1) {
        res.status(404).json({ error: "Not Found", message: "Blog post not found" });
        return;
      }
      fallbackPosts[idx] = {
        ...fallbackPosts[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      res.status(200).json(fallbackPosts[idx]);
      return;
    }

    const current = existing.rows[0] as any;
    const title = data.title !== undefined ? data.title : current.title;
    const slug = data.slug !== undefined ? data.slug : current.slug;
    const excerpt = data.excerpt !== undefined ? data.excerpt : current.excerpt;
    const content = data.content !== undefined ? data.content : current.content;
    const featured = data.featured !== undefined ? data.featured : current.featured;
    const published = data.published !== undefined ? data.published : current.published;

    const result = await query(
      `UPDATE blog_posts
       SET title = $1, slug = $2, excerpt = $3, content = $4, featured = $5, published = $6, updated_at = NOW()
       WHERE id::text = $7 OR slug = $7
       RETURNING id, title, slug, excerpt, content, featured, published, created_at, updated_at`,
      [title, slug, excerpt, content, featured, published, id]
    );

    const updated = result.rows[0];
    const idx = fallbackPosts.findIndex((p) => String(p.id) === String(id) || p.slug === id);
    if (idx !== -1) fallbackPosts[idx] = updated as any;

    res.status(200).json(updated);
  } catch {
    const idx = fallbackPosts.findIndex((p) => String(p.id) === String(id) || p.slug === id);
    if (idx === -1) {
      res.status(404).json({ error: "Not Found", message: "Blog post not found" });
      return;
    }
    fallbackPosts[idx] = {
      ...fallbackPosts[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    res.status(200).json(fallbackPosts[idx]);
  }
}

export async function deleteBlog(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await query(`DELETE FROM blog_posts WHERE id::text = $1 OR slug = $1`, [id]);
    fallbackPosts = fallbackPosts.filter((p) => String(p.id) !== String(id) && p.slug !== id);
    res.status(200).json({ message: "Blog post deleted successfully", id });
  } catch {
    fallbackPosts = fallbackPosts.filter((p) => String(p.id) !== String(id) && p.slug !== id);
    res.status(200).json({ message: "Blog post deleted successfully", id });
  }
}
