import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  server: {
    port: 5173,
    open: '/standalone.html'
  },
  publicDir: '../'
});