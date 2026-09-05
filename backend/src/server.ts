import { app } from "./app.js";
import { initializeDatabase } from "./db/init.js";
import dotenv from "dotenv";
import next from "next";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const dev = process.env.NODE_ENV !== "production";

// Determine repository root directory (where .next and package.json reside)
const rootDir = fs.existsSync(path.resolve(process.cwd(), ".next")) || fs.existsSync(path.resolve(process.cwd(), "app"))
  ? process.cwd()
  : path.resolve(process.cwd(), "..");

const nextApp = (next as unknown as { default?: typeof next })?.default
  ? (next as unknown as { default: typeof next }).default({ dev, dir: rootDir })
  : next({ dev, dir: rootDir });
const handle = nextApp.getRequestHandler();

async function startServer() {
  await initializeDatabase();

  try {
    await nextApp.prepare();
  } catch (nextErr) {
    console.warn("Next.js preparation notice (falling back or in dev mode):", nextErr);
  }

  // Handle all frontend and non-Express web requests with Next.js handler
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` Flowmetrics Unified Web Service Running`);
    console.log(` Port:    http://localhost:${PORT}      `);
    console.log(` Health:  http://localhost:${PORT}/api/health `);
    console.log(`========================================`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

