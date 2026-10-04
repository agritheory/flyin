import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TOGGLE_SHORTCUT,
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
    expect(shortcutHintParts('ctrl+shift+x')).toEqual(['Ctrl', 'Shift', 'X'])
  })
})
