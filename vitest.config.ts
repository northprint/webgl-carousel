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
        'node_modules/**',
        'dist/**',
        'tests/**',
        'examples/**',
        'e2e/**',
        'docs/**',
        '*.config.{js,ts,mjs,cjs}',
        '**/*.d.ts',
        '**/index.ts',
        '**/index-*.ts',
        '**/*.stories.{ts,tsx}',
        '**/testHelpers.ts',
        '**/interfaces/**',
        '**/types/**',
        '**/BaseEffect.ts',  // Abstract base class
        '**/webglHelpers.ts',  // Utility functions
        '**/ResizeObserverManager.ts',  // Browser API wrapper
        '**/*.svelte',
        '**/*.vue',
        '*.js',
        '*.spec.ts',
      ],
      thresholds: {
        branches: 35,
        functions: 45,
        lines: 45,
        statements: 45,
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