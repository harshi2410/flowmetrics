import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { query, pool } from "../db";
import { features, pricingPlans, testimonials, blogPosts } from "../data";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@flowmetrics.io";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "flowmetrics2026";

/**
 * Initialize PostgreSQL tables using the schema.sql DDL script.
 */
export async function initializeDatabase() {
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Initializing PostgreSQL database schema...");
  await pool.query(schemaSql);
  console.log("PostgreSQL schema successfully created.");
}

/**
 * Seed initial database records if not already populated.
 */
export async function seedDatabase() {
  console.log("Seeding PostgreSQL database...");

  // 1. Seed Admin User
  const existingAdmin = await query(
    "SELECT id FROM admin_users WHERE email = $1",
    [DEFAULT_ADMIN_EMAIL]
  );

  if (!existingAdmin.rowCount) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
    await query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)`,
      [DEFAULT_ADMIN_EMAIL, passwordHash, "Flowmetrics Admin", "admin"]
    );
    console.log(`Admin user seeded: ${DEFAULT_ADMIN_EMAIL}`);
  }

  // 2. Seed Pricing Plans
  for (let i = 0; i < pricingPlans.length; i++) {
    const plan = pricingPlans[i];
    await query(
      `INSERT INTO pricing_plans (id, name, tagline, price, period, features, highlighted, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        plan.id,
        plan.name,
        plan.tagline,
        plan.price,
        plan.period,
        JSON.stringify(plan.features),
        plan.highlighted ?? false,
        i,
      ]
    );
  }
  console.log("Pricing plans seeded.");

  // 3. Seed Blog Posts
  for (const post of blogPosts) {
    await query(
      `INSERT INTO blog_posts (slug, title, excerpt, content, author, read_time, featured, published, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO NOTHING`,
      [
        post.slug,
        post.title,
        post.excerpt,
        JSON.stringify(post.content),
        post.author,
        post.readTime,
        post.featured ?? false,
        post.published !== false,
        post.date,
      ]
    );
  }
  console.log("Blog posts seeded.");

  // 4. Seed Features
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const existing = await query("SELECT id FROM features WHERE title = $1", [f.title]);
    if (!existing.rowCount) {
      await query(
        `INSERT INTO features (title, description, sort_order)
         VALUES ($1, $2, $3)`,
        [f.title, f.description, i]
      );
    }
  }
  console.log("Features seeded.");

  // 5. Seed Testimonials
  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    const existing = await query("SELECT id FROM testimonials WHERE name = $1", [t.name]);
    if (!existing.rowCount) {
      await query(
        `INSERT INTO testimonials (name, role, quote, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [t.name, t.role, t.quote, i]
      );
    }
  }
  console.log("Testimonials seeded.");

  // 6. Seed Sample Live Events for Analytics
  const sampleEvents = [
    { name: "checkout_completed", meta: "user_8841 · $84.00", tone: "signal" },
    { name: "signup_started", meta: "user_9213 · web", tone: "muted" },
    { name: "trial_activated", meta: "user_7750 · Growth plan", tone: "signal" },
    { name: "invite_sent", meta: "user_2204 · 3 recipients", tone: "muted" },
    { name: "checkout_completed", meta: "user_5567 · $49.00", tone: "signal" },
  ];

  const existingEvents = await query("SELECT id FROM analytics_events LIMIT 1");
  if (!existingEvents.rowCount) {
    for (const evt of sampleEvents) {
      await query(
        `INSERT INTO analytics_events (name, meta, tone)
         VALUES ($1, $2, $3)`,
        [evt.name, evt.meta, evt.tone]
      );
    }
    console.log("Sample analytics events seeded.");
  }
}

/**
 * Lazy initialization guard: Ensures schema and tables exist.
 */
let dbInitializedPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (dbInitializedPromise) return dbInitializedPromise;

  dbInitializedPromise = (async () => {
    try {
      const check = await query(
        "SELECT to_regclass('public.admin_users') as table_exists"
      );
      if (!check.rows[0]?.table_exists) {
        await initializeDatabase();
        await seedDatabase();
      }
    } catch (err) {
      console.warn("Auto-initialization check:", err);
    }
  })();

  return dbInitializedPromise;
}
