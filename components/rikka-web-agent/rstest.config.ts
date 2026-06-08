import { defineConfig } from "@rstest/core";
import path from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  testEnvironment: "happy-dom",
  include: ["test/**/*.test.ts"],
  coverage: {
    enabled: true,
    provider: "v8",
    include: ["src/**/*.{ts,tsx,js,jsx}"],
    reporters: ["text", "lcov", "html"],
    reportsDirectory: "./coverage",
    clean: true,
  },
  resolve: {
    alias: {
      "@takanashi/rikka-signal$": path.resolve(root, "../../utils/rikka-signal/dist/index.js"),
      "@takanashi/rikka-dom$": path.resolve(root, "../../utils/rikka-dom/dist/index.js"),
      "@takanashi/rikka-elements$": path.resolve(
        root,
        "../../utils/rikka-elements/dist/index.js",
      ),
    },
  },
  tools: {
    rspack: (config) => {
      config.module ||= {};
      config.module.rules ||= [];
      config.module.rules.push({
        test: /\.ts$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                },
                transform: {
                  useDefineForClassFields: false,
                },
              },
            },
          },
        ],
        type: "javascript/auto",
      });
      return config;
    },
  },
});
