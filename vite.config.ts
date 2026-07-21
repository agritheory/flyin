import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/desk/**', 'src/cli/**', 'src/__tests__/**'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        flyin: resolve(__dirname, 'src/index.ts'),
        'file-preview': resolve(__dirname, 'src/file-preview.ts'),
        'plugins/index': resolve(__dirname, 'src/plugins/index.ts'),
        'plugins/build': resolve(__dirname, 'src/plugins/build.ts'),
        'cli/build-if-host': resolve(__dirname, 'src/cli/build-if-host.ts'),
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
})
