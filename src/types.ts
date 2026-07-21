import type { Component, Raw } from 'vue'
import type { UseFlyinReturn } from './composables/useFlyin'
import type { useFilePreview } from './composables/useFilePreview'

export interface FlyinSlotConfig {
  title: string
  icon?: string
  component: Raw<Component>
  badge?: () => number | Promise<number>
  badgeCount?: number
  keyboard?: boolean
  navbarPosition?: 'left' | 'right'
}

export interface FlyinPluginOptions {
  teleportTo?: string
  previewPosition?: 'left' | 'right'
  drawerWidth?: string
  drawerMode?: 'overlay' | 'push'
  zIndex?: {
    drawer?: number
    preview?: number
  }
  renderNavbar?: boolean
}

export interface PreviewPluginOptions {
  teleportTo?: string
}

export interface FilePreviewOptions {
  url?: string
  content?: string
  type?: FilePreviewType
  title?: string
}

export type FilePreviewType =
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'docx'
  | 'email'
  | 'html'

export interface FilePreviewState {
  isOpen: boolean
  url: string | null
  content: string | null
  type: FilePreviewType | null
  title: string | null
}

export interface FlyinState {
  isOpen: boolean
  activeSlot: string | null
  props: Record<string, unknown>
}

export type FlyinGlobals = UseFlyinReturn & {
  preview: ReturnType<typeof useFilePreview>
  mounted?: boolean
  setSlotContext?: (slotId: string, props: Record<string, unknown>) => void
  getSlotContext?: (slotId: string) => Record<string, unknown>
  clearSlotContext?: (slotId: string) => void
  toggleDrawer?: () => void
}

declare global {
  interface Window {
    flyin?: FlyinGlobals
    frappe?: Record<string, unknown>
  }
}

// Backward-compatible type aliases
export type FlyoutSlotConfig = FlyinSlotConfig
export type FlyoutPluginOptions = FlyinPluginOptions
export type FlyoutState = FlyinState
