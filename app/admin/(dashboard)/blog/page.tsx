import { getAllBlogPosts } from "@/lib/services/blog.service";
import { BlogPostEditor } from "@/components/admin/BlogPostEditor";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const blogPosts = await getAllBlogPosts();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-1.5 text-sm text-muted">
        Publish articles, manage drafts, mark featured posts, and update content.
      </p>

      <div className="mt-8">
        <BlogPostEditor initialPosts={blogPosts} />
      </div>
    </div>
  );
}
