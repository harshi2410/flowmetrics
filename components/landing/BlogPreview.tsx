import Link from "next/link";
import { blogPosts as defaultBlogPosts, type BlogPost } from "@/lib/data";

async function fetchBlogPosts(): Promise<BlogPost[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/blog`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any) => {
          const content = typeof p.content === "string" ? p.content.split(/\n+/).filter(Boolean) : (Array.isArray(p.content) ? p.content : []);
          const wordCount = (typeof p.content === "string" ? p.content : content.join(" ")).split(/\s+/).length;
          const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
          return {
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt || "",
            content,
            featured: Boolean(p.featured),
            published: p.published !== false,
            date: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            readTime: p.read_time || readTime,
            author: p.author || "Sarah Chen",
          };
        });
      }
    }
  } catch {
    // fallback to local data
  }
  return defaultBlogPosts.filter((p) => p.published !== false);
}

export async function BlogPreview() {
  const blogPosts = (await fetchBlogPosts()).slice(0, 4);

  return (
    <section id="blog" className="border-t border-line/70 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-lg">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              From the blog
            </h2>
            <p className="mt-3 text-muted">
              Practical guides on workload visibility, sprint capacity planning, and project health.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border border-line bg-ink p-6 transition-colors hover:border-signal/50"
            >
              {post.featured && (
                <span className="mb-3 w-fit rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-signal uppercase">
                  FEATURED
                </span>
              )}
              <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-signal">
                {post.title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">
                {post.excerpt}
              </p>
              <p className="mt-5 text-xs text-muted">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                &middot; {post.readTime}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
