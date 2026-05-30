import { defineConfig } from "@rstest/core";
import path from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  testEnvironment: "happy-dom",
  include: ["test/**/*.test.ts"],
  resolve: {
    alias: {
      "rikka-signal$": path.resolve(root, "../rikka-signal/src/index.ts"),
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
