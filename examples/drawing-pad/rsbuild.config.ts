import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  html: {
    title: 'Drawing Pad - Rikka',
  },
  output: {
    filename: {
      js: '[name].js',
    },
    assetPrefix: './',
  },
});
