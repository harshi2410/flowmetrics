import { query } from "../db";
import { ensureDbInitialized } from "../db/init-db";
import { pricingPlans as defaultPricingPlans, type PricingPlan } from "../data";

type PricingPlanRow = {
  id: string;
  name: string;
  tagline: string;
  price: number | string;
  period?: string;
  features: unknown;
  highlighted?: boolean;
  sort_order?: number;
};

const memoryPlans: PricingPlan[] = defaultPricingPlans.map((p) => ({
  ...p,
  features: [...p.features],
}));

function mapRowToPlan(row: PricingPlanRow): PricingPlan {
  let features: string[] = [];
  if (Array.isArray(row.features)) {
    features = row.features as string[];
  } else if (typeof row.features === "string") {
    try {
      features = JSON.parse(row.features);
    } catch {
      features = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    price: Number(row.price),
    period: (row.period as "month" | "year") || "month",
    features,
    highlighted: Boolean(row.highlighted),
  };
}

/**
 * Fetch all pricing plans from PostgreSQL or fallback store.
 */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    await ensureDbInitialized();

    const res = await query<PricingPlanRow>(
      `SELECT id, name, tagline, price, period, features, highlighted, sort_order
       FROM pricing_plans
       ORDER BY sort_order ASC, name ASC`
    );

    if (res.rowCount && res.rowCount > 0) {
      return res.rows.map(mapRowToPlan);
    }
    return memoryPlans;
  } catch {
    return memoryPlans;
  }
}

/**
 * Fetch a single pricing plan by its identifier.
 */
export async function getPricingPlanById(id: string): Promise<PricingPlan | null> {
  try {
    await ensureDbInitialized();

    const res = await query<PricingPlanRow>(
      `SELECT id, name, tagline, price, period, features, highlighted, sort_order
       FROM pricing_plans
       WHERE id = $1`,
      [id]
    );

    if (!res.rowCount) {
      return memoryPlans.find((p) => p.id === id) ?? null;
    }
    return mapRowToPlan(res.rows[0]);
  } catch {
    return memoryPlans.find((p) => p.id === id) ?? null;
  }
}

/**
 * Update a pricing plan in PostgreSQL and fallback store.
 */
export async function updatePricingPlan(
  id: string,
  updates: Partial<Omit<PricingPlan, "id">>
): Promise<PricingPlan | null> {
  const current = await getPricingPlanById(id);
  if (!current) return null;

  const newName = updates.name !== undefined ? updates.name : current.name;
  const newPrice = updates.price !== undefined ? Number(updates.price) : current.price;
  const newPeriod = (updates.period as "month" | "year") || current.period || "month";
  const newTagline = updates.tagline !== undefined ? updates.tagline : current.tagline;
  const newFeatures = updates.features !== undefined ? updates.features : current.features;
  const newHighlighted = updates.highlighted !== undefined ? updates.highlighted : current.highlighted;

  // Update memory fallback
  const memIdx = memoryPlans.findIndex((p) => p.id === id);
  if (memIdx !== -1) {
    memoryPlans[memIdx] = {
      ...memoryPlans[memIdx],
      name: newName,
      price: newPrice,
      period: newPeriod,
      tagline: newTagline,
      features: newFeatures,
      highlighted: newHighlighted,
    };
  }

  try {
    await ensureDbInitialized();

    const res = await query<PricingPlanRow>(
      `UPDATE pricing_plans
       SET name = $1, price = $2, period = $3, tagline = $4, features = $5::jsonb, highlighted = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, tagline, price, period, features, highlighted, sort_order`,
      [
        newName,
        newPrice,
        newPeriod,
        newTagline,
        JSON.stringify(newFeatures),
        newHighlighted,
        id,
      ]
    );

    if (res.rowCount && res.rowCount > 0) {
      return mapRowToPlan(res.rows[0]);
    }
  } catch {
    // Return updated memory object
  }

  return memoryPlans.find((p) => p.id === id) ?? null;
}
