/**
 * Blog Site — Cloudflare Workers entry point.
 *
 * Uses an in-memory static file resolver for Edge compatibility.
 * In production, replace this with a KV/R2-backed resolver or a bundled manifest.
 */
import { createApp } from "./resources.js";
import { createCloudflareWorkerHandler } from "@takanashi/rikka-site";
import type { StaticResolver } from "@takanashi/rikka-site";

const edgeStaticFiles = new Map<string, { content: Uint8Array; type: string }>([
  [
    "robots.txt",
    {
      content: new TextEncoder().encode("User-agent: *\nDisallow:\n"),
      type: "text/plain",
    },
  ],
]);

const staticResolver: StaticResolver = async (path) =>
  edgeStaticFiles.get(path) ?? null;

const app = createApp({ staticResolver });

export default createCloudflareWorkerHandler(app);
