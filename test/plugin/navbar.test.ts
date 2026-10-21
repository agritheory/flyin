import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_TOGGLE_SHORTCUT, shortcutHintParts } from '../../src/desk/keyboard-shortcuts'
import {
  DEFAULT_FLYIN_NAVBAR_ICON,
  FLYIN_SHORTCUT_LABEL,
  getAggregateBadgeCount,
  renderNavbarBadges,
  resolveNavbarTriggerDisplay,
} from '../../src/plugin'
import type { FlyinSlotConfig } from '../../src/types'

function makeSlots(entries: Array<[string, Partial<FlyinSlotConfig>]>) {
  const slots = new Map<string, FlyinSlotConfig>()
  for (const [id, config] of entries) {
    slots.set(id, {
      title: config.title || id,
      icon: config.icon,
      component: config.component || {},
      badgeCount: config.badgeCount,
    } as FlyinSlotConfig)
  }
  return slots
}

describe('resolveNavbarTriggerDisplay', () => {
  it('uses the flyin icon when multiple slots are registered', () => {
    const slots = makeSlots([
      ['a', { title: 'A', icon: 'wizard-hat' }],
      ['b', { title: 'B', icon: 'approvals' }],
    ])

    expect(resolveNavbarTriggerDisplay(slots)).toEqual({
      icon: DEFAULT_FLYIN_NAVBAR_ICON,
      title: 'Flyin',
    })
  })

  it('uses the slot icon for a single registered slot', () => {
    const slots = makeSlots([['wizard', { title: 'Wizard', icon: 'wizard-hat' }]])

    expect(resolveNavbarTriggerDisplay(slots)).toEqual({
      icon: 'wizard-hat',
      title: 'Wizard',
    })
  })

  it('falls back to the flyin icon when a single slot has no icon', () => {
    const slots = makeSlots([['panel', { title: 'Panel' }]])

    expect(resolveNavbarTriggerDisplay(slots)).toEqual({
      icon: DEFAULT_FLYIN_NAVBAR_ICON,
      title: 'Panel',
    })
  })

  it('respects build-host navbar overrides', () => {
    const slots = makeSlots([
      ['a', { title: 'A', icon: 'wizard-hat' }],
      ['b', { title: 'B', icon: 'approvals' }],
    ])

    expect(
      resolveNavbarTriggerDisplay(slots, {
        navbarIcon: 'messages',
        navbarTitle: 'Tools',
      }),
    ).toEqual({
      icon: 'messages',
      title: 'Tools',
    })
  })
})

const NAVBAR_HTML = `
  <div class="navbar navbar-expand">
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav"></ul>
    </div>
  </div>
`

function installNonMacDesk() {
  window.frappe = {}
  Reflect.set(window.frappe, 'utils', { is_mac: () => false })
}

describe('navbar trigger tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = NAVBAR_HTML
    renderNavbarBadges({ getSlots: () => new Map() } as never, {
      toggleShortcut: '',
      navbarTitle: '',
      navbarIcon: '',
    })
    document.body.innerHTML = ''
    Reflect.deleteProperty(window, '__')
    delete window.frappe
  })

  it('uses the default toggle chord instead of the old period shortcut', () => {
    Reflect.deleteProperty(window, '__')
    expect(FLYIN_SHORTCUT_LABEL).toBe('Ctrl+Shift+X')
    expect(FLYIN_SHORTCUT_LABEL).toBe(
      shortcutHintParts(DEFAULT_TOGGLE_SHORTCUT, { mac: false }).join('+'),
    )
  })

  it('builds the tooltip from the slot title and the configured shortcut', () => {
    installNonMacDesk()
    Reflect.set(window, '__', (message: string) => (message === 'AutoReader' ? 'Lecteur' : message))
    document.body.innerHTML = NAVBAR_HTML
    const slots = makeSlots([['autoreader', { title: 'AutoReader', icon: 'autoreader' }]])

    renderNavbarBadges(
      { getSlots: () => slots, toggleDrawer: () => {} } as never,
      { toggleShortcut: 'ctrl+alt+k' },
    )

    expect(document.querySelector('.flyin-trigger')?.getAttribute('title')).toBe('Lecteur (Ctrl+Alt+K)')
  })

  it('keeps a configured shortcut when navbar badges render again without one', () => {
    installNonMacDesk()
    document.body.innerHTML = NAVBAR_HTML
    const slots = makeSlots([['wizard', { title: 'Wizard', icon: 'wizard-hat' }]])
    const flyin = { getSlots: () => slots, toggleDrawer: () => {} } as never

    renderNavbarBadges(flyin, { toggleShortcut: 'ctrl+shift+x', navbarTitle: 'Shipping' })
    renderNavbarBadges(flyin)

    expect(document.querySelector('.flyin-trigger')?.getAttribute('title')).toBe(
      'Shipping (Ctrl+Shift+X)',
    )
  })
})

describe('getAggregateBadgeCount', () => {
  it('sums badge counts across slots', () => {
    const slots = makeSlots([
      ['a', { badgeCount: 2 }],
      ['b', { badgeCount: 5 }],
      ['c', { badgeCount: 0 }],
    ])

    expect(
      getAggregateBadgeCount({
        getSlots: () => slots,
      } as never),
    ).toBe(7)
  })
})
