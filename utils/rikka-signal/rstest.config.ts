import { defineConfig } from "@rstest/core";

export default defineConfig({
  testEnvironment: "happy-dom",
  include: ["test/**/*.test.ts"],
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
