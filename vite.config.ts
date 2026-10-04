import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite-plus'

import { buildTask } from './tools/vite/build-task'

const projectRootDir = resolve(import.meta.dirname)

export default defineConfig({
  run: {
    cache: {
      scripts: true,
    },
    tasks: buildTask(),
  },
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/desk/**', 'src/cli/**'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRootDir, 'src'),
    },
  },
  build: {
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        flyin: resolve(projectRootDir, 'src/index.ts'),
        'file-preview': resolve(projectRootDir, 'src/file-preview.ts'),
        'plugins/index': resolve(projectRootDir, 'src/plugins/index.ts'),
        'plugins/build': resolve(projectRootDir, 'src/plugins/build.ts'),
        'cli/build-if-host': resolve(projectRootDir, 'src/cli/build-if-host.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'child_process', 'crypto', 'fs', 'os', 'path', 'vite'],
      output: {
        globals: {
          vue: 'Vue',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'styles.css'
          return assetInfo.name || 'asset'
        },
      },
    },
    cssCodeSplit: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/desk/**', 'src/cli/**', 'src/**/*.d.ts'],
    },
  },
})
