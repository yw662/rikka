import { defineConfig } from "@rsbuild/core";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "../..");

export default defineConfig({
  source: {
    entry: {
      index: "./src/main.ts",
    },
    tsconfigPath: "./tsconfig.json",
  },
  html: {
    template: "./index.html",
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  output: {
    distPath: {
      root: "dist",
    },
    filename: {
      js: "[name].js",
    },
    assetPrefix: "/rikka/",
    copy: [
      {
        from: resolve(workspaceRoot, "utils/rikka-signal/dist/index.js"),
        to: "esm/rikka-signal.js",
      },
      {
        from: resolve(workspaceRoot, "utils/rikka-dom/dist/index.js"),
        to: "esm/rikka-dom.js",
      },
      {
        from: resolve(workspaceRoot, "utils/rikka-elements/dist/index.js"),
        to: "esm/rikka-elements.js",
      },
      {
        from: resolve(
          workspaceRoot,
          "node_modules/.pnpm/signal-polyfill@0.2.2/node_modules/signal-polyfill/dist/index.js",
        ),
        to: "esm/signal-polyfill.js",
      },
      {
        from: resolve(workspaceRoot, "components/rikka-live-playground/dist/index.js"),
        to: "esm/rikka-live-playground.js",
      },
    ],
  },
  tools: {
    rspack: (config) => {
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.wasm$/,
        resourceQuery: /url/,
        type: "asset/resource",
      });
    },
  },
});
