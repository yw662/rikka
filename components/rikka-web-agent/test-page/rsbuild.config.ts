import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    port: 4200,
    headers: {
      // COEP/COOP required for WebLLM (SharedArrayBuffer)
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  source: {
    entry: {
      index: './src/main.ts',
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
