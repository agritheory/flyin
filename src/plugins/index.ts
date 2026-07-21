export {
  getAppConfigs,
  getSlotComponents,
  getMergedFlyinConfig,
  getFlyinParticipatingApps,
  getBuildHostApp,
  detectCurrentAppName,
  isBuildHost,
  findAppsDirectory,
  findSitesDirectory,
  mergeConfigs,
  fileHasFlyinHook,
} from './hooks'
export type { FlyinHookConfig, FlyinSlotHookConfig, AppConfig } from './hooks'

export { FlyinResolver, createFlyinComponentResolver, getFlyinComponentMap } from './component'
export { FlyoutResolver, createFlyoutComponentResolver, getFlyoutComponentMap } from './component'

export { flyinDeskPlugin, defineFlyinDeskConfig, flyoutVitePlugin, flyoutComponentsPlugin } from './vite'
export type { FlyinDeskPluginOptions, FlyinDeskBuildOptions } from './vite'

export { buildIfHost } from './build'
export type { BuildIfHostOptions } from './build'

export { generateFlyinRegisterModule } from './register-codegen'

// Legacy export names
export { getSlotComponents as getComponents, getMergedFlyinConfig as getMergedConfig } from './hooks'
