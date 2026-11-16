import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool.js";

function findMigrationsDir(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), "sql", "migrations"),
    path.resolve(process.cwd(), "backend", "sql", "migrations"),
    path.resolve(process.cwd(), "dist", "sql", "migrations"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function findSqlFile(fileName: string): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), "sql", fileName),
    path.resolve(process.cwd(), "backend", "sql", fileName),
    path.resolve(process.cwd(), "dist", "sql", fileName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function initializeDatabase() {
  try {
    console.log("Checking and executing PostgreSQL schema migrations...");

    // 1. Ensure migrations ledger exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Discover and run migrations in order
    const migrationsDir = findMigrationsDir();
    if (migrationsDir && fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

      for (const file of files) {
        const migrationName = file.replace(/\.sql$/, "");
        const check = await pool.query(
          "SELECT id FROM schema_migrations WHERE name = $1",
          [migrationName]
        );

        if (check.rowCount === 0) {
          console.log(`Running migration: ${file}...`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
          await pool.query(sql);
          await pool.query(
            "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
            [migrationName]
          );
          console.log(`✓ Migration ${file} successfully applied.`);
        }
      }
    }

    // 3. Fallback to schema.sql if migrations folder is absent
    const schemaPath = findSqlFile("schema.sql");
    const seedPath = findSqlFile("seed.sql");

    if (schemaPath && fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf-8");
      await pool.query(schemaSql);
    }

    // 4. Seed initial records if empty
    const checkPricing = await pool.query("SELECT COUNT(*) FROM pricing_plans");
    if (Number(checkPricing.rows[0]?.count || 0) === 0 && seedPath && fs.existsSync(seedPath)) {
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
  initializeDatabase()
    .then(() => {
      console.log("Database setup process complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database setup failed:", err);
      process.exit(1);
    });
}
