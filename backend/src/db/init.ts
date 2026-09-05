import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool.js";

export async function initializeDatabase() {
  try {
    const schemaPath = path.resolve(process.cwd(), "sql", "schema.sql");
    const seedPath = path.resolve(process.cwd(), "sql", "seed.sql");

    console.log("Checking and executing PostgreSQL schema...");
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf-8");
      await pool.query(schemaSql);
      console.log("PostgreSQL schema successfully initialized.");
    }

    const checkPricing = await pool.query("SELECT COUNT(*) FROM pricing_plans");
    if (Number(checkPricing.rows[0]?.count || 0) === 0 && fs.existsSync(seedPath)) {
      console.log("Seeding initial database records...");
      const seedSql = fs.readFileSync(seedPath, "utf-8");
      await pool.query(seedSql);
      console.log("PostgreSQL database successfully seeded.");
    }
  } catch (error) {
    console.warn("Database initialization warning (using existing or offline fallback):", (error as Error).message);
  }
}

// Auto-run if executed directly as script
if (process.argv[1]?.includes("init.ts") || process.argv[1]?.includes("init.js")) {
  initializeDatabase().then(() => {
    console.log("Database setup process complete.");
    process.exit(0);
  }).catch((err) => {
    console.error("Database setup failed:", err);
    process.exit(1);
  });
}
