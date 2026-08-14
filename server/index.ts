import "dotenv/config";

import { setGlobalDispatcher, Agent } from "undici";

setGlobalDispatcher(
  new Agent({
    connect: { family: 4 },
  })
);

import verifyRouter from "./routes/verify.js";
import express from "express";
import cors from "cors";
import { env, logEnvStatus } from "./env.js";
const app = express();

const PORT = Number(process.env.PORT) || 5000;

/**
 * Middleware
 */
app.use(
  cors({
    origin: env.allowedOrigin ?? "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));

/**
 * Health check
 *
 * Used to confirm that the backend is alive.
 */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Visstya AI",
    message: "Backend is running",
  });
});

app.use("/api/verify", verifyRouter);
/**
 * Verification endpoint
 *
 * This is intentionally only a skeleton for now.
 *
 * Later this endpoint will:
 *
 * 1. Receive media + claim context
 * 2. Run metadata verification
 * 3. Run vision analysis
 * 4. Run weather verification
 * 5. Gather evidence
 * 6. Send module results to scoring.ts
 * 7. Send scores + missing information to display.ts
 * 8. Return the final verification report
 */


/**
 * 404 handler
 */
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: "Route not found",
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n🚀 Visstya AI backend running`);
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Verify: POST http://localhost:${PORT}/api/verify\n`);
  logEnvStatus();
});