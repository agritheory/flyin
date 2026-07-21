import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname, resolve, basename } from 'path'

export interface FlyinSlotHookConfig {
  title: string
  icon?: string
  component: string
  badge_method?: string
  navbar_position?: 'left' | 'right'
}

export interface FlyinHookConfig {
  slots: Record<string, FlyinSlotHookConfig>
  drawer_mode?: 'overlay' | 'push'
  navbar_icon?: string
  navbar_title?: string
}

export interface AppListEntry {
  idx?: number
}

export type AppList = Record<string, AppListEntry>

export interface AppHookFile {
  appName: string
  appPath: string
  hookFile: string
  idx: number
}

export interface AppConfig {
  appName: string
  appPath: string
  hookFile: string
  idx: number
  flyin: FlyinHookConfig
  flyinBuildHost?: boolean
}

const HOOK_NAME = 'flyin'
const BUILD_HOST_HOOK = 'flyin_build_host'

export function findAppsDirectory(startDir: string = process.cwd()): string | null {
  let currentDir = startDir

  for (let i = 0; i < 12; i++) {
    const appsDir = join(currentDir, 'apps')
    if (existsSync(appsDir) && statSync(appsDir).isDirectory()) {
      return appsDir
    }

    const parent = dirname(currentDir)
    if (parent === currentDir) break
    currentDir = parent
  }

  return null
}

export function findSitesDirectory(appsDir: string): string | null {
  const sitesDir = resolve(appsDir, '..', 'sites')
  if (existsSync(sitesDir) && statSync(sitesDir).isDirectory()) {
    return sitesDir
  }
  return null
}

export function readAppsTxt(sitesDir: string): string[] {
  const appsTxtPath = join(sitesDir, 'apps.txt')
  if (!existsSync(appsTxtPath)) {
    return []
  }

  return readFileSync(appsTxtPath, { encoding: 'utf-8' })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function getDefaultSiteName(sitesDir: string): string | null {
  const commonPath = join(sitesDir, 'common_site_config.json')
  if (!existsSync(commonPath)) {
    return null
  }

  const common = JSON.parse(readFileSync(commonPath, { encoding: 'utf-8' })) as {
    default_site?: string
  }
  return common.default_site || null
}

export function getInstalledAppsForSite(
  sitesDir: string,
  siteName?: string | null
): Set<string> | null {
  const resolvedSite = siteName || process.env.FLYIN_SITE_NAME || getDefaultSiteName(sitesDir)
  if (!resolvedSite) {
    return null
  }

  const siteConfigPath = join(sitesDir, resolvedSite, 'site_config.json')
  if (existsSync(siteConfigPath)) {
    const siteConfig = JSON.parse(readFileSync(siteConfigPath, { encoding: 'utf-8' })) as {
      install_apps?: string[]
    }
    if (Array.isArray(siteConfig.install_apps) && siteConfig.install_apps.length > 0) {
      return new Set(siteConfig.install_apps)
    }
  }

  const appsTxt = readAppsTxt(sitesDir)
  if (appsTxt.length > 0) {
    return new Set(appsTxt)
  }

  return null
}

export function readAppsList(sitesDir: string): AppList {
  const appsListPath = join(sitesDir, 'apps.json')
  if (!existsSync(appsListPath)) {
    return {}
  }

  return JSON.parse(readFileSync(appsListPath, { encoding: 'utf-8' })) as AppList
}

export function getAppOrderMap(sitesDir?: string, appsDir?: string): Record<string, number> {
  const resolvedAppsDir = appsDir || findAppsDirectory()
  if (!resolvedAppsDir) return {}

  const resolvedSitesDir = sitesDir || findSitesDirectory(resolvedAppsDir)
  if (!resolvedSitesDir) return {}

  const appsList = readAppsList(resolvedSitesDir)

  return Object.entries(appsList).reduce(
    (acc, [appName, config]) => {
      acc[appName] = config.idx ?? Infinity
      return acc
    },
    {} as Record<string, number>
  )
}

export function getAppHookFiles(appsDir: string, appOrderMap?: Record<string, number>): AppHookFile[] {
  const orderMap = appOrderMap ?? {}
  const hookFiles: AppHookFile[] = []

  try {
    const apps = readdirSync(appsDir)

    for (const app of apps) {
      const appPath = join(appsDir, app)
      if (!statSync(appPath).isDirectory()) continue

      const hooksPath = join(appPath, app, 'hooks.py')
      if (!existsSync(hooksPath)) continue

      hookFiles.push({
        appName: app,
        appPath,
        hookFile: hooksPath,
        idx: orderMap[app] ?? Infinity,
      })
    }
  } catch (error) {
    console.warn('[flyin] Error scanning apps directory:', error)
  }

  return hookFiles.sort((a, b) => a.idx - b.idx)
}

export function preFormatHooks(rawText: string): string {
  return rawText
    .replace(/^\s*#.*$/gm, '')
    .replace(/(.+?)#.*$/gm, '$1')
    .replace(/'/g, '"')
    .replace(/True/g, 'true')
    .replace(/False/g, 'false')
    .replace(/None/g, 'null')
    .replace(/,(\s*[\]}])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractHookAssignment(
  fileContent: string,
  hookName: string
): Record<string, unknown> | null {
  const hookRegex = new RegExp(
    `${hookName}\\s*=\\s*(\\{[\\s\\S]*?\\})(?=\\s*$|\\s*#|\\s*[\\r\\n][a-zA-Z_])`,
    'm'
  )
  const dictMatch = fileContent.match(hookRegex)

  if (dictMatch) {
    try {
      return JSON.parse(preFormatHooks(dictMatch[1])) as Record<string, unknown>
    } catch {
      return extractHookAssignmentLine(fileContent, hookName)
    }
  }

  const boolMatch = fileContent.match(new RegExp(`^${hookName}\\s*=\\s*(True|False)`, 'm'))
  if (boolMatch) {
    return { value: boolMatch[1] === 'True' }
  }

  return null
}

function extractHookAssignmentLine(
  fileContent: string,
  hookName: string
): Record<string, unknown> | null {
  const lines = fileContent.split('\n')
  let inHook = false
  let braceCount = 0
  let hookContent = ''

  for (const line of lines) {
    if (line.match(new RegExp(`^${hookName}\\s*=\\s*\\{`))) {
      inHook = true
    }

    if (inHook) {
      hookContent += line + '\n'
      braceCount += (line.match(/\{/g) || []).length
      braceCount -= (line.match(/\}/g) || []).length

      if (braceCount === 0) {
        break
      }
    }
  }

  if (!hookContent) return null

  try {
    const jsonLike = hookContent
      .replace(new RegExp(`${hookName}\\s*=\\s*`), '')
      .replace(/'/g, '"')
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null')
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/#.*$/gm, '')

    return JSON.parse(jsonLike) as Record<string, unknown>
  } catch (error) {
    console.warn(`[flyin] Failed to parse ${hookName} config:`, error)
    return null
  }
}

export function fileHasFlyinHook(fileContent: string): boolean {
  return new RegExp(`^${HOOK_NAME}\\s*=\\s*\\{`, 'm').test(fileContent)
}

export function fileHasFlyinBuildHost(fileContent: string): boolean {
  return new RegExp(`^${BUILD_HOST_HOOK}\\s*=\\s*True`, 'm').test(fileContent)
}

export function mergeConfigs<T extends Record<string, unknown>>(
  ...configs: Array<Partial<T> | undefined>
): T {
  const result = {} as T
  for (const config of configs) {
    for (const [key, value] of Object.entries(config ?? {})) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  return result
}

export function getAppConfigs(options?: { appsDir?: string; sitesDir?: string }): AppConfig[] {
  const resolvedAppsDir = options?.appsDir || findAppsDirectory()
  if (!resolvedAppsDir) {
    console.warn('[flyin] Could not find apps directory')
    return []
  }

  const resolvedSitesDir =
    options?.sitesDir || findSitesDirectory(resolvedAppsDir) || undefined
  const installedApps = resolvedSitesDir
    ? getInstalledAppsForSite(resolvedSitesDir)
    : null

  const appOrderMap = getAppOrderMap(resolvedSitesDir, resolvedAppsDir)
  const hookFiles = getAppHookFiles(resolvedAppsDir, appOrderMap)
  const configs: AppConfig[] = []

  for (const hook of hookFiles) {
    if (installedApps && !installedApps.has(hook.appName)) {
      continue
    }

    try {
      const fileContent = readFileSync(hook.hookFile, { encoding: 'utf-8' })

      if (!fileHasFlyinHook(fileContent)) continue

      const flyinConfig = extractHookAssignment(fileContent, HOOK_NAME) as FlyinHookConfig | null
      if (!flyinConfig?.slots) continue

      configs.push({
        appName: hook.appName,
        appPath: hook.appPath,
        hookFile: hook.hookFile,
        idx: hook.idx,
        flyin: flyinConfig,
        flyinBuildHost: fileHasFlyinBuildHost(fileContent),
      })
    } catch (error) {
      console.warn(`[flyin] Error reading ${hook.hookFile}:`, error)
    }
  }

  return configs
}

export function getMergedFlyinConfig(options?: {
  appsDir?: string
  sitesDir?: string
}): FlyinHookConfig {
  const configs = getAppConfigs(options)
  let mergedSlots: Record<string, FlyinSlotHookConfig> = {}

  for (const config of configs) {
    mergedSlots = mergeConfigs(mergedSlots, config.flyin.slots)
  }

  return { slots: mergedSlots }
}

export function getSlotComponents(options?: {
  appsDir?: string
  sitesDir?: string
}): Record<string, string> {
  const configs = getAppConfigs(options)
  const components: Record<string, string> = {}

  for (const config of configs) {
    for (const [slotId, slot] of Object.entries(config.flyin.slots)) {
      if (!slot.component) continue

      let componentPath = slot.component
      if (componentPath.startsWith('./')) {
        componentPath = resolve(config.appPath, componentPath.slice(2))
      } else if (!componentPath.startsWith('/')) {
        componentPath = resolve(config.appPath, componentPath)
      }

      components[slotId] = componentPath
    }
  }

  return components
}

export function getFlyinParticipatingApps(options?: {
  appsDir?: string
  sitesDir?: string
}): string[] {
  return getAppConfigs(options).map(config => config.appName)
}

export function getFlyinDeskOptions(options?: {
  appsDir?: string
  sitesDir?: string
}): {
  drawerMode: 'overlay' | 'push'
  navbarIcon?: string
  navbarTitle?: string
} {
  const host = getBuildHostApp(options)
  if (!host) return { drawerMode: 'overlay' }

  const config = getAppConfigs(options).find(entry => entry.appName === host)
  const drawerMode = config?.flyin.drawer_mode === 'push' ? 'push' : 'overlay'
  return {
    drawerMode,
    navbarIcon: config?.flyin.navbar_icon,
    navbarTitle: config?.flyin.navbar_title,
  }
}

export function getBuildHostApp(options?: {
  appsDir?: string
  sitesDir?: string
}): string | null {
  const configs = getAppConfigs(options)
  if (configs.length === 0) return null

  const explicitHosts = configs.filter(config => config.flyinBuildHost)
  if (explicitHosts.length === 1) {
    return explicitHosts[0].appName
  }

  if (explicitHosts.length > 1) {
    console.warn(
      '[flyin] Multiple apps declare flyin_build_host = True:',
      explicitHosts.map(config => config.appName).join(', ')
    )
  }

  return configs[configs.length - 1]?.appName ?? null
}

export function detectCurrentAppName(cwd: string = process.cwd()): string | null {
  const appsDir = findAppsDirectory(cwd)
  if (!appsDir) return basename(cwd)

  const relative = cwd.startsWith(appsDir) ? cwd.slice(appsDir.length + 1) : null
  if (relative) {
    return relative.split('/')[0] || null
  }

  if (existsSync(join(cwd, 'hooks.py'))) {
    return basename(cwd)
  }

  const nestedHooks = readdirSync(cwd, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(cwd, entry.name, 'hooks.py'))
    .find(path => existsSync(path))

  if (nestedHooks) {
    return basename(dirname(nestedHooks))
  }

  return basename(cwd)
}

export function isBuildHost(options?: {
  appsDir?: string
  sitesDir?: string
  appName?: string
}): boolean {
  const currentApp = options?.appName || detectCurrentAppName()
  const host = getBuildHostApp(options)

  if (!currentApp || !host) return false
  return currentApp === host
}
