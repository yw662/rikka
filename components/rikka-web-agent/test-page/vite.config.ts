import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4200,
    headers: {
      // Allow SharedArrayBuffer for WebLLM
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
