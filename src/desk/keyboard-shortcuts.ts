/**
 * Ctrl+Shift+X toggles the drawer.
 *
 * Do not use these families — the browser or Frappe handles them before the page,
 * or they sit on a reserved letter:
 * - Ctrl+A select all; Ctrl+Shift+A Chrome tab search
 * - Ctrl+F find; Ctrl+Shift+F workspace search
 * - Ctrl+W / Ctrl+Shift+W close tab or window; Ctrl+Shift+Q Firefox quit; Alt+F4 close window
 * - Alt+letter Frappe menu accelerators (Actions, workflow)
 * - Ctrl+Shift+. / Ctrl+Shift+, Frappe next/previous document (and browser zoom on .)
 * - Ctrl+Shift+T/N/B/O/M/J/R/G Chrome or Frappe globals
 */
export const DEFAULT_TOGGLE_SHORTCUT = 'ctrl+shift+x'

export const SLOT_PREVIOUS_SHORTCUT = 'ctrl+shift+['
export const SLOT_NEXT_SHORTCUT = 'ctrl+shift+]'

export interface ParsedShortcut {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  key: string
}

export function parseShortcut(spec: string): ParsedShortcut {
  const parts = spec
    .toLowerCase()
    .split('+')
    .map(part => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    throw new Error('[flyin] Shortcut must include at least one key')
  }

  const parsed: ParsedShortcut = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    key: '',
  }

  for (const part of parts) {
    if (part === 'ctrl' || part === 'control') {
      parsed.ctrl = true
      continue
    }
    if (part === 'alt' || part === 'option') {
      parsed.alt = true
      continue
    }
    if (part === 'shift') {
      parsed.shift = true
      continue
    }
    if (part === 'meta' || part === 'cmd' || part === 'command') {
      parsed.meta = true
      continue
    }
    if (parsed.key) {
      throw new Error(`[flyin] Multiple key tokens in shortcut "${spec}"`)
    }
    parsed.key = normalizeShortcutKey(part)
  }

  if (!parsed.key) {
    throw new Error(`[flyin] Shortcut "${spec}" is missing a key`)
  }

  return parsed
}

function normalizeShortcutKey(token: string): string {
  if (token === 'esc' || token === 'escape') return 'escape'
  if (token === 'space' || token === 'spacebar') return ' '
  if (token.length === 1) return token
  return token
}

function modifiersMatch(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const ctrlOrCmd = event.ctrlKey || event.metaKey
  if (parsed.ctrl) {
    if (!ctrlOrCmd) return false
  } else if (ctrlOrCmd) {
    return false
  }

  if (parsed.meta && !event.metaKey) return false
  if (!parsed.meta && event.metaKey && !parsed.ctrl) return false

  if (parsed.alt !== event.altKey) return false
  if (parsed.shift !== event.shiftKey) return false
  return true
}

function matchesShortcutKey(event: KeyboardEvent, key: string): boolean {
  const eventKey = normalizeEventKey(event.key)
  if (eventKey === key) return true

  if (key.length === 1 && /^[a-z0-9]$/.test(key)) {
    const code = `Key${key.toUpperCase()}`
    if (event.code === code) return true
  }

  if (key === '[' && event.code === 'BracketLeft') return true
  if (key === ']' && event.code === 'BracketRight') return true

  return false
}

export function matchesShortcut(event: KeyboardEvent, spec: string): boolean {
  const parsed = parseShortcut(spec)
  if (!modifiersMatch(event, parsed)) return false
  return matchesShortcutKey(event, parsed.key)
}

function normalizeEventKey(key: string): string {
  if (key.length === 1) return key.toLowerCase()
  return key.toLowerCase()
}

/** Human-readable key labels for UI hints (e.g. footer kbd elements). */
export function shortcutHintParts(spec: string = DEFAULT_TOGGLE_SHORTCUT): string[] {
  const parsed = parseShortcut(spec)
  const labels: string[] = []
  if (parsed.ctrl) labels.push('Ctrl')
  if (parsed.meta) labels.push('⌘')
  if (parsed.alt) labels.push('Alt')
  if (parsed.shift) labels.push('Shift')
  labels.push(parsed.key.length === 1 ? parsed.key.toUpperCase() : titleCaseKey(parsed.key))
  return labels
}

function titleCaseKey(key: string): string {
  if (key === '[') return '['
  if (key === ']') return ']'
  return key.charAt(0).toUpperCase() + key.slice(1)
}
