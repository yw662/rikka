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
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  source: {
    entry: {
      index: "./src/main.ts",
    },
    tsconfigPath: "./tsconfig.json",
  },
  resolve: {
    alias: {
      "@takanashi/rikka-signal": resolve(workspaceRoot, "utils/rikka-signal/src/index.ts"),
      "@takanashi/rikka-dom": resolve(workspaceRoot, "utils/rikka-dom/src/index.ts"),
      "@takanashi/rikka-elements": resolve(workspaceRoot, "utils/rikka-elements/src/index.ts"),
      "@takanashi/rikka-live-playground": resolve(workspaceRoot, "components/rikka-live-playground/src/index.ts"),
      "@takanashi/rikka-web-agent": resolve(workspaceRoot, "components/rikka-web-agent/src/index.ts"),
    },
  },
  html: {
    template: "./index.html",
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
      // Skills (agentskills.io format: <skill-name>/SKILL.md)
      // The agentskills.io CLI expects skills/<name>/SKILL.md on disk
      // and the same layout is what `npx skills add yw662/rikka` installs.
      // We also copy a flat mirror (skills/<name>.md) so legacy URLs and
      // existing link targets from the old docs/rikka-skills/*.md layout
      // keep working without rewriting the homepage index.
      {
        from: resolve(workspaceRoot, "skills"),
        to: "skills",
      },
      {
        from: resolve(workspaceRoot, "skills/overview/SKILL.md"),
        to: "skills/overview.md",
      },
      {
        from: resolve(workspaceRoot, "skills/reactive-state/SKILL.md"),
        to: "skills/reactive-state.md",
      },
      {
        from: resolve(workspaceRoot, "skills/dom-creation/SKILL.md"),
        to: "skills/dom-creation.md",
      },
      {
        from: resolve(workspaceRoot, "skills/signal-binding/SKILL.md"),
        to: "skills/signal-binding.md",
      },
      {
        from: resolve(workspaceRoot, "skills/control-flow/SKILL.md"),
        to: "skills/control-flow.md",
      },
      {
        from: resolve(workspaceRoot, "skills/form-binding/SKILL.md"),
        to: "skills/form-binding.md",
      },
      {
        from: resolve(workspaceRoot, "skills/custom-element/SKILL.md"),
        to: "skills/custom-element.md",
      },
      {
        from: resolve(workspaceRoot, "skills/shadow-dom-styling/SKILL.md"),
        to: "skills/shadow-dom-styling.md",
      },
      {
        from: resolve(workspaceRoot, "skills/template-binding/SKILL.md"),
        to: "skills/template-binding.md",
      },
      {
        from: resolve(workspaceRoot, "skills/composition/SKILL.md"),
        to: "skills/composition.md",
      },
      {
        from: resolve(workspaceRoot, "skills/svg/SKILL.md"),
        to: "skills/svg.md",
      },
      {
        from: resolve(workspaceRoot, "skills/browser-compatibility/SKILL.md"),
        to: "skills/browser-compatibility.md",
      },
      {
        from: resolve(workspaceRoot, "skills/common-pitfalls/SKILL.md"),
        to: "skills/common-pitfalls.md",
      },
      {
        from: resolve(workspaceRoot, "llms.txt"),
        to: "llms.txt",
      },
      // Copy examples
      {
        from: resolve(workspaceRoot, "examples/pomodoro-timer/dist"),
        to: "examples/pomodoro-timer",
        globOptions: { ignore: ["**/*.LICENSE.txt"] },
      },
      {
        from: resolve(workspaceRoot, "examples/bookmark-manager/dist"),
        to: "examples/bookmark-manager",
        globOptions: { ignore: ["**/*.LICENSE.txt"] },
      },
      {
        from: resolve(workspaceRoot, "examples/code-editor/dist"),
        to: "examples/code-editor",
        globOptions: { ignore: ["**/*.LICENSE.txt"] },
      },
      {
        from: resolve(workspaceRoot, "examples/finance-tracker/dist"),
        to: "examples/finance-tracker",
        globOptions: { ignore: ["**/*.LICENSE.txt"] },
      },
      {
        from: resolve(workspaceRoot, "examples/todo-list/dist"),
        to: "examples/todo-list",
        globOptions: { ignore: ["**/*.LICENSE.txt"] },
      },
      {
        from: resolve(workspaceRoot, "examples/drawing-pad/dist"),
        to: "examples/drawing-pad",
        globOptions: { ignore: ["**/*.LICENSE.txt"] },
      },
    ],
  },
});
