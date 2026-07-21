// Components
export { Flyout, FilePreview, FlyoutHeader, FlyoutFooter } from './components'

// Composables
export { useFlyin, useFlyout, useFilePreview } from './composables'
export type { UseFlyinReturn, UseFlyoutReturn } from './composables'

// Plugins
export {
  FlyinPlugin,
  FlyoutPlugin,
  PreviewPlugin,
  updateBadgeCount,
  renderNavbarBadges,
  getDeskIconSvg,
  getDeskNavbarNav,
  FLYIN_SHORTCUT_LABEL,
} from './plugin'

// Types
export type {
  FlyinSlotConfig,
  FlyinPluginOptions,
  FlyinState,
  FlyoutSlotConfig,
  FlyoutPluginOptions,
  FlyoutState,
  FilePreviewOptions,
  FilePreviewType,
  FilePreviewState,
  PreviewPluginOptions,
  FlyinGlobals,
} from './types'

// Styles (import separately: import '@agritheory/flyin/styles.css')
