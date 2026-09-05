import { config } from "dotenv";
config();

import { initializeDatabase, seedDatabase } from "../lib/db/init-db";
import { pool } from "../lib/db";

async function main() {
  try {
    await initializeDatabase();
    await seedDatabase();
    console.log("Database initialized and seeded successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
