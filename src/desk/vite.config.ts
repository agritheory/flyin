import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { flyinDeskPlugin } from '../plugins/vite'

const appsDir = process.env.FLYIN_APPS_DIR
const sitesDir = process.env.FLYIN_SITES_DIR
const outDir = process.env.FLYIN_OUT_DIR || resolve(process.cwd(), 'public', 'dist', 'js')

export default defineConfig({
  plugins: [
    vue(),
    flyinDeskPlugin({ appsDir, sitesDir }),
  ],
  resolve: {
    alias: [
      {
        find: '@agritheory/flyin/file-preview',
        replacement: resolve(import.meta.dirname, '../file-preview.ts'),
      },
      {
        find: '@agritheory/flyin/styles.css',
        replacement: resolve(import.meta.dirname, '../styles.css'),
      },
      {
        find: '@agritheory/flyin',
        replacement: resolve(import.meta.dirname, '../index.ts'),
      },
      {
        find: '@',
        replacement: resolve(import.meta.dirname, '..'),
      },
    ],
  },
  build: {
    outDir,
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'flyin.desk.ts'),
      output: {
        entryFileNames: 'flyin.desk.bundle.js',
        format: 'iife',
        name: 'FlyinDesk',
        inlineDynamicImports: true,
      },
    },
    target: 'es2015',
    minify: false,
  },
})
