import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
    },
    tsconfigPath: './tsconfig.json',
  },
  html: {
    title: 'Snake Game - Rikka',
  },
  output: {
    filename: {
      js: '[name].[hash].js',
      css: '[name].[hash].css',
    },
    assetPrefix: './',
  },
});