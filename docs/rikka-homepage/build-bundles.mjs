import esbuild from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const signalRequire = createRequire(
  resolve(root, "utils/rikka-signal/package.json"),
);
const signalPolyfillPkgDir = dirname(
  signalRequire.resolve("signal-polyfill/package.json"),
);

const alias = {
  "@rikka/signal": resolve(root, "utils/rikka-signal/src/index.ts"),
  "@rikka/dom": resolve(root, "utils/rikka-dom/src/index.ts"),
  "@rikka/elements": resolve(root, "utils/rikka-elements/src/index.ts"),
  "signal-polyfill": resolve(signalPolyfillPkgDir, "dist/index.js"),
};

const outDir = resolve(__dirname, "bundles");

const shared = {
  entryPoints: [resolve(__dirname, "bundles/entry.ts")],
  bundle: true,
  alias,
  target: "es2022",
  logLevel: "info",
};

await Promise.all([
  esbuild.build({
    ...shared,
    format: "iife",
    globalName: "Rikka",
    outfile: resolve(outDir, "rikka.js"),
  }),
  esbuild.build({
    ...shared,
    format: "esm",
    outfile: resolve(outDir, "rikka.esm.js"),
  }),
]);
