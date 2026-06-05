import { defineConfig } from "@rsbuild/core";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, "../..");

const signalRequire = createRequire(
  resolve(workspaceRoot, "utils/rikka-signal/package.json"),
);
const signalPolyfillDist = resolve(
  dirname(signalRequire.resolve("signal-polyfill/package.json")),
  "dist/index.js",
);

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
    assetPrefix: "./",
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
        from: signalPolyfillDist,
        to: "esm/signal-polyfill.js",
      },
      {
        from: resolve(workspaceRoot, "components/rikka-live-playground/dist/index.js"),
        to: "esm/rikka-live-playground.js",
      },
      {
        from: resolve(__dirname, "bundles/rikka.js"),
        to: "cdn/rikka.js",
      },
      {
        from: resolve(__dirname, "bundles/rikka.esm.js"),
        to: "cdn/rikka.esm.js",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/README.md"),
        to: "skills/README.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/overview.md"),
        to: "skills/overview.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/reactive-state.md"),
        to: "skills/reactive-state.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/dom-creation.md"),
        to: "skills/dom-creation.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/signal-binding.md"),
        to: "skills/signal-binding.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/control-flow.md"),
        to: "skills/control-flow.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/form-binding.md"),
        to: "skills/form-binding.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/custom-element.md"),
        to: "skills/custom-element.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/shadow-dom-styling.md"),
        to: "skills/shadow-dom-styling.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/template-binding.md"),
        to: "skills/template-binding.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/composition.md"),
        to: "skills/composition.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/svg.md"),
        to: "skills/svg.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/browser-compatibility.md"),
        to: "skills/browser-compatibility.md",
      },
      {
        from: resolve(workspaceRoot, "docs/rikka-skills/common-pitfalls.md"),
        to: "skills/common-pitfalls.md",
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
