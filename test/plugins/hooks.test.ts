import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { tmpdir } from 'os'
import {
  preFormatHooks,
  extractHookAssignment,
  fileHasFlyinHook,
  fileHasFlyinBuildHost,
  mergeConfigs,
  getAppHookFiles,
  getBuildHostApp,
  getMergedFlyinConfig,
  getSlotComponents,
  getFlyinDeskOptions,
  getInstalledAppsForSite,
  isBuildHost,
  detectCurrentAppName,
} from '../../src/plugins/hooks'

describe('preFormatHooks', () => {
  it('converts Python dict syntax to JSON', () => {
    const input = `
flyin = {
    'slots': {
        'search': {
            'title': 'Search',
            'component': './Search.vue',
        },
    },
}
`
    const formatted = preFormatHooks(input)
    expect(formatted).toContain('"slots"')
    expect(formatted).toContain('"title": "Search"')
    expect(formatted).not.toContain("'")
    expect(formatted).not.toContain('True')
  })

  it('strips comments', () => {
    const input = `
# comment line
flyin = { 'title': 'Test' }  # inline comment
`
    const formatted = preFormatHooks(input)
    expect(formatted).not.toContain('#')
  })
})

describe('extractHookAssignment', () => {
  it('parses a flyin dict assignment', () => {
    const content = `
flyin = {
    'slots': {
        'inbox': {
            'title': 'Inbox',
            'icon': 'mail',
            'component': './Inbox.vue',
        },
    },
}
`
    const result = extractHookAssignment(content, 'flyin')
    expect(result).toEqual({
      slots: {
        inbox: {
          title: 'Inbox',
          icon: 'mail',
          component: './Inbox.vue',
        },
      },
    })
  })

  it('parses boolean hook assignments', () => {
    const content = `
flyin_build_host = True
`
    const result = extractHookAssignment(content, 'flyin_build_host')
    expect(result).toEqual({ value: true })
  })

  it('returns null when hook is missing', () => {
    expect(extractHookAssignment('app_name = "test"', 'flyin')).toBeNull()
  })
})

describe('fileHasFlyinHook', () => {
  it('detects flyin hook at line start', () => {
    expect(fileHasFlyinHook('flyin = {\n  "slots": {}\n}')).toBe(true)
    expect(fileHasFlyinHook('# flyin = {}')).toBe(false)
  })
})

describe('fileHasFlyinBuildHost', () => {
  it('detects explicit build host flag', () => {
    expect(fileHasFlyinBuildHost('flyin_build_host = True')).toBe(true)
    expect(fileHasFlyinBuildHost('flyin_build_host = False')).toBe(false)
  })
})

describe('mergeConfigs', () => {
  it('merges later configs over earlier ones', () => {
    const merged = mergeConfigs<{ a?: number; b?: number; shared?: string }>(
      { a: 1, shared: 'first' },
      { b: 2, shared: 'second' },
    )
    expect(merged).toEqual({ a: 1, b: 2, shared: 'second' })
  })
})

describe('getAppHookFiles', () => {
  it('returns hook files sorted by app idx', () => {
    const appsDir = mkdtempSync(join(tmpdir(), 'flyin-apps-'))
    const orderMap = { alpha: 1, beta: 0 }

    for (const app of ['alpha', 'beta']) {
      const appRoot = join(appsDir, app, app)
      mkdirSync(appRoot, { recursive: true })
      writeFileSync(join(appRoot, 'hooks.py'), 'flyin = { "slots": {} }')
    }

    const hookFiles = getAppHookFiles(appsDir, orderMap)
    expect(hookFiles.map(entry => entry.appName)).toEqual(['beta', 'alpha'])

    rmSync(appsDir, { recursive: true, force: true })
  })
})

describe('build host selection', () => {
  let benchDir: string
  let appsDir: string
  let sitesDir: string

  beforeEach(() => {
    benchDir = mkdtempSync(join(tmpdir(), 'flyin-bench-'))
    appsDir = join(benchDir, 'apps')
    sitesDir = join(benchDir, 'sites')
    mkdirSync(appsDir)
    mkdirSync(sitesDir)
  })

  afterEach(() => {
    rmSync(benchDir, { recursive: true, force: true })
  })

  function writeApp(
    appName: string,
    hooks: string,
    idx: number,
  ) {
    const appRoot = join(appsDir, appName, appName)
    mkdirSync(appRoot, { recursive: true })
    writeFileSync(join(appRoot, 'hooks.py'), hooks)
    writeFileSync(
      join(sitesDir, 'apps.json'),
      JSON.stringify({
        ...existsAppsJson(),
        [appName]: { idx },
      }),
    )
  }

  function existsAppsJson(): Record<string, { idx: number }> | null {
    try {
      return JSON.parse(
        readFileSync(join(sitesDir, 'apps.json'), 'utf-8'),
      )
    } catch {
      return null
    }
  }

  it('selects explicit build host when only one declares it', () => {
    writeApp(
      'app_a',
      `flyin = { 'slots': { 'a': { 'title': 'A', 'component': './A.vue' } } }`,
      0,
    )
    writeApp(
      'app_b',
      `flyin = { 'slots': { 'b': { 'title': 'B', 'component': './B.vue' } } }
flyin_build_host = True`,
      1,
    )

    expect(getBuildHostApp({ appsDir, sitesDir })).toBe('app_b')
  })

  it('falls back to last app when no explicit host', () => {
    writeApp(
      'app_a',
      `flyin = { 'slots': { 'a': { 'title': 'A', 'component': './A.vue' } } }`,
      0,
    )
    writeApp(
      'app_b',
      `flyin = { 'slots': { 'b': { 'title': 'B', 'component': './B.vue' } } }`,
      1,
    )

    expect(getBuildHostApp({ appsDir, sitesDir })).toBe('app_b')
  })

  it('merges slots from all participating apps', () => {
    writeApp(
      'app_a',
      `flyin = { 'slots': { 'a': { 'title': 'A', 'component': './A.vue' } } }`,
      0,
    )
    writeApp(
      'app_b',
      `flyin = { 'slots': { 'b': { 'title': 'B', 'component': './B.vue' } } }`,
      1,
    )

    const merged = getMergedFlyinConfig({ appsDir, sitesDir })
    expect(Object.keys(merged.slots).sort()).toEqual(['a', 'b'])
  })

  it('excludes flyin slots from apps not installed on the default site', () => {
    writeApp(
      'app_a',
      `flyin = { 'slots': { 'a': { 'title': 'A', 'component': './A.vue' } } }`,
      0,
    )
    writeApp(
      'app_b',
      `flyin = { 'slots': { 'b': { 'title': 'B', 'component': './B.vue' } } }`,
      1,
    )

    mkdirSync(join(sitesDir, 'test_site'), { recursive: true })
    writeFileSync(
      join(sitesDir, 'common_site_config.json'),
      JSON.stringify({ default_site: 'test_site' }),
    )
    writeFileSync(
      join(sitesDir, 'test_site', 'site_config.json'),
      JSON.stringify({ install_apps: ['app_a'] }),
    )

    const merged = getMergedFlyinConfig({ appsDir, sitesDir })
    expect(Object.keys(merged.slots)).toEqual(['a'])
    expect(getInstalledAppsForSite(sitesDir)).toEqual(new Set(['app_a']))
  })

  it('resolves relative component paths against app root', () => {
    writeApp(
      'my_app',
      `flyin = { 'slots': { 'panel': { 'title': 'Panel', 'component': './Panel.vue' } } }`,
      0,
    )

    const components = getSlotComponents({ appsDir, sitesDir })
    expect(components.panel).toBe(join(appsDir, 'my_app', 'Panel.vue'))
  })

  it('reads drawer mode from build host app', () => {
    writeApp(
      'host_app',
      `flyin = {
  'slots': { 'panel': { 'title': 'Panel', 'component': './Panel.vue' } },
  'drawer_mode': 'push',
}
flyin_build_host = True`,
      0,
    )

    expect(getFlyinDeskOptions({ appsDir, sitesDir })).toEqual({
      drawerMode: 'push',
      clickToDismiss: false,
    })
  })

  it('reads click-to-dismiss from build host app', () => {
    writeApp(
      'host_app',
      `flyin = {
  'slots': { 'panel': { 'title': 'Panel', 'component': './Panel.vue' } },
  'click_to_dismiss': True,
}
flyin_build_host = True`,
      0,
    )

    expect(getFlyinDeskOptions({ appsDir, sitesDir })).toEqual({
      drawerMode: 'overlay',
      clickToDismiss: true,
    })
  })

  it('reads navbar options from build host app', () => {
    writeApp(
      'host_app',
      `flyin = {
  'slots': { 'panel': { 'title': 'Panel', 'component': './Panel.vue' } },
  'navbar_icon': 'messages',
  'navbar_title': 'Tools',
}
flyin_build_host = True`,
      0,
    )

    expect(getFlyinDeskOptions({ appsDir, sitesDir })).toEqual({
      drawerMode: 'overlay',
      clickToDismiss: false,
      navbarIcon: 'messages',
      navbarTitle: 'Tools',
    })
  })

  it('identifies whether current app is build host', () => {
    writeApp(
      'host_app',
      `flyin = { 'slots': { 'panel': { 'title': 'Panel', 'component': './Panel.vue' } } }
flyin_build_host = True`,
      0,
    )

    expect(
      isBuildHost({
        appsDir,
        sitesDir,
        appName: 'host_app',
      }),
    ).toBe(true)
    expect(
      isBuildHost({
        appsDir,
        sitesDir,
        appName: 'other_app',
      }),
    ).toBe(false)
  })
})

describe('detectCurrentAppName', () => {
  it('returns app folder name when cwd is inside apps directory', () => {
    const benchDir = mkdtempSync(join(tmpdir(), 'flyin-detect-'))
    const appsDir = join(benchDir, 'apps')
    const appDir = join(appsDir, 'erpnext', 'erpnext')
    mkdirSync(appDir, { recursive: true })

    expect(detectCurrentAppName(appDir)).toBe('erpnext')

    rmSync(benchDir, { recursive: true, force: true })
  })

  it('returns basename when no apps directory is found', () => {
    const dir = mkdtempSync(join(tmpdir(), 'flyin-standalone-'))
    expect(detectCurrentAppName(dir)).toBe(basename(dir))
    rmSync(dir, { recursive: true, force: true })
  })
})
