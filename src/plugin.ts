import type { App } from 'vue'
import type { FlyinPluginOptions, FlyinSlotConfig, PreviewPluginOptions } from './types'
import { useFlyin } from './composables/useFlyin'
import Flyout from './components/Flyout.vue'
import FilePreview from './components/FilePreview.vue'

export const FLYIN_NAVBAR_ROOT_ATTR = 'data-flyin-root'
export const DEFAULT_FLYIN_NAVBAR_ICON = 'flyin'
export const FLYIN_SHORTCUT_LABEL = 'Ctrl+Shift+.'

export interface FlyinNavbarDeskOptions {
  navbarIcon?: string
  navbarTitle?: string
}

const icons: Record<string, string> = {
  flyin:
    '<svg class="icon icon-sm" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>',
  autoreader:
    '<svg class="icon icon-sm" width="18" height="18" aria-hidden="true"><use href="#icon-autoreader"></use></svg>',
  approvals:
    '<svg class="icon icon-sm" width="18" height="18" aria-hidden="true"><use href="#icon-approvals"></use></svg>',
  communications:
    '<svg class="icon icon-sm" width="18" height="18" aria-hidden="true"><use href="#icon-communications"></use></svg>',
  'alert-triangle':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  'mail-warning':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  'check-circle':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  'file-text':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  clipboard:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  'message-circle':
    '<svg class="icon icon-sm" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  messages:
    '<svg class="icon icon-sm" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  'shopping-cart':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  search:
    '<svg class="flyin-preview-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  shipping:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  wizard:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 19.5c0-1 4.2-1.8 9.5-1.8s9.5.8 9.5 1.8"/><path d="M12 4.5c-4 .8-6.5 7-7 15"/><path d="M12 4.5c3.5 1 6 6.5 7 15"/><path d="M16.5 8.5c1.5-.8 3-.5 4 1"/></svg>',
  manufacturing:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 19.5c0-1 4.2-1.8 9.5-1.8s9.5.8 9.5 1.8"/><path d="M12 4.5c-4 .8-6.5 7-7 15"/><path d="M12 4.5c3.5 1 6 6.5 7 15"/><path d="M16.5 8.5c1.5-.8 3-.5 4 1"/></svg>',
  'wizard-hat':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 16.3C8 11 9.2 6.6 11.8 3.9"/><path d="M11.8 3.9c1.9-1.9 4.7-1 4.8 1.3 0 1-.7 1.8-1.8 1.9"/><path d="M14.6 7c.5 3.2 1 6.3 1.9 9.3"/><path d="M3 18.2c0 1.2 4 2.1 9 2.1s9-.9 9-2.1-4-2.1-9-2.1-9 .9-9 2.1z"/></svg>',
  'wizard-cauldron':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11c0 5.2 3.1 8.5 7 8.5s7-3.3 7-8.5"/><path d="M4 10.5c0-1.5 3.6-2.5 8-2.5s8 1 8 2.5S16.4 13 12 13 4 12 4 10.5z"/><path d="M10.8 8v-1.3h2.4V8"/><path d="M8.4 19.2 7 21.4"/><path d="M15.6 19.2 17 21.4"/><circle cx="8.6" cy="4.6" r="1"/><circle cx="12" cy="3.2" r="1.3"/><circle cx="15.4" cy="4.6" r="1"/></svg>',
  'wizard-staff':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21C7 15 9.4 11.7 11.4 9.4"/><path d="M11.4 9.4c-1.3-1.8-.2-4.5 2.4-4.9 2.5-.4 4.3 1.8 3.6 4.1-.6 1.8-2.9 2.4-4.2 1.1-1-1-.6-2.6.8-2.9 1-.2 1.7.7 1.5 1.6"/><path d="M14.2 1.6v1.7"/><path d="M19.6 3.4l-1.2 1.2"/><path d="M21.4 8.6l-1.7.4"/><path d="M9.5 2.6l1 1.3"/><path d="M6.6 6.9l1.6.6"/></svg>',
}

export function resolveNavbarTriggerDisplay(
  slots: Map<string, FlyinSlotConfig>,
  deskOptions: FlyinNavbarDeskOptions = {},
): { icon?: string; title: string } {
  const slotList = Array.from(slots.values())
  const fallbackIcon = deskOptions.navbarIcon || DEFAULT_FLYIN_NAVBAR_ICON
  const fallbackTitle = deskOptions.navbarTitle || 'Flyin'

  if (slotList.length === 0) {
    return { icon: fallbackIcon, title: fallbackTitle }
  }

  if (slotList.length === 1) {
    const slot = slotList[0]
    return {
      icon: slot.icon || fallbackIcon,
      title: deskOptions.navbarTitle || slot.title,
    }
  }

  return {
    icon: fallbackIcon,
    title: fallbackTitle,
  }
}

export function getAggregateBadgeCount(flyin: ReturnType<typeof useFlyin>): number {
  let total = 0
  for (const config of flyin.getSlots().values()) {
    total += config.badgeCount ?? 0
  }
  return total
}

export function getDeskIconSvg(iconName: string): string {
  return icons[iconName] || ''
}

function getIconSvg(iconName: string): string {
  return getDeskIconSvg(iconName)
}

export function getDeskNavbarNav(): HTMLElement | null {
  return document.querySelector(
    '.navbar.navbar-expand .collapse.navbar-collapse > ul.navbar-nav',
  )
}

function ensureNavbarBadge(item: Element, count: number) {
  const trigger = item.querySelector('.flyin-trigger')
  if (!trigger) return

  let badge = trigger.querySelector('.badge') as HTMLElement | null
  if (!badge) {
    badge = document.createElement('span')
    badge.className = 'badge'
    trigger.appendChild(badge)
  }

  if (count > 0) {
    badge.textContent = String(count)
    badge.style.display = ''
  } else {
    badge.style.display = 'none'
  }
}

function syncNavbarTriggerIcon(item: Element, config: { title: string; icon?: string }) {
  const trigger = item.querySelector<HTMLElement>('.flyin-trigger')
  if (!trigger) return

  trigger.title = `${config.title} (${FLYIN_SHORTCUT_LABEL})`

  const iconHtml = config.icon ? getIconSvg(config.icon) : ''
  const iconEl = trigger.querySelector('svg, .icon')

  if (iconHtml) {
    if (iconEl) {
      iconEl.outerHTML = iconHtml
    } else {
      trigger.insertAdjacentHTML('afterbegin', iconHtml)
    }
  } else if (iconEl) {
    iconEl.remove()
  }
}

function attachNavbarTriggerHandlers(
  trigger: HTMLElement,
  flyin: ReturnType<typeof useFlyin>,
) {
  trigger.addEventListener('click', () => flyin.toggleDrawer())
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      flyin.toggleDrawer()
    }
  })
}

function removeLegacyNavbarSlotItems(navbar: Element) {
  for (const legacyItem of navbar.querySelectorAll('[data-flyin-slot]')) {
    legacyItem.remove()
  }
}

export function syncNavbarRootBadge(
  flyin: ReturnType<typeof useFlyin>,
  deskOptions: FlyinNavbarDeskOptions = {},
) {
  const navbar = getDeskNavbarNav()
  if (!navbar) return

  const item = navbar.querySelector(`[${FLYIN_NAVBAR_ROOT_ATTR}]`)
  if (!item) return

  syncNavbarTriggerIcon(item, resolveNavbarTriggerDisplay(flyin.getSlots(), deskOptions))
  ensureNavbarBadge(item, getAggregateBadgeCount(flyin))
}

export function renderNavbarBadges(
  flyin: ReturnType<typeof useFlyin>,
  deskOptions: FlyinNavbarDeskOptions = {},
) {
  const navbar = getDeskNavbarNav()

  if (!navbar) {
    console.warn('[flyin] Desk navbar element not found for badge rendering')
    return false
  }

  if (flyin.getSlots().size === 0) {
    removeLegacyNavbarSlotItems(navbar)
    navbar.querySelector(`[${FLYIN_NAVBAR_ROOT_ATTR}]`)?.remove()
    return true
  }

  removeLegacyNavbarSlotItems(navbar)

  const display = resolveNavbarTriggerDisplay(flyin.getSlots(), deskOptions)
  let item = navbar.querySelector(`[${FLYIN_NAVBAR_ROOT_ATTR}]`)

  if (!item) {
    const navItem = document.createElement('li')
    navItem.className = 'nav-item flyin-nav-item'
    navItem.setAttribute(FLYIN_NAVBAR_ROOT_ATTR, 'true')
    item = navItem

    const trigger = document.createElement('span')
    trigger.className = 'flyin-trigger nav-link text-muted'
    trigger.setAttribute('role', 'button')
    trigger.setAttribute('tabindex', '0')
    trigger.title = `${display.title} (${FLYIN_SHORTCUT_LABEL})`
    trigger.innerHTML = `
      ${display.icon && getIconSvg(display.icon) ? getIconSvg(display.icon) : ''}
      <span class="badge" style="display: none;"></span>
    `
    attachNavbarTriggerHandlers(trigger, flyin)
    item.appendChild(trigger)

    const notifications = navbar.querySelector('.dropdown-notifications')
    if (!notifications) {
      navbar.insertBefore(item, navbar.firstElementChild)
    } else {
      navbar.insertBefore(item, notifications)
    }
  } else {
    syncNavbarTriggerIcon(item, display)
  }

  ensureNavbarBadge(item, getAggregateBadgeCount(flyin))

  return true
}

export function updateBadgeCount(
  slotId: string,
  count: number,
  flyin?: ReturnType<typeof useFlyin>,
  deskOptions: FlyinNavbarDeskOptions = {},
) {
  const slot = flyin?.getSlot(slotId)
  if (slot) {
    slot.badgeCount = count
  }

  if (flyin) {
    syncNavbarRootBadge(flyin, deskOptions)
    return
  }

  syncNavbarRootBadge(useFlyin(), deskOptions)
}

export const PreviewPlugin = {
  install(app: App, options: PreviewPluginOptions = {}) {
    const { teleportTo = 'body' } = options

    if (typeof window !== 'undefined' && window.flyin?.mounted) {
      return
    }

    app.component('FilePreview', FilePreview)
    app.provide('filePreviewTeleport', teleportTo)
  },
}

export const FlyinPlugin = {
  install(app: App, options: FlyinPluginOptions = {}) {
    const {
      teleportTo = 'body',
      previewPosition = 'right',
      drawerWidth = '380px',
      drawerMode = 'overlay',
      zIndex = { drawer: 1050, preview: 1000 },
      renderNavbar = false,
    } = options

    if (zIndex.drawer) {
      document.documentElement.style.setProperty('--flyout-z-index', String(zIndex.drawer))
    }
    if (zIndex.preview) {
      document.documentElement.style.setProperty('--preview-z-index', String(zIndex.preview))
    }
    if (drawerWidth) {
      document.documentElement.style.setProperty('--flyout-width', drawerWidth)
    }

    app.component('Flyout', Flyout)

    const flyin = useFlyin()

    app.provide('flyin', flyin)
    app.provide('flyinOptions', {
      teleportTo,
      previewPosition,
      drawerWidth,
      drawerMode,
      zIndex,
    })

    app.config.globalProperties.$flyin = flyin
    app.config.globalProperties.$updateFlyinBadge = (slotId: string, count: number) => {
      updateBadgeCount(slotId, count, flyin)
    }

    if (renderNavbar && typeof document !== 'undefined') {
      const render = () => renderNavbarBadges(flyin)
      if (document.readyState === 'complete') {
        render()
      } else {
        document.addEventListener('DOMContentLoaded', render)
      }
    }
  },
}

export const FlyoutPlugin = FlyinPlugin
