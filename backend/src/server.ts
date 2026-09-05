import { app } from "./app.js";
import { initializeDatabase } from "./db/init.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` Flowmetrics Express API Server Running `);
    console.log(` Port:    http://localhost:${PORT}      `);
    console.log(` Health:  http://localhost:${PORT}/api/health `);
    console.log(`========================================`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
