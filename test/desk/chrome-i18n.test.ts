import { afterEach, describe, expect, it } from 'vitest'
import { addPreviewTriggers, flyinDrawerShortcutDescription } from '../../src/desk/integrations'

describe('desk chrome strings', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, '__')
    document.body.innerHTML = ''
  })

  it('translates the Frappe shortcut description', () => {
    Reflect.set(window, '__', (message: string) =>
      message === 'Toggle flyin drawer' ? 'Basculer le tiroir' : message,
    )

    expect(flyinDrawerShortcutDescription()).toBe('Basculer le tiroir')
  })

  it('translates attachment preview triggers', () => {
    Reflect.set(window, '__', (message: string) => (message === 'Preview' ? 'Aperçu' : message))
    document.body.innerHTML = `
      <div class="attachment-row">
        <a class="attached-file" href="/files/invoice.pdf">invoice.pdf</a>
      </div>
    `

    addPreviewTriggers()

    expect(document.querySelector('[data-flyin-preview]')?.getAttribute('title')).toBe('Aperçu')
  })
})
