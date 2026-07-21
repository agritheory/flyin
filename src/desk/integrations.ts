import { useFlyin } from '../composables/useFlyin'
import { useFilePreview } from '../composables/useFilePreview'
import {
  renderNavbarBadges,
  getDeskIconSvg,
  getDeskNavbarNav,
  FLYIN_NAVBAR_ROOT_ATTR,
  type FlyinNavbarDeskOptions,
} from '../plugin'
import { flyinDeskOptions } from 'virtual:flyin-desk-options'

const PREVIEWABLE_EXTENSION = /\.(pdf|png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|html?)(\?|#|$)/i

let navbarObserver: MutationObserver | null = null
let keyboardShortcutRegistered = false

function getNavbarDeskOptions(): FlyinNavbarDeskOptions {
  return {
    navbarIcon: flyinDeskOptions.navbarIcon,
    navbarTitle: flyinDeskOptions.navbarTitle,
  }
}

export { getDeskNavbarNav }

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  const editable = target.closest('input, textarea, select, [contenteditable="true"]')
  return Boolean(editable)
}

function isFlyinShortcut(event: KeyboardEvent): boolean {
  return event.ctrlKey && event.shiftKey && event.key === '.'
}

export function setupKeyboardShortcut() {
  if (keyboardShortcutRegistered) return
  keyboardShortcutRegistered = true

  const flyin = useFlyin()

  document.addEventListener('keydown', event => {
    if (!isFlyinShortcut(event)) return
    if (isEditableTarget(event.target)) return

    event.preventDefault()
    flyin.toggleDrawer()
  })

  const frappe = window.frappe as {
    ui?: {
      keys?: {
        add_shortcut?: (config: Record<string, unknown>) => void
      }
    }
  } | undefined

  frappe?.ui?.keys?.add_shortcut?.({
    shortcut: 'ctrl+shift+.',
    action: () => {
      if (isEditableTarget(document.activeElement)) return
      flyin.toggleDrawer()
    },
    description: 'Toggle flyin drawer',
    ignore_inputs: true,
  })
}

export function scheduleNavbarBadges() {
  const flyin = useFlyin()

  const render = async () => {
    const deskOptions = getNavbarDeskOptions()
    const rendered = renderNavbarBadges(flyin, deskOptions)
    if (rendered) {
      await flyin.refreshAllBadges()
    }
  }

  const frappe = window.frappe as {
    ready?: (callback: () => void) => void
    router?: { on?: (event: string, callback: () => void) => void }
  } | undefined

  if (frappe?.ready) {
    frappe.ready(render)
  } else if (document.readyState === 'complete') {
    render()
  } else {
    window.addEventListener('load', () => render(), { once: true })
  }

  // Desk scripts can load after the navbar is first painted.
  for (const delay of [250, 1000]) {
    window.setTimeout(render, delay)
  }

  frappe?.router?.on?.('change', () => {
    window.setTimeout(render, 0)
  })

  if (!navbarObserver) {
    navbarObserver = new MutationObserver(() => {
      const navbar = getDeskNavbarNav()
      if (!navbar) return

      const missingRoot = !navbar.querySelector(`[${FLYIN_NAVBAR_ROOT_ATTR}]`)
      const hasSlots = flyin.getSlots().size > 0

      if (hasSlots && missingRoot) {
        render()
      }
    })

    navbarObserver.observe(document.body, { childList: true, subtree: true })
  }
}

export function setupAttachmentPreview() {
  const preview = useFilePreview()

  document.addEventListener('click', event => {
    const target = event.target
    if (!(target instanceof Element)) return

    const previewButton = target.closest('[data-flyin-preview]')
    const attachmentLink = target.closest(
      '.attachment-row a.attached-file, .attachment-row a.ellipsis, .attachment-row a[href*="/files/"]',
    )

    if (!previewButton && !(attachmentLink instanceof HTMLAnchorElement)) return

    const row = target.closest('.attachment-row')
    const link = row?.querySelector(
      'a.attached-file, a.ellipsis, a[href*="/files/"]',
    ) as HTMLAnchorElement | null
    if (!link) return

    const url = link.getAttribute('href')
    if (!url || !PREVIEWABLE_EXTENSION.test(url)) return

    event.preventDefault()
    preview.show({
      url,
      title: link.textContent?.trim() || 'Preview',
    })
  })

  const observer = new MutationObserver(() => {
    addPreviewTriggers()
  })

  observer.observe(document.body, { childList: true, subtree: true })
  addPreviewTriggers()
}

function addPreviewTriggers() {
  const preview = useFilePreview()
  if (!preview) return

  for (const row of document.querySelectorAll('.attachment-row')) {
    if (row.querySelector('[data-flyin-preview]')) continue

    const link = row.querySelector(
      'a.attached-file, a.ellipsis, a[href*="/files/"]',
    ) as HTMLAnchorElement | null
    if (!link) continue

    const url = link.getAttribute('href')
    if (!url || !PREVIEWABLE_EXTENSION.test(url)) continue

    const trigger = document.createElement('span')
    trigger.className = 'flyin-attachment-preview'
    trigger.dataset.flyinPreview = 'true'
    trigger.title = 'Preview'
    trigger.setAttribute('role', 'button')
    trigger.setAttribute('tabindex', '0')
    trigger.innerHTML = getDeskIconSvg('search')

    const pillContent = row.querySelector('.data-pill .flex.align-center.ellipsis')
    if (pillContent) {
      pillContent.insertBefore(trigger, pillContent.firstChild)
      continue
    }

    const pill = row.querySelector('.data-pill')
    if (pill) {
      pill.insertBefore(trigger, pill.firstChild)
    } else {
      row.prepend(trigger)
    }
  }
}

export function setupFlyinDeepLinks() {
  const flyin = useFlyin()

  const consumeFlyinDeepLink = () => {
    const routeOptions = (window.frappe?.route_options || {}) as Record<string, string>
    const slotId = routeOptions.flyin
    if (!slotId || !flyin.getSlot(slotId)) return

    const openProps: Record<string, unknown> = {}
    if (routeOptions.approval_todo) {
      openProps.approvalTodo = routeOptions.approval_todo
    }

    window.setTimeout(() => {
      flyin.open(slotId, openProps)
    }, 0)

    delete routeOptions.flyin
    delete routeOptions.approval_todo

    const url = new URL(window.location.href)
    let changed = false
    for (const key of ['flyin', 'approval_todo']) {
      if (!url.searchParams.has(key)) continue
      url.searchParams.delete(key)
      changed = true
    }
    if (changed) {
      window.history.replaceState({}, '', url.toString())
    }
  }

  const frappe = window.frappe as {
    ready?: (callback: () => void) => void
    router?: { on?: (event: string, callback: () => void) => void }
  } | undefined

  if (frappe?.ready) {
    frappe.ready(() => {
      window.setTimeout(consumeFlyinDeepLink, 0)
    })
  }

  frappe?.router?.on?.('change', () => {
    window.setTimeout(consumeFlyinDeepLink, 150)
  })
}

export function setupDeskIntegrations() {
  scheduleNavbarBadges()
  setupKeyboardShortcut()
  setupAttachmentPreview()
  setupFlyinDeepLinks()
}
