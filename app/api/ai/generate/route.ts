import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateContent,
  ContentType,
  ContentTone,
  SocialPlatform,
  ContentLength,
} from "@/lib/ai/content-generator";

const GenerateContentSchema = z.object({
  contentType: z.enum(["blog_post", "social_media_caption", "text_summary"], {
    message: "Content type must be blog_post, social_media_caption, or text_summary",
  }),
  topic: z
    .string()
    .min(3, "Topic or prompt must be at least 3 characters long")
    .max(2000, "Topic must not exceed 2,000 characters"),
  tone: z.enum(
    ["professional", "casual", "witty", "persuasive", "educational", "inspirational"],
    {
      message: "Please select a valid tone",
    }
  ),
  platform: z.enum(["all", "linkedin", "twitter", "instagram"]).optional().default("all"),
  length: z.enum(["short", "medium", "long"]).optional().default("medium"),
  includeHashtags: z.boolean().optional().default(true),
  includeEmojis: z.boolean().optional().default(true),
  targetAudience: z.string().max(200).optional(),
  keywords: z.string().max(200).optional(),
  existingContent: z.string().max(10000).optional(),
  refinementInstructions: z.string().max(1000).optional(),
  apiKey: z.string().max(300).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = GenerateContentSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return NextResponse.json(
        {
          error: issue?.message || "Invalid input parameters",
          details: validation.error.issues,
        },
        { status: 422 }
      );
    }

    const input = validation.data;

    const result = await generateContent({
      contentType: input.contentType as ContentType,
      topic: input.topic,
      tone: input.tone as ContentTone,
      platform: input.platform as SocialPlatform,
      length: input.length as ContentLength,
      includeHashtags: input.includeHashtags,
      includeEmojis: input.includeEmojis,
      targetAudience: input.targetAudience,
      keywords: input.keywords,
      existingContent: input.existingContent,
      refinementInstructions: input.refinementInstructions,
      apiKey: input.apiKey,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/ai/generate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate content. Please try again.",
        message: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
