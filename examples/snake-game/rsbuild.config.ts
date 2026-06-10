import { defineConfig } from '@rsbuild/core';

export default defineConfig({
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