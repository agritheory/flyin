import { mount } from '@vue/test-utils'
import { beforeEach, afterEach } from 'vitest'
import Flyout from '../../components/Flyout.vue'
import { useFlyin } from '../../composables/useFlyin'
import {
  createStubComponent,
  registerTestSlot,
  resetFlyinState,
} from '../../test-utils'

describe('Flyout', () => {
  beforeEach(() => {
    resetFlyinState()
  })

  afterEach(() => {
    resetFlyinState()
    document.body.classList.remove('flyin-drawer-open', 'flyin-drawer-push')
    document.body.style.overflow = ''
  })

  it('renders closed by default', () => {
    registerTestSlot('inbox')
    const wrapper = mount(Flyout, { attachTo: document.body })

    expect(wrapper.find('.flyout-drawer--open').exists()).toBe(false)

    wrapper.unmount()
  })

  it('opens drawer and renders active slot component', async () => {
    const Panel = createStubComponent('InboxPanel')
    const flyin = registerTestSlot('inbox', { title: 'Inbox', component: Panel })

    flyin.open('inbox', { messageId: '123' })

    const wrapper = mount(Flyout, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.flyout-drawer--open').exists()).toBe(true)
    expect(wrapper.find('.stub-component').text()).toBe('InboxPanel')

    wrapper.unmount()
  })

  it('shows overlay when configured and closes on overlay click', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    const wrapper = mount(Flyout, {
      attachTo: document.body,
      props: { showOverlay: true },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.flyout-overlay--visible').exists()).toBe(true)

    await wrapper.find('.flyout-overlay').trigger('click')

    expect(flyin.isOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('closes on Escape key', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    mount(Flyout, { attachTo: document.body })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(flyin.isOpen.value).toBe(false)
  })

  it('locks body scroll when overlay mode is enabled', async () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    const wrapper = mount(Flyout, {
      attachTo: document.body,
      props: { showOverlay: true },
    })
    await wrapper.vm.$nextTick()

    expect(document.body.style.overflow).toBe('hidden')

    flyin.close()
    await wrapper.vm.$nextTick()

    expect(document.body.style.overflow).toBe('')

    wrapper.unmount()
  })

  it('switches slots from header tabs', async () => {
    registerTestSlot('inbox', { title: 'Inbox' })
    registerTestSlot('search', { title: 'Search', component: createStubComponent('SearchPanel') })
    const flyin = useFlyin()
    flyin.open('inbox')

    const wrapper = mount(Flyout, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)

    await tabs[1].trigger('click')
    await wrapper.vm.$nextTick()

    expect(flyin.activeSlot.value).toBe('search')
    expect(wrapper.find('.stub-component').text()).toBe('SearchPanel')

    wrapper.unmount()
  })
})
