"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { updatePricingPlan } from "@/lib/services/pricing.service";
import { saveBlogPost, deleteBlogPost } from "@/lib/services/blog.service";

const UpdatePricingSchema = z.object({
  id: z.string().min(1, "Plan ID is required"),
  name: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  period: z.enum(["month", "year"]).optional().default("month"),
  tagline: z.string().optional().default(""),
  features: z.string().optional(),
  highlighted: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional().default(false),
});

const SaveBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  originalSlug: z.string().optional(),
  excerpt: z.string().min(1, "Excerpt is required"),
  body: z.string().min(1, "Body content is required"),
  featured: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional().default(false),
  published: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional().default(true),
});

const DeleteBlogPostSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export async function updatePricingPlanAction(formData: FormData) {
  await requireAuth();

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    price: formData.get("price"),
    period: formData.get("period"),
    tagline: formData.get("tagline"),
    features: formData.get("features"),
    highlighted: formData.get("highlighted"),
  };

  const parsed = UpdatePricingSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Invalid pricing plan update data:", parsed.error);
    return;
  }

  const { id, name, price, period, tagline, features: rawFeatures, highlighted } = parsed.data;

  let parsedFeatures: string[] | undefined = undefined;
  if (rawFeatures) {
    try {
      parsedFeatures = JSON.parse(rawFeatures);
    } catch {
      parsedFeatures = undefined;
    }
  }

  await updatePricingPlan(id, {
    name,
    price,
    period,
    tagline,
    features: parsedFeatures,
    highlighted,
  });

  revalidatePath("/");
  revalidatePath("/admin/pricing");
  revalidatePath("/admin");
}

export async function saveBlogPostAction(formData: FormData) {
  const admin = await requireAuth();

  const rawData = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    originalSlug: formData.get("originalSlug") || undefined,
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    featured: formData.get("featured"),
    published: formData.get("published"),
  };

  const parsed = SaveBlogPostSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Invalid blog post data:", parsed.error);
    return;
  }

  const { title, slug, originalSlug, excerpt, body, featured, published } = parsed.data;

  await saveBlogPost({
    title,
    slug,
    originalSlug,
    excerpt,
    body,
    featured,
    published,
    author: admin.name || "Admin",
  });

  revalidatePath("/");
  revalidatePath("/admin/blog");
  revalidatePath("/admin");
  revalidatePath("/blog/[slug]", "page");
}

export async function addBlogPostAction(formData: FormData) {
  return saveBlogPostAction(formData);
}

export async function deleteBlogPostAction(formData: FormData) {
  await requireAuth();

  const rawData = {
    slug: formData.get("slug"),
  };

  const parsed = DeleteBlogPostSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Invalid delete blog post data:", parsed.error);
    return;
  }

  await deleteBlogPost(parsed.data.slug);

  revalidatePath("/");
  revalidatePath("/admin/blog");
  revalidatePath("/admin");
  revalidatePath("/blog/[slug]", "page");
}
