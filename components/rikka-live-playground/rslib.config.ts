import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      output: {
        distPath: { root: './dist' },
        target: 'web',
      },
      autoExternal: true,
      dts: true,
    },
  ],
  source: {
    entry: { index: './src/index.ts' },
    exclude: ['./src/**/*.test.ts'],
  },
  output: {
    externals: {
      'esbuild-wasm/esbuild.wasm?url': 'esbuild-wasm/esbuild.wasm?url',
    },
  },
  tools: {
    swc: (config) => {
      config.jsc ||= {};
      config.jsc.transform ||= {};
      config.jsc.transform.useDefineForClassFields = false;
      return config;
    },
  },
});
