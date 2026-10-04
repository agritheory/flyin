import { mount } from '@vue/test-utils'
import FlyoutHeader from '../../src/components/FlyoutHeader.vue'

describe('FlyoutHeader', () => {
  it('renders a single title when only one slot is provided', () => {
    const wrapper = mount(FlyoutHeader, {
      props: {
        title: 'Inbox',
        icon: 'file-text',
        slotList: [{ id: 'inbox', title: 'Inbox', icon: 'file-text' }],
        activeSlotId: 'inbox',
      },
    })

    expect(wrapper.find('.flyout-drawer__title').text()).toContain('Inbox')
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
  })

  it('renders tabs when multiple slots are provided', () => {
    const wrapper = mount(FlyoutHeader, {
      props: {
        slotList: [
          { id: 'inbox', title: 'Inbox', icon: 'file-text' },
          { id: 'search', title: 'Search', icon: 'search' },
        ],
        activeSlotId: 'inbox',
      },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].classes()).toContain('flyout-header-tabs__tab--active')
  })

  it('emits select when a tab is clicked', async () => {
    const wrapper = mount(FlyoutHeader, {
      props: {
        slotList: [
          { id: 'inbox', title: 'Inbox' },
          { id: 'search', title: 'Search' },
        ],
        activeSlotId: 'inbox',
      },
    })

    await wrapper.findAll('[role="tab"]')[1].trigger('click')

    expect(wrapper.emitted('select')).toEqual([['search']])
  })

  it('shows capped badge counts in tabs', () => {
    const wrapper = mount(FlyoutHeader, {
      props: {
        slotList: [
          { id: 'inbox', title: 'Inbox', badgeCount: 120 },
          { id: 'search', title: 'Search', badgeCount: 2 },
        ],
        activeSlotId: 'inbox',
      },
    })

    expect(wrapper.find('.flyout-header-tabs__badge').text()).toBe('99+')
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = mount(FlyoutHeader, {
      props: {
        title: 'Inbox',
        slotList: [{ id: 'inbox', title: 'Inbox' }],
        activeSlotId: 'inbox',
      },
    })

    await wrapper.find('.flyout-drawer__close').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
