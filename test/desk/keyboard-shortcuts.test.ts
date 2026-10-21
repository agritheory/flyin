import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_TOGGLE_SHORTCUT,
  formatShortcutForDisplay,
  isMacPlatform,
  matchesShortcut,
  parseShortcut,
  shortcutHintParts,
} from '../../src/desk/keyboard-shortcuts'

function keyEvent(partial: Partial<KeyboardEvent> & { key: string; code?: string }): KeyboardEvent {
  return {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    code: '',
    ...partial,
  } as KeyboardEvent
}

describe('keyboard-shortcuts', () => {
  it('parses the default toggle shortcut', () => {
    expect(parseShortcut(DEFAULT_TOGGLE_SHORTCUT)).toEqual({
      alt: false,
      shift: true,
      ctrl: true,
      meta: false,
      key: 'x',
    })
  })

  it('matches ctrl+shift+x', () => {
    expect(
      matchesShortcut(
        keyEvent({ ctrlKey: true, shiftKey: true, key: 'x' }),
        'ctrl+shift+x',
      ),
    ).toBe(true)
    expect(
      matchesShortcut(
        keyEvent({ metaKey: true, shiftKey: true, key: 'x' }),
        'ctrl+shift+x',
      ),
    ).toBe(true)
    expect(
      matchesShortcut(
        keyEvent({ ctrlKey: true, key: 'x' }),
        'ctrl+shift+x',
      ),
    ).toBe(false)
  })

  it('builds hint labels for UI copy', () => {
    expect(shortcutHintParts('ctrl+shift+x', { mac: false })).toEqual(['Ctrl', 'Shift', 'X'])
  })

  it('uses Mac symbols when asked', () => {
    expect(shortcutHintParts('ctrl+shift+alt+x', { mac: true })).toEqual(['⌘', '⌥', '⇧', 'X'])
    expect(formatShortcutForDisplay('ctrl+shift+x', { mac: true })).toBe('⌘+⇧+X')
  })

  it('keeps the command symbol for an explicit meta chord', () => {
    expect(shortcutHintParts('meta+k', { mac: false })).toEqual(['⌘', 'K'])
  })

  it('translates modifier words when the desk is not on macOS', () => {
    Reflect.set(window, '__', (message: string) => {
      if (message === 'Ctrl') return 'Strg'
      if (message === 'Shift') return 'Umschalt'
      return message
    })

    expect(shortcutHintParts('ctrl+shift+x', { mac: false })).toEqual(['Strg', 'Umschalt', 'X'])
    Reflect.deleteProperty(window, '__')
  })

  it('follows frappe.utils.is_mac when the platform is not passed', () => {
    window.frappe = {}
    Reflect.set(window.frappe, 'utils', { is_mac: () => true })

    expect(isMacPlatform()).toBe(true)
    expect(formatShortcutForDisplay('ctrl+shift+x')).toBe('⌘+⇧+X')

    delete window.frappe
  })
})

afterEach(() => {
  Reflect.deleteProperty(window, '__')
  delete window.frappe
})
