import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  html: {
    title: '2048 Game - Rikka',
  },
  output: {
    filename: {
      js: '[name].[hash].js',
      css: '[name].[hash].css',
    },
  },
});