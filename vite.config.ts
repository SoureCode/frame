import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  server: {
    allowedHosts: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Frame',
      fileName: 'frame',
    },
  },
  test: {
    environment: 'jsdom',
    css: false,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
});
