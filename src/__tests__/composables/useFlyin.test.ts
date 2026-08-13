import { beforeEach, afterEach } from 'vitest'
import { useFlyin } from '../../composables/useFlyin'
import {
  createStubComponent,
  registerTestSlot,
  resetFlyinState,
} from '../../test-utils'
import { installFrappeMock, uninstallFrappeMock } from '../../test-utils/frappe-mock'

describe('useFlyin', () => {
  beforeEach(() => {
    resetFlyinState()
    installFrappeMock()
  })

  afterEach(() => {
    resetFlyinState()
    uninstallFrappeMock()
  })

  it('returns the same API instance on repeated calls', () => {
    const first = useFlyin()
    const second = useFlyin()

    expect(first).toBe(second)
  })

  it('registers and opens a slot', () => {
    const flyin = registerTestSlot('inbox')

    flyin.open('inbox', { filter: 'unread' })

    expect(flyin.isOpen.value).toBe(true)
    expect(flyin.activeSlot.value).toBe('inbox')
    expect(flyin.currentProps.value).toEqual({ filter: 'unread' })
    expect(flyin.lastActiveSlot.value).toBe('inbox')
  })

  it('warns and ignores open for unregistered slots', () => {
    const flyin = useFlyin()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    flyin.open('missing')

    expect(warn).toHaveBeenCalledWith('[flyin] Slot "missing" is not registered')
    expect(flyin.isOpen.value).toBe(false)

    warn.mockRestore()
  })

  it('closes the drawer and clears active state', () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    flyin.close()

    expect(flyin.isOpen.value).toBe(false)
    expect(flyin.activeSlot.value).toBeNull()
    expect(flyin.currentProps.value).toEqual({})
  })

  it('toggles the same slot closed when already open', () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    flyin.toggle('inbox')

    expect(flyin.isOpen.value).toBe(false)
  })

  it('switches slots when toggling a different slot', () => {
    registerTestSlot('inbox')
    registerTestSlot('search')
    const flyin = useFlyin()

    flyin.open('inbox')
    flyin.toggle('search', { query: 'abc' })

    expect(flyin.isOpen.value).toBe(true)
    expect(flyin.activeSlot.value).toBe('search')
    expect(flyin.currentProps.value).toEqual({ query: 'abc' })
  })

  it('merges slot context with open props', () => {
    const flyin = registerTestSlot('inbox')
    flyin.setSlotContext('inbox', { tenant: 'acme' })

    flyin.open('inbox', { filter: 'unread' })

    expect(flyin.currentProps.value).toEqual({ tenant: 'acme', filter: 'unread' })
  })

  it('updates live props when context changes for active slot', () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox', { filter: 'unread' })

    flyin.setSlotContext('inbox', { tenant: 'acme' })

    expect(flyin.currentProps.value).toEqual({ tenant: 'acme', filter: 'unread' })
  })

  it('clears slot context and active props', () => {
    const flyin = registerTestSlot('inbox')
    flyin.setSlotContext('inbox', { tenant: 'acme' })
    flyin.open('inbox')

    flyin.clearSlotContext('inbox')

    expect(flyin.getSlotContext('inbox')).toEqual({})
    expect(flyin.currentProps.value).toEqual({})
  })

  it('unregisters a slot and closes it when active', () => {
    const flyin = registerTestSlot('inbox')
    flyin.open('inbox')

    flyin.unregister('inbox')

    expect(flyin.getSlot('inbox')).toBeUndefined()
    expect(flyin.isOpen.value).toBe(false)
  })

  it('opens last active slot via toggleDrawer', () => {
    registerTestSlot('inbox')
    registerTestSlot('search')
    const flyin = useFlyin()

    flyin.open('search')
    flyin.close()
    flyin.toggleDrawer()

    expect(flyin.isOpen.value).toBe(true)
    expect(flyin.activeSlot.value).toBe('search')
  })

  it('prefers a slot with badge count when opening last or default', () => {
    registerTestSlot('inbox', { badgeCount: 0 })
    registerTestSlot('alerts', { badgeCount: 3 })
    const flyin = useFlyin()

    flyin.openLastOrDefault()

    expect(flyin.activeSlot.value).toBe('alerts')
  })

  it('refreshes badge count from slot badge callback', async () => {
    const flyin = registerTestSlot('inbox', {
      badge: vi.fn().mockResolvedValue(5),
    })

    await flyin.refreshBadge('inbox')

    expect(flyin.getSlot('inbox')?.badgeCount).toBe(5)
  })

  it('updates root navbar badge when refreshBadge succeeds', async () => {
    document.body.innerHTML = `
      <div class="navbar navbar-expand">
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav">
            <li data-flyin-root="true">
              <span class="flyin-trigger">
                <span class="badge"></span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    `

    const flyin = registerTestSlot('inbox', {
      badge: vi.fn().mockResolvedValue(4),
    })

    await flyin.refreshBadge('inbox')

    const badge = document.querySelector('[data-flyin-root] .badge')
    expect(badge?.textContent).toBe('4')
  })

  it('normalizes registered components with markRaw', () => {
    const component = createStubComponent('Panel')
    const flyin = registerTestSlot('panel', { component })

    expect(flyin.getSlot('panel')?.component).toBe(component)
  })

  it('updates clickToDismiss via setClickToDismiss', () => {
    const flyin = useFlyin()

    expect(flyin.clickToDismiss.value).toBe(false)

    flyin.setClickToDismiss(true)

    expect(flyin.clickToDismiss.value).toBe(true)
  })

  it('resets clickToDismiss when flyin state is reset', () => {
    const flyin = useFlyin()
    flyin.setClickToDismiss(true)

    resetFlyinState()

    expect(flyin.clickToDismiss.value).toBe(false)
  })
})
