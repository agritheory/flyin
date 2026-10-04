import { mount } from '@vue/test-utils'
import { beforeEach, afterEach } from 'vitest'
import Flyout from '../../src/components/Flyout.vue'
import { useFlyin } from '../../src/composables/useFlyin'
import {
  createStubComponent,
  registerTestSlot,
  resetFlyinState,
} from '../test-utils'

describe('Flyout', () => {
  const mountedWrappers: ReturnType<typeof mount>[] = []

  function mountFlyout(options?: Parameters<typeof mount>[1]) {
    const wrapper = mount(Flyout, { attachTo: document.body, ...options })
    mountedWrappers.push(wrapper)
    return wrapper
  }

  beforeEach(() => {
    resetFlyinState()
  })

  afterEach(() => {
    while (mountedWrappers.length) {
      mountedWrappers.pop()?.unmount()
    }
    resetFlyinState()
    document.body.classList.remove('flyin-drawer-open', 'flyin-drawer-push')
    document.body.style.overflow = ''
  })

  it('renders closed by default', () => {
    registerTestSlot('inbox')
    const wrapper = mountFlyout()

    expect(wrapper.find('.flyout-drawer--open').exists()).toBe(false)
  })

  it('opens drawer and renders active slot component', async () => {
    const Panel = createStubComponent('InboxPanel')
    const flyin = registerTestSlot('inbox', { title: 'Inbox', component: Panel })

    flyin.open('inbox', { messageId: '123' })

    const wrapper = mountFlyout()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.flyout-drawer--open').exists()).toBe(true)
    expect(wrapper.find('.stub-component').text()).toBe('InboxPanel')
  })

  it('shows overlay when configured and closes on overlay click when click-to-dismiss is enabled', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')
    flyin.setClickToDismiss(true)

    const wrapper = mountFlyout({
      props: { showOverlay: true },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.flyout-overlay--visible').exists()).toBe(true)

    await wrapper.find('.flyout-overlay').trigger('click')

    expect(flyin.isOpen.value).toBe(false)
  })

  it('does not close on overlay click when click-to-dismiss is disabled', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    const wrapper = mountFlyout({
      props: { showOverlay: true },
    })
    await wrapper.vm.$nextTick()

    await wrapper.find('.flyout-overlay').trigger('click')

    expect(flyin.isOpen.value).toBe(true)
  })

  it('closes on outside click when click-to-dismiss is enabled', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')
    flyin.setClickToDismiss(true)

    const outside = document.createElement('div')
    outside.className = 'outside-target'
    document.body.appendChild(outside)

    mountFlyout()
    await Promise.resolve()

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(flyin.isOpen.value).toBe(false)

    outside.remove()
  })

  it('does not close on outside click when click-to-dismiss is disabled', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    const outside = document.createElement('div')
    outside.className = 'outside-target'
    document.body.appendChild(outside)

    mountFlyout()
    await Promise.resolve()

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(flyin.isOpen.value).toBe(true)

    outside.remove()
  })

  it('does not close when clicking inside the drawer', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')
    flyin.setClickToDismiss(true)

    const wrapper = mountFlyout()
    await wrapper.vm.$nextTick()

    await wrapper.find('.flyout-drawer__body').trigger('click')

    expect(flyin.isOpen.value).toBe(true)
  })

  it('does not close when clicking the navbar trigger', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')
    flyin.setClickToDismiss(true)

    const trigger = document.createElement('span')
    trigger.className = 'flyin-trigger'
    document.body.appendChild(trigger)

    mountFlyout()
    await Promise.resolve()

    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(flyin.isOpen.value).toBe(true)

    trigger.remove()
  })

  it('closes on Escape key', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    mountFlyout()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(flyin.isOpen.value).toBe(false)
  })

  it('locks body scroll when overlay mode is enabled', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    const wrapper = mountFlyout({
      props: { showOverlay: true },
    })
    await wrapper.vm.$nextTick()

    expect(document.body.style.overflow).toBe('hidden')

    flyin.close()
    await wrapper.vm.$nextTick()

    expect(document.body.style.overflow).toBe('')
  })

  it('cycles slots with ctrl+shift+bracket shortcuts', async () => {
    registerTestSlot('inbox', { title: 'Inbox' })
    registerTestSlot('search', { title: 'Search' })
    const flyin = useFlyin()
    flyin.open('inbox')

    mountFlyout()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: ']', ctrlKey: true, shiftKey: true, bubbles: true }),
    )

    expect(flyin.activeSlot.value).toBe('search')
  })

  it('switches slots from header tabs', async () => {
    registerTestSlot('inbox', { title: 'Inbox' })
    registerTestSlot('search', { title: 'Search', component: createStubComponent('SearchPanel') })
    const flyin = useFlyin()
    flyin.open('inbox')

    const wrapper = mountFlyout()
    await wrapper.vm.$nextTick()

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)

    await tabs[1].trigger('click')
    await wrapper.vm.$nextTick()

    expect(flyin.activeSlot.value).toBe('search')
    expect(wrapper.find('.stub-component').text()).toBe('SearchPanel')
  })
})
