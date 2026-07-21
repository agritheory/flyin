import { defineComponent, h } from 'vue'
import { useFlyin } from '../composables/useFlyin'
import { useFilePreview } from '../composables/useFilePreview'

export function createStubComponent(name = 'StubComponent') {
  return defineComponent({
    name,
    setup(_, { emit }) {
      return () => h('div', { class: 'stub-component', onClick: () => emit('close') }, name)
    },
  })
}

export function resetFlyinState() {
  const flyin = useFlyin()
  flyin.close()
  for (const slotId of Array.from(flyin.getSlots().keys())) {
    flyin.unregister(slotId)
  }
}

export function resetFilePreviewState() {
  useFilePreview().close()
}

export function registerTestSlot(
  slotId: string,
  overrides: Partial<Parameters<ReturnType<typeof useFlyin>['register']>[1]> = {},
) {
  const flyin = useFlyin()
  flyin.register(slotId, {
    title: overrides.title ?? `Slot ${slotId}`,
    icon: overrides.icon,
    component: overrides.component ?? createStubComponent(slotId),
    badge: overrides.badge,
    badgeCount: overrides.badgeCount,
    keyboard: overrides.keyboard,
    navbarPosition: overrides.navbarPosition,
  })
  return flyin
}
