import { query } from "../db";
import { ensureDbInitialized } from "../db/init-db";
import { blogPosts as defaultBlogPosts, type BlogPost } from "../data";

type BlogPostRow = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: unknown;
  featured?: boolean;
  published?: boolean;
  author: string;
  read_time: string;
  date: string | Date;
};

const memoryPosts: BlogPost[] = defaultBlogPosts.map((p) => ({
  ...p,
  featured: p.featured ?? false,
  published: p.published !== false,
  content: [...p.content],
}));

function mapRowToPost(row: BlogPostRow): BlogPost {
  let content: string[] = [];
  if (Array.isArray(row.content)) {
    content = row.content as string[];
  } else if (typeof row.content === "string") {
    try {
      content = JSON.parse(row.content);
    } catch {
      content = [row.content];
    }
  }

  let formattedDate = "";
  if (row.date instanceof Date) {
    formattedDate = row.date.toISOString().slice(0, 10);
  } else if (typeof row.date === "string") {
    formattedDate = row.date.slice(0, 10);
  } else {
    formattedDate = new Date().toISOString().slice(0, 10);
  }

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content,
    featured: Boolean(row.featured),
    published: row.published !== false,
    date: formattedDate,
    readTime: row.read_time,
    author: row.author,
  };
}

/**
 * Fetch all published blog posts (for public landing & blog detail pages).
 * Featured posts appear first, followed by newest published date.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    await ensureDbInitialized();

    const res = await query<BlogPostRow>(
      `SELECT slug, title, excerpt, content, featured, published, author, read_time, date
       FROM blog_posts
       WHERE published = TRUE
       ORDER BY featured DESC, date DESC, created_at DESC`
    );

    if (res.rowCount && res.rowCount > 0) {
      return res.rows.map(mapRowToPost);
    }
    return memoryPosts
      .filter((p) => p.published !== false)
      .sort((a, b) => {
        if (Boolean(b.featured) !== Boolean(a.featured)) {
          return b.featured ? 1 : -1;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  } catch {
    return memoryPosts
      .filter((p) => p.published !== false)
      .sort((a, b) => {
        if (Boolean(b.featured) !== Boolean(a.featured)) {
          return b.featured ? 1 : -1;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }
}

/**
 * Fetch all blog posts (including drafts) for Admin CMS.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    await ensureDbInitialized();

    const res = await query<BlogPostRow>(
      `SELECT slug, title, excerpt, content, featured, published, author, read_time, date
       FROM blog_posts
       ORDER BY date DESC, created_at DESC`
    );

    if (res.rowCount && res.rowCount > 0) {
      return res.rows.map(mapRowToPost);
    }
    return memoryPosts;
  } catch {
    return memoryPosts;
  }
}

/**
 * Fetch a single blog post by its unique slug (public only sees published).
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    await ensureDbInitialized();

    const res = await query<BlogPostRow>(
      `SELECT slug, title, excerpt, content, featured, published, author, read_time, date
       FROM blog_posts
       WHERE slug = $1 AND published = TRUE`,
      [slug]
    );

    if (!res.rowCount) {
      return memoryPosts.find((p) => p.slug === slug && p.published !== false) ?? null;
    }
    return mapRowToPost(res.rows[0]);
  } catch {
    return memoryPosts.find((p) => p.slug === slug && p.published !== false) ?? null;
  }
}

/**
 * Create or save a blog post in PostgreSQL & fallback store.
 */
export async function saveBlogPost(data: {
  title: string;
  slug?: string;
  originalSlug?: string;
  excerpt: string;
  body: string;
  featured?: boolean;
  published?: boolean;
  author?: string;
}): Promise<BlogPost> {
  const title = data.title.trim();
  const excerpt = data.excerpt.trim();
  const author = (data.author || "Admin").trim();
  const body = data.body.trim();
  const featured = Boolean(data.featured);
  const published = data.published !== false;
  const content = body.split(/\n+/).filter(Boolean);

  let targetSlug = (data.slug || "").trim();
  if (!targetSlug) {
    targetSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  if (!targetSlug) {
    targetSlug = `post-${Date.now()}`;
  }

  const wordCount = body.split(/\s+/).length;
  const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
  const currentDate = new Date().toISOString().slice(0, 10);

  const newPost: BlogPost = {
    slug: targetSlug,
    title,
    excerpt,
    content,
    featured,
    published,
    author,
    readTime,
    date: currentDate,
  };

  // Update memory fallback
  if (data.originalSlug) {
    const memIdx = memoryPosts.findIndex((p) => p.slug === data.originalSlug);
    if (memIdx !== -1) {
      memoryPosts[memIdx] = newPost;
    } else {
      memoryPosts.unshift(newPost);
    }
  } else {
    const memIdx = memoryPosts.findIndex((p) => p.slug === targetSlug);
    if (memIdx !== -1) {
      memoryPosts[memIdx] = newPost;
    } else {
      memoryPosts.unshift(newPost);
    }
  }

  try {
    await ensureDbInitialized();

    if (data.originalSlug) {
      // Update existing post
      const res = await query<BlogPostRow>(
        `UPDATE blog_posts
         SET title = $1, slug = $2, excerpt = $3, content = $4::jsonb, featured = $5, published = $6, updated_at = NOW()
         WHERE slug = $7
         RETURNING slug, title, excerpt, content, featured, published, author, read_time, date`,
        [title, targetSlug, excerpt, JSON.stringify(content), featured, published, data.originalSlug]
      );
      if (res.rowCount && res.rowCount > 0) {
        return mapRowToPost(res.rows[0]);
      }
    } else {
      // Insert new post
      const res = await query<BlogPostRow>(
        `INSERT INTO blog_posts (slug, title, excerpt, content, featured, published, author, read_time, date)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content, featured = EXCLUDED.featured, published = EXCLUDED.published, updated_at = NOW()
         RETURNING slug, title, excerpt, content, featured, published, author, read_time, date`,
        [
          targetSlug,
          title,
          excerpt,
          JSON.stringify(content),
          featured,
          published,
          author,
          readTime,
          currentDate,
        ]
      );
      if (res.rowCount && res.rowCount > 0) {
        return mapRowToPost(res.rows[0]);
      }
    }
  } catch {
    // Return memory fallback post
  }

  return newPost;
}

/**
 * Delete a blog post by its slug.
 */
export async function deleteBlogPost(slug: string): Promise<boolean> {
  const memIdx = memoryPosts.findIndex((p) => p.slug === slug);
  if (memIdx !== -1) {
    memoryPosts.splice(memIdx, 1);
  }

  try {
    await ensureDbInitialized();
    const res = await query(
      `DELETE FROM blog_posts WHERE slug = $1`,
      [slug]
    );
    return (res.rowCount ?? 0) > 0;
  } catch {
    return true;
  }
}
