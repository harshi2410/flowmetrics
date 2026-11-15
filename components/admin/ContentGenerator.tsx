"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type {
  ContentType,
  ContentTone,
  SocialPlatform,
  ContentLength,
  GeneratedContentResult,
} from "@/lib/ai/content-generator";

const PROMPT_SUGGESTIONS: Record<ContentType, string[]> = {
  social_media_caption: [
    "Announcing our new automated sprint velocity & workload forecasting feature",
    "Why engineering burnout is the #1 silent killer of startup momentum",
    "5 lessons learned scaling our SaaS team without adding middle management",
    "Stop measuring developer hours. Start measuring flow efficiency",
  ],
  blog_post: [
    "How to Spot an Overloaded Engineering Team Before It Slows Down",
    "The 2026 Guide to SaaS Flow Metrics: Lead Time, Cycle Time, and PR Velocity",
    "Why 10x Engineers Prioritize Team Velocity Over Solo Heroics",
    "Decoupling Modern Web Architecture: Next.js App Router and Distributed Systems",
  ],
  text_summary: [
    "Flowmetrics Q4 Product Vision and Engineering Velocity Roadmap",
    "Executive Brief: Resolving Bottlenecks in Asynchronous Remote Teams",
    "Key Takeaways: High-Output Management Principles for Tech Leads",
  ],
};

const TONE_OPTIONS: { value: ContentTone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Authoritative & executive-ready" },
  { value: "casual", label: "Casual", desc: "Friendly, warm & conversational" },
  { value: "witty", label: "Witty & Sharp", desc: "Clever, engaging & memorable" },
  { value: "persuasive", label: "Persuasive", desc: "Benefit-driven & conversion-focused" },
  { value: "educational", label: "Educational", desc: "Step-by-step & instructive" },
  { value: "inspirational", label: "Inspirational", desc: "Visionary & motivating" },
];

export function ContentGenerator() {
  const router = useRouter();

  // Form State
  const [contentType, setContentType] = useState<ContentType>("social_media_caption");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<ContentTone>("professional");
  const [platform, setPlatform] = useState<SocialPlatform>("all");
  const [length, setLength] = useState<ContentLength>("medium");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [targetAudience, setTargetAudience] = useState("");
  const [keywords, setKeywords] = useState("");

  // BYOK (Bring Your Own Key) or Settings
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Status & Output State
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [customRefinePrompt, setCustomRefinePrompt] = useState("");
  const [showCustomRefine, setShowCustomRefine] = useState(false);
  const [result, setResult] = useState<GeneratedContentResult | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<"all" | "linkedin" | "twitter" | "instagram">("all");
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generation History
  const [history, setHistory] = useState<GeneratedContentResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load API key and history from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("flowmetrics_ai_api_key");
      if (savedKey) setApiKey(savedKey);

      const savedHistory = localStorage.getItem("flowmetrics_content_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem("flowmetrics_ai_api_key", key.trim());
      } else {
        localStorage.removeItem("flowmetrics_ai_api_key");
      }
    } catch {
      // ignore
    }
    setShowKeyModal(false);
  };

  const handleSaveToHistory = (item: GeneratedContentResult) => {
    try {
      const updated = [item, ...history.filter((h) => h.generatedAt !== item.generatedAt)].slice(0, 15);
      setHistory(updated);
      localStorage.setItem("flowmetrics_content_history", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleGenerate = async (customExisting?: string, customInstructions?: string) => {
    if (!topic.trim()) {
      setErrorMessage("Please enter a topic or prompt to generate content.");
      return;
    }

    setErrorMessage(null);
    if (customInstructions) {
      setRefining(true);
    } else {
      setLoading(true);
    }

    try {
      const payload = {
        contentType,
        topic: topic.trim(),
        tone,
        platform: contentType === "social_media_caption" ? platform : undefined,
        length: contentType === "blog_post" ? length : undefined,
        includeHashtags,
        includeEmojis,
        targetAudience: targetAudience.trim() || undefined,
        keywords: keywords.trim() || undefined,
        existingContent: customExisting,
        refinementInstructions: customInstructions,
        apiKey: apiKey.trim() || undefined,
      };

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to generate content.");
      }

      const generated: GeneratedContentResult = json.data;
      setResult(generated);
      handleSaveToHistory(generated);

      if (contentType === "social_media_caption" && platform !== "all") {
        setActivePlatformTab(platform);
      } else {
        setActivePlatformTab("all");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
      setRefining(false);
      setShowCustomRefine(false);
      setCustomRefinePrompt("");
    }
  };

  const handleCopy = async (textToCopy?: string) => {
    const text = textToCopy || getCurrentDisplayText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCurrentDisplayText = (): string => {
    if (!result) return "";
    if (contentType === "social_media_caption" && result.platformVariants) {
      if (activePlatformTab === "linkedin" && result.platformVariants.linkedin) {
        return result.platformVariants.linkedin;
      }
      if (activePlatformTab === "twitter" && result.platformVariants.twitter) {
        return result.platformVariants.twitter;
      }
      if (activePlatformTab === "instagram" && result.platformVariants.instagram) {
        return result.platformVariants.instagram;
      }
    }
    return result.content;
  };

  const currentDisplayText = getCurrentDisplayText();
  const currentChars = currentDisplayText.length;
  const currentWords = currentDisplayText.trim() ? currentDisplayText.trim().split(/\s+/).length : 0;
  const currentReadingTime = Math.max(1, Math.ceil(currentWords / 200));

  const handleTransferToBlog = () => {
    if (!result) return;
    try {
      // Store in sessionStorage for blog editor pickup
      const draft = {
        title: result.title || topic,
        excerpt: result.excerpt || topic,
        content: result.content,
      };
      sessionStorage.setItem("flowmetrics_ai_blog_draft", JSON.stringify(draft));
      router.push("/admin/blog?import=ai");
    } catch {
      router.push("/admin/blog");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & AI Engine Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-signal animate-pulse" />
            <span className="font-display font-semibold text-text">AI Content Studio</span>
            <span className="rounded-full bg-signal/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-signal uppercase tracking-wider">
              Dual Engine
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Generate high-converting blog posts, multi-platform social media captions, and executive summaries in seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-line bg-ink px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-signal/50"
          >
            <span>⚙️</span>
            <span>{apiKey ? "API Key: Configured" : "AI Settings (BYOK)"}</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 rounded-md border border-line bg-ink px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-signal/50"
            >
              <span>🕒</span>
              <span>History ({history.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Input Form vs Output Display */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.25fr]">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="font-display text-base font-semibold text-text">1. Content Configuration</h2>
            <span className="text-xs text-muted">Customize prompt & tone</span>
          </div>

          {/* Content Type Selector */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted">
              Content Type
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { type: "social_media_caption" as ContentType, label: "Social Caption", icon: "📱" },
                { type: "blog_post" as ContentType, label: "Blog Post", icon: "✍️" },
                { type: "text_summary" as ContentType, label: "Summary", icon: "📋" },
              ].map((item) => {
                const active = contentType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setContentType(item.type);
                      setErrorMessage(null);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                      active
                        ? "border-signal bg-signal/10 text-signal font-semibold shadow-[0_0_15px_-3px_rgba(67,224,198,0.2)]"
                        : "border-line bg-ink/50 text-muted hover:border-line hover:text-text"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="mt-1 text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic / Prompt Input */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="topic-input" className="text-xs font-medium uppercase tracking-wider text-muted">
                Topic or Prompt <span className="text-signal">*</span>
              </label>
              <span className="text-[11px] text-muted">{topic.length} / 1,000</span>
            </div>
            <textarea
              id="topic-input"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                contentType === "social_media_caption"
                  ? "e.g. Announcing our new engineering workload & sprint velocity metrics..."
                  : contentType === "blog_post"
                  ? "e.g. How to Spot an Overloaded Team Before It Slows Down..."
                  : "e.g. Executive brief on our sprint delivery turnaround..."
              }
              className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2.5 text-sm text-text placeholder-muted/60 outline-none transition-colors focus:border-signal"
            />

            {/* Quick Suggestions Chips */}
            <div className="mt-2.5">
              <span className="text-[11px] font-medium text-muted">Quick ideas:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS[contentType].slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(prompt)}
                    className="rounded-full border border-line/80 bg-ink px-2.5 py-1 text-left text-[11px] text-muted transition-colors hover:border-signal/50 hover:text-signal truncate max-w-full"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label htmlFor="tone-select" className="text-xs font-medium uppercase tracking-wider text-muted">
              Tone of Voice
            </label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TONE_OPTIONS.map((item) => {
                const active = tone === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTone(item.value)}
                    className={`rounded-md border p-2 text-left transition-all ${
                      active
                        ? "border-signal/80 bg-signal/10 text-signal font-medium"
                        : "border-line bg-ink text-muted hover:text-text"
                    }`}
                  >
                    <div className="text-xs font-medium">{item.label}</div>
                    <div className="mt-0.5 text-[10px] text-muted line-clamp-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Options for Social Media */}
          {contentType === "social_media_caption" && (
            <div className="rounded-lg border border-line/60 bg-ink/40 p-3.5 space-y-3">
              <div className="text-xs font-semibold text-text">Social Media Specifics</div>

              <div>
                <label className="text-[11px] text-muted">Target Platform</label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {[
                    { id: "all" as SocialPlatform, label: "All (3-in-1)" },
                    { id: "linkedin" as SocialPlatform, label: "LinkedIn" },
                    { id: "twitter" as SocialPlatform, label: "Twitter / X" },
                    { id: "instagram" as SocialPlatform, label: "Instagram" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        platform === p.id
                          ? "bg-signal text-ink font-semibold"
                          : "border border-line bg-surface text-muted hover:text-text"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-line bg-ink text-signal focus:ring-signal"
                  />
                  <span>Include Hashtags</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmojis}
                    onChange={(e) => setIncludeEmojis(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-line bg-ink text-signal focus:ring-signal"
                  />
                  <span>Include Emojis</span>
                </label>
              </div>
            </div>
          )}

          {/* Contextual Options for Blog Post */}
          {contentType === "blog_post" && (
            <div className="rounded-lg border border-line/60 bg-ink/40 p-3.5 space-y-3">
              <div className="text-xs font-semibold text-text">Article Specifics</div>

              <div>
                <label className="text-[11px] text-muted">Article Depth & Length</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { id: "short" as ContentLength, label: "Short (~500w)", sub: "Quick read" },
                    { id: "medium" as ContentLength, label: "Medium (~800w)", sub: "Standard guide" },
                    { id: "long" as ContentLength, label: "In-Depth (~1,400w)", sub: "Comprehensive" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLength(l.id)}
                      className={`rounded border p-2 text-center text-xs transition-colors ${
                        length === l.id
                          ? "border-signal bg-signal/15 text-signal font-medium"
                          : "border-line bg-surface text-muted hover:text-text"
                      }`}
                    >
                      <div className="font-medium">{l.label}</div>
                      <div className="text-[10px] text-muted">{l.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-muted">Target Audience (Optional)</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Engineering VPs, CTOs"
                    className="mt-1 w-full rounded border border-line bg-ink px-2.5 py-1.5 text-xs text-text outline-none focus:border-signal"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted">Focus Keywords (Optional)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. flow metrics, cycle time"
                    className="mt-1 w-full rounded border border-line bg-ink px-2.5 py-1.5 text-xs text-text outline-none focus:border-signal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-xs text-danger flex items-start justify-between">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-danger hover:underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              size="md"
              className="w-full"
              disabled={loading || !topic.trim()}
              onClick={() => handleGenerate()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                  Generating Content…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>✨</span>
                  <span>
                    Generate{" "}
                    {contentType === "social_media_caption"
                      ? "Social Captions"
                      : contentType === "blog_post"
                      ? "Blog Post"
                      : "Summary"}
                  </span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Generated Output & Refinements */}
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6 min-h-[500px]">
          {/* Output Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-text">2. Generated Output</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {result && (
                  <>
                    <span className="rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[11px] font-medium text-signal">
                      {currentWords} words
                    </span>
                    <span className="rounded-full border border-line bg-ink px-2 py-0.5 font-mono text-[11px] text-muted">
                      {currentChars} characters
                    </span>
                    <span className="rounded-full border border-line bg-ink px-2 py-0.5 font-mono text-[11px] text-muted">
                      ~{currentReadingTime} min read
                    </span>
                    {/* Twitter limit indicator */}
                    {activePlatformTab === "twitter" && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                          currentChars <= 280
                            ? "bg-signal/20 text-signal"
                            : "bg-danger/20 text-danger"
                        }`}
                      >
                        {currentChars} / 280 chars {currentChars > 280 ? "(Over limit!)" : "✓"}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            {result && (
              <div className="flex items-center gap-1 rounded-md border border-line bg-ink p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === "preview" ? "bg-signal text-ink" : "text-muted hover:text-text"
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === "raw" ? "bg-signal text-ink" : "text-muted hover:text-text"
                  }`}
                >
                  Raw Markdown
                </button>
              </div>
            )}
          </div>

          {/* Social Platform Tabs (when multi-platform captions generated) */}
          {result?.contentType === "social_media_caption" && result.platformVariants && (
            <div className="flex items-center gap-1 border-b border-line pb-2 overflow-x-auto">
              {[
                { id: "all" as const, label: "All Platforms", icon: "🌐" },
                { id: "linkedin" as const, label: "LinkedIn", icon: "💼" },
                { id: "twitter" as const, label: "Twitter / X", icon: "🐦" },
                { id: "instagram" as const, label: "Instagram", icon: "📸" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePlatformTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activePlatformTab === tab.id
                      ? "bg-signal/20 text-signal border border-signal/40"
                      : "text-muted hover:bg-ink hover:text-text"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Output Display Body */}
          {result ? (
            <div className="flex-1 flex flex-col justify-between gap-4">
              {viewMode === "preview" ? (
                <div className="flex-1 overflow-y-auto max-h-[500px] rounded-lg border border-line/60 bg-ink/50 p-4 sm:p-5 text-sm text-text leading-relaxed font-sans whitespace-pre-wrap selection:bg-signal/30">
                  {currentDisplayText}
                </div>
              ) : (
                <textarea
                  readOnly
                  rows={16}
                  value={currentDisplayText}
                  className="flex-1 w-full rounded-lg border border-line bg-ink p-4 font-mono text-xs text-text leading-relaxed outline-none resize-none"
                />
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy()}
                    className="flex items-center gap-1.5 rounded-md border border-line bg-ink px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-signal/50 hover:text-signal"
                  >
                    <span>{copied ? "✓" : "📋"}</span>
                    <span>{copied ? "Copied to Clipboard!" : "Copy Text"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || refining}
                    onClick={() => handleGenerate()}
                    className="flex items-center gap-1.5 rounded-md border border-line bg-ink px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-signal/50 disabled:opacity-50"
                  >
                    <span>🔄</span>
                    <span>Regenerate</span>
                  </button>

                  {result.contentType === "blog_post" && (
                    <button
                      type="button"
                      onClick={handleTransferToBlog}
                      className="flex items-center gap-1.5 rounded-md border border-signal/50 bg-signal/15 px-3 py-1.5 text-xs font-medium text-signal transition-colors hover:bg-signal/25"
                    >
                      <span>🚀</span>
                      <span>Send to Blog Editor</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <span>Engine:</span>
                  <span className="font-mono text-signal/80">
                    {result.backend === "openai" ? `OpenAI (${result.modelName})` : "Local Heuristic AI"}
                  </span>
                </div>
              </div>

              {/* Refinement Quick Bar */}
              <div className="rounded-lg border border-line/70 bg-ink/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    ⚡ Quick Refine & Iterate
                  </span>
                  {refining && (
                    <span className="text-[11px] font-medium text-signal animate-pulse">
                      Refining output…
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "⚡ Punchier Hook", instruction: "Make the opening hook bolder, punchier, and more curiosity-inducing." },
                    { label: "✂️ Make Shorter", instruction: "Condense the content by 35% without losing core insights." },
                    { label: "📈 Expand Takeaways", instruction: "Add 2 more actionable insights or checkpoints." },
                    { label: "😄 Add More Emojis", instruction: "Add engaging, tasteful emojis throughout the copy." },
                    { label: "💼 More Formal", instruction: "Elevate vocabulary and make it suitable for C-suite executive audience." },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={refining || loading}
                      onClick={() => handleGenerate(currentDisplayText, preset.instruction)}
                      className="rounded border border-line bg-surface px-2.5 py-1 text-xs text-text transition-colors hover:border-signal/50 hover:text-signal disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowCustomRefine(!showCustomRefine)}
                    className="rounded border border-line/60 bg-ink px-2.5 py-1 text-xs text-muted hover:text-text"
                  >
                    ✏️ Custom Prompt…
                  </button>
                </div>

                {/* Custom Refinement Input */}
                {showCustomRefine && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={customRefinePrompt}
                      onChange={(e) => setCustomRefinePrompt(e.target.value)}
                      placeholder="e.g. Add a special mention about our 14-day free trial at the end..."
                      className="flex-1 rounded border border-line bg-ink px-3 py-1.5 text-xs text-text outline-none focus:border-signal"
                    />
                    <Button
                      size="sm"
                      disabled={refining || !customRefinePrompt.trim()}
                      onClick={() => handleGenerate(currentDisplayText, customRefinePrompt.trim())}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-line p-8 text-center">
              <span className="text-4xl mb-3">🪄</span>
              <p className="font-display font-medium text-text">No content generated yet</p>
              <p className="mt-1 max-w-sm text-xs text-muted">
                Configure your topic, select your tone, and choose between a Blog Post, Social Media Caption, or Summary on the left.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTopic("5 SaaS metrics every high-performing engineering team tracks");
                    setContentType("social_media_caption");
                    setTone("professional");
                  }}
                  className="rounded-full border border-line bg-ink px-3 py-1 text-xs text-muted hover:border-signal/50 hover:text-signal"
                >
                  Load Example & Try
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer / Modal */}
      {showHistory && (
        <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display text-sm font-semibold text-text">Recent Generations</h3>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-xs text-muted hover:text-text"
            >
              Close ✕
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[350px] overflow-y-auto">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-line bg-ink p-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="uppercase font-semibold text-signal">
                      {item.contentType.replace("_", " ")}
                    </span>
                    <span>{new Date(item.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="mt-1.5 font-medium text-text line-clamp-2">{item.topic}</p>
                  <p className="mt-1 text-muted line-clamp-2">{item.content}</p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-line/40">
                  <span className="text-[10px] text-muted">{item.stats.wordCount} words</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(item);
                        setTopic(item.topic);
                        setContentType(item.contentType);
                        setTone(item.tone);
                        setShowHistory(false);
                      }}
                      className="text-signal hover:underline text-[11px]"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.content)}
                      className="text-muted hover:text-text text-[11px]"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings / BYOK Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-semibold text-text">AI Configuration</h3>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-muted hover:text-text text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              By default, Flowmetrics uses its built-in local Neural Synthesis engine which runs immediately without any credentials.
              If you have an OpenAI API key (or OpenAI-compatible key), you can paste it below to enable live GPT-4o-mini generation.
            </p>

            <div>
              <label htmlFor="openai-key" className="text-xs font-medium text-text">
                OpenAI API Key (Optional)
              </label>
              <input
                id="openai-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2 text-xs text-text outline-none focus:border-signal font-mono"
              />
              <p className="mt-1 text-[11px] text-muted">
                Keys are stored strictly in your browser&apos;s localStorage.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              {apiKey && (
                <button
                  type="button"
                  onClick={() => saveApiKey("")}
                  className="rounded-md border border-line bg-ink px-3 py-1.5 text-xs text-danger hover:bg-danger/10"
                >
                  Clear Key
                </button>
              )}
              <Button size="sm" onClick={() => saveApiKey(apiKey)}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
