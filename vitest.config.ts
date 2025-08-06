import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '*.config.{js,ts}',
        '**/*.d.ts',
        '**/index.ts',
        '**/*.stories.{ts,tsx}',
      ],
      thresholds: {
        branches: 35,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});