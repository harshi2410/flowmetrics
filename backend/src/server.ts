import { app } from "./app.js";
import { initializeDatabase } from "./db/init.js";
import { pool } from "./db/pool.js";
import { env } from "./config/env.js";
import next from "next";
import fs from "node:fs";
import path from "node:path";
import type { Server } from "node:http";

const PORT = env.PORT;
const dev = env.NODE_ENV !== "production";

// Determine repository root directory (where .next and package.json reside)
const rootDir =
  fs.existsSync(path.resolve(process.cwd(), ".next")) ||
  fs.existsSync(path.resolve(process.cwd(), "app"))
    ? process.cwd()
    : path.resolve(process.cwd(), "..");

const nextApp = (next as unknown as { default?: typeof next })?.default
  ? (next as unknown as { default: typeof next }).default({ dev, dir: rootDir })
  : next({ dev, dir: rootDir });
const handle = nextApp.getRequestHandler();

let server: Server;

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

  server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Flowmetrics Enterprise Operations Platform      `);
    console.log(` Status:      Online                            `);
    console.log(` Environment: ${env.NODE_ENV}                  `);
    console.log(` Port:        http://localhost:${PORT}          `);
    console.log(` Health:      http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });

  // Graceful Shutdown Handling
  const handleShutdown = async (signal: string) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Initiating graceful shutdown...`);

    // Force exit after 10 seconds if connections refuse to close
    const forceExitTimer = setTimeout(() => {
      console.error("[SHUTDOWN] Forceful shutdown triggered after timeout.");
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    if (server) {
      server.close(async () => {
        console.log("[SHUTDOWN] HTTP server closed. Draining database connection pool...");
        try {
          await pool.end();
          console.log("[SHUTDOWN] Database connection pool cleanly drained.");
        } catch (dbErr) {
          console.error("[SHUTDOWN] Error closing database pool:", dbErr);
        }
        console.log("[SHUTDOWN] Flowmetrics platform shut down successfully.");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
