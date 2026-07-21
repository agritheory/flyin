import { ref, readonly, computed, markRaw, type Component, type ComputedRef, type DeepReadonly, type Ref } from 'vue'
import type { FlyinSlotConfig, FlyinState } from '../types'
import { syncNavbarRootBadge } from '../plugin'

export interface UseFlyinReturn {
  isOpen: ComputedRef<boolean>
  activeSlot: ComputedRef<string | null>
  activeSlotConfig: ComputedRef<FlyinSlotConfig | null>
  currentProps: ComputedRef<Record<string, unknown>>
  lastActiveSlot: ComputedRef<string | null>
  slots: DeepReadonly<Ref<Map<string, FlyinSlotConfig>>>
  state: DeepReadonly<Ref<FlyinState>>
  register: (slotId: string, config: FlyinSlotConfig) => void
  unregister: (slotId: string) => void
  open: (slotId: string, props?: Record<string, unknown>) => void
  close: () => void
  toggle: (slotId: string, props?: Record<string, unknown>) => void
  toggleDrawer: () => void
  openLastOrDefault: () => void
  getSlot: (slotId: string) => FlyinSlotConfig | undefined
  getSlots: () => Map<string, FlyinSlotConfig>
  setSlotContext: (slotId: string, props: Record<string, unknown>) => void
  getSlotContext: (slotId: string) => Record<string, unknown>
  clearSlotContext: (slotId: string) => void
  refreshBadge: (slotId: string) => Promise<void>
  refreshAllBadges: () => Promise<void>
}

const slots = ref<Map<string, FlyinSlotConfig>>(new Map())
const slotContext = ref<Map<string, Record<string, unknown>>>(new Map())
const lastActiveSlot = ref<string | null>(null)

const state = ref<FlyinState>({
  isOpen: false,
  activeSlot: null,
  props: {},
})

function mergeOpenProps(slotId: string, props: Record<string, unknown> = {}): Record<string, unknown> {
  const context = slotContext.value.get(slotId) || {}
  return { ...context, ...props }
}

let flyinApi: UseFlyinReturn | null = null

export function useFlyin(): UseFlyinReturn {
  if (flyinApi) {
    return flyinApi
  }

  const isOpen = computed(() => state.value.isOpen)
  const activeSlot = computed(() => state.value.activeSlot)
  const activeSlotConfig = computed(() => {
    if (!state.value.activeSlot) return null
    return slots.value.get(state.value.activeSlot) || null
  })
  const currentProps = computed(() => state.value.props)

  function register(slotId: string, config: FlyinSlotConfig) {
    const normalizedConfig = {
      ...config,
      component: markRaw(config.component as Component),
    }
    slots.value.set(slotId, normalizedConfig)
  }

  function unregister(slotId: string) {
    slots.value.delete(slotId)
    slotContext.value.delete(slotId)
    if (state.value.activeSlot === slotId) {
      close()
    }
  }

  function open(slotId: string, props: Record<string, unknown> = {}) {
    if (!slots.value.has(slotId)) {
      console.warn(`[flyin] Slot "${slotId}" is not registered`)
      return
    }

    lastActiveSlot.value = slotId
    state.value = {
      isOpen: true,
      activeSlot: slotId,
      props: mergeOpenProps(slotId, props),
    }
  }

  function close() {
    state.value = {
      isOpen: false,
      activeSlot: null,
      props: {},
    }
  }

  function toggle(slotId: string, props: Record<string, unknown> = {}) {
    if (state.value.isOpen && state.value.activeSlot === slotId) {
      close()
    } else {
      open(slotId, props)
    }
  }

  function openLastOrDefault() {
    const slotIds = Array.from(slots.value.keys())
    if (!slotIds.length) return

    let target = lastActiveSlot.value
    if (!target || !slots.value.has(target)) {
      for (const [id, config] of slots.value) {
        if ((config.badgeCount ?? 0) > 0) {
          target = id
          break
        }
      }
    }

    if (!target) {
      target = slotIds[0]
    }

    open(target)
  }

  function toggleDrawer() {
    if (state.value.isOpen) {
      close()
      return
    }
    openLastOrDefault()
  }

  function getSlot(slotId: string): FlyinSlotConfig | undefined {
    return slots.value.get(slotId)
  }

  function getSlots(): Map<string, FlyinSlotConfig> {
    return slots.value
  }

  function setSlotContext(slotId: string, props: Record<string, unknown>) {
    slotContext.value.set(slotId, { ...props })

    if (state.value.isOpen && state.value.activeSlot === slotId) {
      state.value = {
        ...state.value,
        props: mergeOpenProps(slotId, state.value.props),
      }
    }
  }

  function getSlotContext(slotId: string): Record<string, unknown> {
    return { ...(slotContext.value.get(slotId) || {}) }
  }

  function clearSlotContext(slotId: string) {
    slotContext.value.delete(slotId)

    if (state.value.isOpen && state.value.activeSlot === slotId) {
      state.value = {
        ...state.value,
        props: {},
      }
    }
  }

  async function refreshBadge(slotId: string) {
    const slot = slots.value.get(slotId)
    if (!slot?.badge) return

    try {
      const count = await slot.badge()
      slot.badgeCount = count
      if (flyinApi) {
        syncNavbarRootBadge(flyinApi)
      }
    } catch (error) {
      console.warn(`[flyin] Failed to refresh badge for "${slotId}"`, error)
    }
  }

  async function refreshAllBadges() {
    const promises = Array.from(slots.value.keys()).map(refreshBadge)
    await Promise.all(promises)
  }

  flyinApi = {
    isOpen,
    activeSlot,
    activeSlotConfig,
    currentProps,
    lastActiveSlot: computed(() => lastActiveSlot.value),
    slots: readonly(slots),
    state: readonly(state),
    register,
    unregister,
    open,
    close,
    toggle,
    toggleDrawer,
    openLastOrDefault,
    getSlot,
    getSlots,
    setSlotContext,
    getSlotContext,
    clearSlotContext,
    refreshBadge,
    refreshAllBadges,
  }

  return flyinApi
}

export const useFlyout = useFlyin
export type UseFlyoutReturn = UseFlyinReturn
