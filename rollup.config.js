import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const isProduction = process.env.NODE_ENV === 'production';

const basePlugins = [
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
];

const productionPlugins = isProduction ? [terser()] : [];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/webgl-carousel.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        jsx: 'react',
      }),
      ...productionPlugins,
    ],
    external: ['react', 'vue', 'svelte', /\.svelte$/],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/webgl-carousel.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        jsx: 'react',
      }),
      ...productionPlugins,
    ],
    external: ['react', 'vue', 'svelte', /\.svelte$/],
  },
  // UMD build (for browser) - Core only without framework adapters
  {
    input: 'src/index-umd.ts',
    output: {
      file: 'dist/webgl-carousel.umd.js',
      format: 'umd',
      name: 'WebGLCarousel',
      sourcemap: true,
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        jsx: 'react',
      }),
      ...productionPlugins,
    ],
  },
  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/webgl-carousel.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
  // Effects bundle - all effects in one file
  {
    input: 'src/effects/index.ts',
    output: [
      {
        file: 'dist/carousel-effects.esm.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/carousel-effects.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      ...productionPlugins,
    ],
  },
];