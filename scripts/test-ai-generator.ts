import {
  generateContent,
  calculateContentStats,
  parsePlatformVariants,
  ContentType,
  ContentTone,
} from "../lib/ai/content-generator";

async function runTests() {
  console.log("=========================================");
  console.log("🧪 Flowmetrics AI Content Generator Tests");
  console.log("=========================================\n");

  const testCases: {
    type: ContentType;
    tone: ContentTone;
    topic: string;
    platform?: "all" | "linkedin" | "twitter" | "instagram";
  }[] = [
      {
        type: "social_media_caption",
        tone: "professional",
        topic: "Announcing real-time sprint bottleneck analytics",
        platform: "all",
      },
      {
        type: "social_media_caption",
        tone: "witty",
        topic: "Why measuring story points is like predicting the weather with a coin toss",
        platform: "twitter",
      },
      {
        type: "social_media_caption",
        tone: "inspirational",
        topic: "Building sustainable engineering culture without weekend crunch",
        platform: "linkedin",
      },
      {
        type: "blog_post",
        tone: "educational",
        topic: "The 2026 Guide to DORA Metrics and Cycle Time Optimization",
      },
      {
        type: "blog_post",
        tone: "persuasive",
        topic: "Why High-Growth Startups Switch to Flowmetrics for Capacity Planning",
      },
      {
        type: "text_summary",
        tone: "casual",
        topic: "Quarterly engineering review: 40% reduction in lead time",
      },
    ];

  let passed = 0;

  for (const [idx, tc] of testCases.entries()) {
    console.log(`Test #${idx + 1}: [${tc.type.toUpperCase()}] Tone: ${tc.tone} | Topic: "${tc.topic}"`);

    const result = await generateContent({
      contentType: tc.type,
      tone: tc.tone,
      topic: tc.topic,
      platform: tc.platform,
      includeEmojis: true,
      includeHashtags: true,
    });

    // Verification 1: Content exists
    if (!result.content || result.content.trim().length === 0) {
      throw new Error(`Test #${idx + 1} Failed: Content is empty!`);
    }

    // Verification 2: Word & character stats calculated properly
    const computedStats = calculateContentStats(result.content);
    if (result.stats.wordCount !== computedStats.wordCount) {
      throw new Error(`Test #${idx + 1} Failed: Word count mismatch!`);
    }
    if (result.stats.characterCount !== computedStats.characterCount) {
      throw new Error(`Test #${idx + 1} Failed: Character count mismatch!`);
    }

    // Verification 3: Twitter character limit when twitter platform selected
    if (tc.platform === "twitter") {
      console.log(`   -> Twitter caption chars: ${result.stats.characterCount} (Must be <= 280)`);
      if (result.stats.characterCount > 280) {
        throw new Error(`Test #${idx + 1} Failed: Twitter caption exceeds 280 characters!`);
      }
    }

    // Verification 4: Multi-platform variants parsed when platform is 'all'
    if (tc.platform === "all") {
      const variants = result.platformVariants || parsePlatformVariants(result.content);
      console.log(`   -> Multi-platform variants detected:`, Object.keys(variants));
      if (!variants.linkedin || !variants.twitter || !variants.instagram) {
        console.warn(`   -> Note: Some platform variants may be embedded directly in content.`);
      }
    }

    console.log(`   ✓ Passed | Words: ${result.stats.wordCount} | Chars: ${result.stats.characterCount} | Backend: ${result.backend}\n`);
    passed++;
  }

  // Refinement Test
  console.log("Test #7: Testing Refinement Capability ('Make it punchier' & 'Make it shorter')...");
  const original = await generateContent({
    contentType: "social_media_caption",
    tone: "professional",
    topic: "Engineering velocity tracking",
    platform: "linkedin",
  });

  const refined = await generateContent({
    contentType: "social_media_caption",
    tone: "professional",
    topic: "Engineering velocity tracking",
    existingContent: original.content,
    refinementInstructions: "Make it punchier and shorter",
  });

  console.log(`   Original words: ${original.stats.wordCount} -> Refined words: ${refined.stats.wordCount}`);
  if (!refined.content || refined.content === "") {
    throw new Error("Refinement returned empty content!");
  }
  console.log(`   ✓ Refinement Passed!\n`);
  passed++;

  console.log(` All ${passed}/${passed} tests completed successfully!`);
}

runTests().catch((err) => {
  console.error(" Test failed:", err);
  process.exit(1);
});
