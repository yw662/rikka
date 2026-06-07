import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    port: 5174,
  },
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  html: {
    template: './index.html',
  },
  output: {
    assetPrefix: './',
    legalComments: 'none',
  },
});
