import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  html: {
    title: 'Todo List - Rikka',
  },
  output: {
    filename: {
      js: '[name].js',
    },
    assetPrefix: './',
  },
});
