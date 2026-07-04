/**
 * Blog Site — Node.js entry point.
 *
 * Run: pnpm dev / pnpm start
 *
 * Visit http://localhost:3000 to see the blog.
 */

import { Site } from "@takanashi/rikka-site";
import { createApp } from "./resources.js";

const app = createApp();

const port = Number(process.env["PORT"] ?? 3000);
const host = process.env["HOST"] ?? "127.0.0.1";

const server = await app.listen({ port, host });
await server.ready;

console.log(`[rikka-site] blog-site listening on http://${server.host}:${server.port}`);

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`[rikka-site] received ${signal}, shutting down...`);
  try {
    await server.close();
    console.log("[rikka-site] server closed");
    process.exit(0);
  } catch (err) {
    console.error("[rikka-site] error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
