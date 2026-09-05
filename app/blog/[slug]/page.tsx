import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts as defaultBlogPosts, type BlogPost } from "@/lib/data";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getApiBaseUrl } from "@/lib/api-client";

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/api/blog/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const p = await res.json();
      if (p && p.slug && p.published !== false) {
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
      }
    }
  } catch {
    // fallback to local data
  }
  const local = defaultBlogPosts.find((p) => p.slug === slug && p.published !== false);
  return local || null;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-14 sm:px-8 sm:py-20 flex-1">
        <Link href="/#blog" className="text-sm text-muted hover:text-signal transition-colors">
          &larr; Back to blog
        </Link>

        {post.featured && (
          <span className="mt-6 inline-block w-fit rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-signal uppercase">
            FEATURED
          </span>
        )}

        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          <span>{post.author}</span>
          <span aria-hidden="true">&middot;</span>
          <span>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>{post.readTime}</span>
        </div>

        <div className="mt-10 flex flex-col gap-5">
          {post.content.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-text/90">
              {paragraph}
            </p>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
