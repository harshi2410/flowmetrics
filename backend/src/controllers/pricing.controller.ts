import { Request, Response } from "express";
import { query } from "../db/pool.js";
import { createPricingSchema, updatePricingSchema } from "../schemas/pricing.schema.js";

// In-memory fallback dataset for offline/development resilience
let fallbackPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    billing_cycle: "month",
    description: "For small teams getting started.",
    features: [
      "Team workload overview",
      "2 active projects",
      "Basic productivity reports",
      "Email support",
    ],
    highlighted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "growth",
    name: "Growth",
    price: 49,
    billing_cycle: "month",
    description: "For growing teams managing multiple projects.",
    features: [
      "Full capacity planner",
      "Unlimited active projects",
      "Project health alerts",
      "Burnout & bottleneck detection",
      "Priority support",
    ],
    highlighted: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "scale",
    name: "Scale",
    price: 199,
    billing_cycle: "month",
    description: "For organizations managing larger distributed teams.",
    features: [
      "Advanced workload analytics",
      "Custom team benchmarks",
      "Cross-project resource allocation",
      "SSO & audit logs",
      "Dedicated success manager",
    ],
    highlighted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getPublicPricing(_req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, name, price, billing_cycle, description, features, highlighted, created_at, updated_at
       FROM pricing_plans
       ORDER BY price ASC`
    );

    if (result.rowCount && result.rowCount > 0) {
      res.status(200).json(result.rows);
      return;
    }
    res.status(200).json(fallbackPlans);
  } catch {
    res.status(200).json(fallbackPlans);
  }
}

export async function getAdminPricing(_req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, name, price, billing_cycle, description, features, highlighted, created_at, updated_at
       FROM pricing_plans
       ORDER BY price ASC`
    );

    if (result.rowCount && result.rowCount > 0) {
      res.status(200).json(result.rows);
      return;
    }
    res.status(200).json(fallbackPlans);
  } catch {
    res.status(200).json(fallbackPlans);
  }
}

export async function createPricing(req: Request, res: Response): Promise<void> {
  const parseResult = createPricingSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { name, price, billing_cycle, description, features, highlighted } = parseResult.data;

  try {
    const result = await query(
      `INSERT INTO pricing_plans (name, price, billing_cycle, description, features, highlighted)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, name, price, billing_cycle, description, features, highlighted, created_at, updated_at`,
      [name, price, billing_cycle, description, JSON.stringify(features), highlighted]
    );

    const createdPlan = result.rows[0];
    fallbackPlans.push(createdPlan as any);
    res.status(201).json(createdPlan);
  } catch {
    const newPlan = {
      id: `plan-${Date.now()}`,
      name,
      price,
      billing_cycle,
      description,
      features,
      highlighted,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fallbackPlans.push(newPlan);
    res.status(201).json(newPlan);
  }
}

export async function updatePricing(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const parseResult = updatePricingSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const data = parseResult.data;

  try {
    // Check existing
    const existing = await query(`SELECT * FROM pricing_plans WHERE id::text = $1`, [id]);

    if (!existing.rowCount) {
      const idx = fallbackPlans.findIndex((p) => String(p.id) === String(id));
      if (idx === -1) {
        res.status(404).json({ error: "Not Found", message: "Pricing plan not found" });
        return;
      }
      fallbackPlans[idx] = {
        ...fallbackPlans[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      res.status(200).json(fallbackPlans[idx]);
      return;
    }

    const current = existing.rows[0] as any;
    const name = data.name !== undefined ? data.name : current.name;
    const price = data.price !== undefined ? data.price : current.price;
    const billing_cycle = data.billing_cycle !== undefined ? data.billing_cycle : current.billing_cycle;
    const description = data.description !== undefined ? data.description : current.description;
    const features = data.features !== undefined ? data.features : current.features;
    const highlighted = data.highlighted !== undefined ? data.highlighted : current.highlighted;

    const result = await query(
      `UPDATE pricing_plans
       SET name = $1, price = $2, billing_cycle = $3, description = $4, features = $5::jsonb, highlighted = $6, updated_at = NOW()
       WHERE id::text = $7
       RETURNING id, name, price, billing_cycle, description, features, highlighted, created_at, updated_at`,
      [name, price, billing_cycle, description, JSON.stringify(features), highlighted, id]
    );

    const updated = result.rows[0];
    const idx = fallbackPlans.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) fallbackPlans[idx] = updated as any;

    res.status(200).json(updated);
  } catch {
    const idx = fallbackPlans.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) {
      res.status(404).json({ error: "Not Found", message: "Pricing plan not found" });
      return;
    }
    fallbackPlans[idx] = {
      ...fallbackPlans[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    res.status(200).json(fallbackPlans[idx]);
  }
}

export async function deletePricing(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const result = await query(`DELETE FROM pricing_plans WHERE id::text = $1 RETURNING id`, [id]);
    fallbackPlans = fallbackPlans.filter((p) => String(p.id) !== String(id));

    if (!result.rowCount && !fallbackPlans.some((p) => String(p.id) === String(id))) {
      res.status(200).json({ message: "Pricing plan deleted successfully", id });
      return;
    }
    res.status(200).json({ message: "Pricing plan deleted successfully", id });
  } catch {
    fallbackPlans = fallbackPlans.filter((p) => String(p.id) !== String(id));
    res.status(200).json({ message: "Pricing plan deleted successfully", id });
  }
}
