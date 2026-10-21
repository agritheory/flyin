import { mount } from '@vue/test-utils'
import { afterEach } from 'vitest'
import FlyinToggleShortcutHint from '../../src/components/FlyinToggleShortcutHint.vue'

afterEach(() => {
  delete window.frappe
})

describe('FlyinToggleShortcutHint', () => {
  it('renders Mac symbols for the default toggle chord', () => {
    const wrapper = mount(FlyinToggleShortcutHint, {
      props: { label: 'Toggle drawer:', mac: true },
    })

    expect(wrapper.text()).toContain('Toggle drawer:')
    expect(wrapper.findAll('kbd').map(key => key.text())).toEqual(['⌘', '⇧', 'X'])
  })

  it('renders a custom chord with words when mac is false', () => {
    const wrapper = mount(FlyinToggleShortcutHint, {
      props: { shortcut: 'ctrl+alt+k', mac: false },
    })

    expect(wrapper.findAll('kbd').map(key => key.text())).toEqual(['Ctrl', 'Alt', 'K'])
  })

  it('detects a Mac desk when mac is omitted', () => {
    window.frappe = {}
    Reflect.set(window.frappe, 'utils', { is_mac: () => true })

    const wrapper = mount(FlyinToggleShortcutHint, {
      props: { shortcut: 'ctrl+shift+x' },
    })

    expect(wrapper.findAll('kbd').map(key => key.text())).toEqual(['⌘', '⇧', 'X'])
  })
})
