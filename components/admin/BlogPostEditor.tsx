"use client";

import { useState, useEffect } from "react";
import type { BlogPost } from "@/lib/data";
import { saveBlogPostAction, deleteBlogPostAction } from "@/lib/admin-actions";
import { getApiBaseUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

export function BlogPostEditor({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  const startEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setContent(Array.isArray(post.content) ? post.content.join("\n\n") : (post.content as unknown as string) || "");
    setFeatured(Boolean(post.featured));
    setPublished(post.published !== false);
    setStatusMessage(null);
  };

  const resetForm = () => {
    setEditingPost(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setFeatured(false);
    setPublished(true);
    setStatusMessage(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPost) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const apiUrl = getApiBaseUrl();
    const generatedSlug =
      slug.trim() ||
      (editingPost ? editingPost.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));

    const payload = {
      title: title.trim(),
      slug: generatedSlug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      featured,
      published,
    };

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_admin_token") || "flowmetrics-admin-session-token" : "";
      if (editingPost) {
        await fetch(`${apiUrl}/api/admin/blog/${editingPost.slug}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${apiUrl}/api/admin/blog`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
    } catch {
      // ignore
    }

    // Call server action for Next.js cache revalidation
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("slug", generatedSlug);
    if (editingPost) {
      formData.set("originalSlug", editingPost.slug);
    }
    formData.set("excerpt", excerpt.trim());
    formData.set("body", content.trim());
    formData.set("featured", featured ? "true" : "false");
    formData.set("published", published ? "true" : "false");
    await saveBlogPostAction(formData);

    const updatedPost: BlogPost = {
      slug: generatedSlug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim().split(/\n+/).filter(Boolean),
      featured,
      published,
      author: editingPost?.author || "Admin",
      readTime: `${Math.max(1, Math.round(content.trim().split(/\s+/).length / 200))} min read`,
      date: editingPost?.date || new Date().toISOString().slice(0, 10),
    };

    if (editingPost) {
      setPosts((prev) =>
        prev.map((p) => (p.slug === editingPost.slug ? updatedPost : p))
      );
      setStatusMessage({ text: "Changes saved successfully!", type: "success" });
    } else {
      setPosts((prev) => [updatedPost, ...prev.filter((p) => p.slug !== updatedPost.slug)]);
      setStatusMessage({ text: "Post created successfully!", type: "success" });
      resetForm();
    }

    setSaving(false);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (postSlug: string) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) {
      return;
    }
    setDeletingSlug(postSlug);

    const apiUrl = getApiBaseUrl();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_admin_token") || "flowmetrics-admin-session-token" : "";
      await fetch(`${apiUrl}/api/admin/blog/${postSlug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // ignore
    }

    const formData = new FormData();
    formData.set("slug", postSlug);
    await deleteBlogPostAction(formData);

    setPosts((prev) => prev.filter((p) => p.slug !== postSlug));
    if (editingPost?.slug === postSlug) {
      resetForm();
    }
    setDeletingSlug(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Posts List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">Blog Posts</h2>
          <span className="text-xs text-muted">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
        </div>

        {posts.map((post) => (
          <div
            key={post.slug}
            className={`flex items-start justify-between gap-4 rounded-xl border p-4 sm:p-5 transition-colors ${
              editingPost?.slug === post.slug
                ? "border-signal/50 bg-surface shadow-[0_5px_20px_-10px_rgba(67,224,198,0.2)]"
                : "border-line bg-surface"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {post.featured && (
                  <span className="rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-signal uppercase">
                    FEATURED
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    post.published !== false
                      ? "border border-line text-muted"
                      : "border border-danger/30 bg-danger/10 text-danger"
                  }`}
                >
                  {post.published !== false ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-text truncate">{post.title}</p>
              <p className="mt-1 font-data text-xs text-muted truncate">
                slug: /{post.slug} &middot; {post.readTime}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => startEdit(post)}
                className="rounded-md border border-line bg-ink px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-signal/50 hover:text-signal"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(post.slug)}
                disabled={deletingSlug === post.slug}
                className="rounded-md border border-line bg-ink px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50"
              >
                {deletingSlug === post.slug ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <p className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">
            No posts found. Use the form to create your first post.
          </p>
        )}
      </div>

      {/* Unified Post Editor Form */}
      <form
        onSubmit={handleSubmit}
        className="flex h-fit flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">
            {editingPost ? "Edit Post" : "Create New Post"}
          </h2>
          {editingPost && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-muted hover:text-signal transition-colors"
            >
              + Switch to New Post
            </button>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. How to Spot an Overloaded Team Before It Slows Down"
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="how-to-spot-an-overloaded-team"
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor="excerpt">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            required
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary displayed on blog cards"
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor="body">
            Markdown Content
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write markdown article content (paragraphs separated by blank lines)..."
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text outline-none focus:border-signal font-sans"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-line bg-ink text-signal focus:ring-signal"
            />
            Featured post
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-line bg-ink text-signal focus:ring-signal"
            />
            Published
          </label>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : editingPost ? "Save Changes" : "Create Post"}
          </Button>
          {statusMessage && (
            <span className="text-xs font-medium text-signal">
              {statusMessage.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
