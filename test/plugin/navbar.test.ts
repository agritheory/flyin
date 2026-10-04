import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FLYIN_NAVBAR_ICON,
  getAggregateBadgeCount,
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
