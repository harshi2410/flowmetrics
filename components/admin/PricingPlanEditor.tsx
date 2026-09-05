"use client";

import { useState, useEffect } from "react";
import type { PricingPlan } from "@/lib/data";
import { updatePricingPlanAction } from "@/lib/admin-actions";
import { Button } from "@/components/ui/Button";

export function PricingPlanEditor({ plan }: { plan: PricingPlan }) {
  const [features, setFeatures] = useState<string[]>(plan.features || []);
  const [highlighted, setHighlighted] = useState<boolean>(plan.highlighted ?? false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    setFeatures(plan.features || []);
    setHighlighted(plan.highlighted ?? false);
  }, [plan]);

  const handleAddFeature = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFeatures((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const filteredFeatures = features.map((f) => f.trim()).filter(Boolean);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const payload = {
      name: (formData.get("name") as string) || plan.name,
      price: Number(formData.get("price") ?? plan.price),
      billing_cycle: (formData.get("period") as string) || plan.period || "month",
      description: (formData.get("tagline") as string) || plan.tagline || "",
      features: filteredFeatures.length > 0 ? filteredFeatures : ["Standard features"],
      highlighted: highlighted,
    };

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_admin_token") || "flowmetrics-admin-session-token" : "";
      await fetch(`${apiUrl}/api/admin/pricing/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore
    }

    // Also call server action for Next.js cache revalidation
    formData.set("features", JSON.stringify(filteredFeatures));
    formData.set("highlighted", highlighted ? "true" : "false");
    await updatePricingPlanAction(formData);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col rounded-xl border p-5 sm:p-6 transition-colors ${
        highlighted
          ? "border-signal/50 bg-surface shadow-[0_10px_30px_-15px_rgba(67,224,198,0.2)]"
          : "border-line bg-surface"
      }`}
    >
      <input type="hidden" name="id" value={plan.id} />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{plan.name}</h2>
        {highlighted && (
          <span className="rounded-full bg-signal/15 px-2.5 py-1 text-xs font-medium text-signal">
            Most popular
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-text" htmlFor={`name-${plan.id}`}>
            Plan Name
          </label>
          <input
            id={`name-${plan.id}`}
            name="name"
            type="text"
            required
            defaultValue={plan.name}
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor={`price-${plan.id}`}>
            Price ($)
          </label>
          <input
            id={`price-${plan.id}`}
            name="price"
            type="number"
            min={0}
            required
            defaultValue={plan.price}
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor={`period-${plan.id}`}>
            Billing Cycle
          </label>
          <select
            id={`period-${plan.id}`}
            name="period"
            defaultValue={plan.period || "month"}
            className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
          >
            <option value="month">Monthly (/month)</option>
            <option value="year">Yearly (/year)</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-text" htmlFor={`tagline-${plan.id}`}>
          Description
        </label>
        <input
          id={`tagline-${plan.id}`}
          name="tagline"
          type="text"
          defaultValue={plan.tagline}
          placeholder="For small teams getting started."
          className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
        />
      </div>

      {/* Repeatable Features */}
      <div className="mt-5 border-t border-line/70 pt-4">
        <label className="text-sm font-medium text-text block mb-3">Features</label>

        <div className="flex flex-col gap-2.5">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                placeholder="Feature description"
                className="flex-1 rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
              />
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="shrink-0 rounded-md border border-line bg-ink px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-danger/50 hover:text-danger"
              >
                Remove
              </button>
            </div>
          ))}

          {features.length === 0 && (
            <p className="rounded-md border border-dashed border-line p-3 text-xs text-muted">
              No features added yet. Click &quot;+ Add Feature&quot; below to add one.
            </p>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddFeature}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-ink/60 px-3.5 py-2 text-xs font-medium text-signal hover:border-signal/50 hover:bg-ink transition-colors"
            >
              + Add Feature
            </button>
          </div>
        </div>
      </div>

      {/* Highlight Checkbox */}
      <div className="mt-5 flex items-center gap-2">
        <input
          id={`highlighted-${plan.id}`}
          type="checkbox"
          checked={highlighted}
          onChange={(e) => setHighlighted(e.target.checked)}
          className="h-4 w-4 rounded border-line bg-ink text-signal focus:ring-signal"
        />
        <label
          htmlFor={`highlighted-${plan.id}`}
          className="cursor-pointer text-sm font-medium text-text"
        >
          Highlight this plan (Most popular)
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <span className="text-xs font-medium text-signal">Saved successfully!</span>}
      </div>
    </form>
  );
}
