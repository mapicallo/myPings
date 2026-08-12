import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.VITE_BASE_PATH ?? '/web-extensions/my-pings/';

export default defineConfig({
  root,
  base,
  publicDir: false,
  build: {
    outDir: 'dist-pwa',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index-pwa.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
