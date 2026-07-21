import type { Plugin, UserConfig } from 'vite'
import { resolve } from 'path'
import { generateFlyinRegisterModule } from './register-codegen'
import { getFlyinDeskOptions, getSlotComponents, getFlyinParticipatingApps } from './hooks'

const VIRTUAL_REGISTER_ID = 'virtual:flyin-register'
const RESOLVED_REGISTER_ID = '\0virtual:flyin-register'
const VIRTUAL_DESK_OPTIONS_ID = 'virtual:flyin-desk-options'
const RESOLVED_DESK_OPTIONS_ID = '\0virtual:flyin-desk-options'

export interface FlyinDeskPluginOptions {
  appsDir?: string
  sitesDir?: string
}

export function flyinDeskPlugin(options: FlyinDeskPluginOptions = {}): Plugin {
  const { appsDir, sitesDir } = options
  let slotComponents: Record<string, string> = {}

  return {
    name: 'vite-plugin-flyin-desk',
    enforce: 'pre',

    configResolved() {
      slotComponents = getSlotComponents({ appsDir, sitesDir })
      const apps = getFlyinParticipatingApps({ appsDir, sitesDir })

      if (apps.length > 0) {
        console.log('[flyin] Participating apps:', apps.join(', '))
        console.log('[flyin] Resolved slots:', Object.keys(slotComponents).join(', '))
      }
    },

    resolveId(source) {
      if (source === VIRTUAL_REGISTER_ID) {
        return RESOLVED_REGISTER_ID
      }
      if (source === VIRTUAL_DESK_OPTIONS_ID) {
        return RESOLVED_DESK_OPTIONS_ID
      }
      return null
    },

    load(id) {
      if (id === RESOLVED_REGISTER_ID) {
        return generateFlyinRegisterModule({ appsDir, sitesDir })
      }
      if (id === RESOLVED_DESK_OPTIONS_ID) {
        const options = getFlyinDeskOptions({ appsDir, sitesDir })
        return `export const flyinDeskOptions = ${JSON.stringify(options)}`
      }
      return null
    },
  }
}

export interface FlyinDeskBuildOptions extends FlyinDeskPluginOptions {
  appName?: string
  outDir?: string
  entry?: string
}

export function defineFlyinDeskConfig(options: FlyinDeskBuildOptions = {}): UserConfig {
  const packageRoot = resolve(import.meta.dirname, '..')
  const entry = options.entry || resolve(packageRoot, 'desk/flyin.desk.ts')
  const outDir = options.outDir || resolve(process.cwd(), 'public', 'dist', 'js')

  return {
    plugins: [flyinDeskPlugin(options)],
    build: {
      outDir,
      emptyOutDir: false,
      lib: false,
      rollupOptions: {
        input: entry,
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
  }
}

// Backward-compatible aliases
export const flyoutVitePlugin = flyinDeskPlugin
export type FlyoutVitePluginOptions = FlyinDeskPluginOptions
export const flyoutComponentsPlugin = flyinDeskPlugin
