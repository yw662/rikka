import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
      syntax: "es2022",
      output: {
        distPath: { root: "./dist" },
        target: "web",
        // Keep the dependency graph as separate files instead of inlining —
        // this ensures classes like HttpError share identity across the
        // server.js and index.js bundles.
        externals: [
          "./errors.js",
          "./schema.js",
          "./resource.js",
          "./site.js",
          "./context.js",
          "./kind.js",
          "./auth.js",
          "./negotiate.js",
          "./transform.js",
          "./edge.js",
          /^node:/,
        ],
      },
      autoExternal: true,
      dts: true,
    },
    {
      format: "esm",
      syntax: "es2022",
      output: {
        distPath: { root: "./dist" },
        target: "web",
        // Bundle everything except Node.js-only dependencies that are only used
        // at runtime on the server (custom element bundling, static asset files).
        externals: ["esbuild", /^node:/],
      },
      autoExternal: false, // Bundle everything — this is a standalone browser bundle
      dts: false, // No need for .d.ts in the browser bundle
    },
  ],
  source: {
    entry: {
      index: "./src/index.ts",
      edge: "./src/edge.ts",
      "sdk/sdk": "./src/sdk/index.ts", // → dist/sdk/sdk.js
    },
    exclude: [
      "./src/**/*.test.ts",
      "./src/service-worker-default/**",
    ],
  },
});
