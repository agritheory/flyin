import { afterEach, describe, expect, it } from 'vitest'
import { translateFlyinText } from '../src/translate'

describe('translateFlyinText', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, '__')
    delete window.frappe
  })

  it('returns the msgid when Frappe translate is not loaded', () => {
    expect(translateFlyinText('Pending Approvals')).toBe('Pending Approvals')
  })

  it('prefers window.__', () => {
    Reflect.set(window, '__', (message: string) =>
      message === 'Pending Approvals' ? 'Approbations en attente' : message,
    )
    window.frappe = {}
    Reflect.set(window.frappe, '__', () => 'ignored')

    expect(translateFlyinText('Pending Approvals')).toBe('Approbations en attente')
  })

  it('falls back to frappe.__', () => {
    window.frappe = {}
    Reflect.set(window.frappe, '__', (message: string) => (message === 'Close' ? 'Fermer' : message))

    expect(translateFlyinText('Close')).toBe('Fermer')
  })
})
