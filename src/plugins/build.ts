import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import {
  detectCurrentAppName,
  findAppsDirectory,
  getBuildHostApp,
  isBuildHost,
} from './hooks'
import { registerFlyinDeskBundle } from './assets-json'
import { defineFlyinDeskConfig } from './vite'
import { resolveNodeBinary } from './node'

function findPackageRoot(startDir: string): string {
  let currentDir = startDir

  for (let i = 0; i < 8; i++) {
    const packageJsonPath = resolve(currentDir, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' }))
      if (packageJson.name === '@agritheory/flyin') {
        return currentDir
      }
    }

    const parent = dirname(currentDir)
    if (parent === currentDir) break
    currentDir = parent
  }

  throw new Error('[flyin] Could not find @agritheory/flyin package root')
}

export interface BuildIfHostOptions {
  appsDir?: string
  sitesDir?: string
  appName?: string
}

export function buildIfHost(options: BuildIfHostOptions = {}): void {
  const appName = options.appName || detectCurrentAppName()
  const host = getBuildHostApp(options)

  if (!host) {
    console.log('[flyin] No apps with a flyin hook found — skipping desk build')
    return
  }

  if (!isBuildHost({ ...options, appName: appName ?? undefined })) {
    console.log(`[flyin] Skipping desk build for "${appName}" — build host is "${host}"`)
    return
  }

  console.log(`[flyin] Building desk bundle from "${host}"`)

  const packageRoot = findPackageRoot(import.meta.dirname)
  const viteConfigPath = resolve(packageRoot, 'src/desk/vite.config.ts')
  const viteBin = resolve(packageRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const appsDir = options.appsDir || findAppsDirectory()

  if (!appsDir) {
    throw new Error('[flyin] Could not find bench apps directory')
  }

  const hostAppPath = resolve(appsDir, host)
  if (!existsSync(hostAppPath)) {
    throw new Error(`[flyin] Build host app directory not found: ${hostAppPath}`)
  }

  const sitesDir = options.sitesDir || resolve(appsDir, '..', 'sites')
  const outDir = resolve(hostAppPath, host, 'public', 'dist', 'js')
  const nodeBinary = resolveNodeBinary({ cwd: hostAppPath })

  const result = spawnSync(
    nodeBinary,
    [viteBin, 'build', '--config', viteConfigPath],
    {
      cwd: hostAppPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        FLYIN_BUILD_HOST_APP: host,
        FLYIN_APPS_DIR: appsDir,
        FLYIN_SITES_DIR: sitesDir,
        FLYIN_OUT_DIR: outDir,
      },
    }
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  registerFlyinDeskBundle({
    hostApp: host,
    outDir,
    sitesDir,
  })
}

export { getBuildHostApp, isBuildHost, detectCurrentAppName, defineFlyinDeskConfig }
