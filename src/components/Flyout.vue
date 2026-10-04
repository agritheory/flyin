<template>
  <Teleport :to="teleportTo">
    <!-- Optional overlay -->
    <div
      v-if="showOverlay"
      class="flyout-overlay"
      :class="{ 'flyout-overlay--visible': flyout.isOpen.value }"
      @click="handleOverlayClick"
    />

    <!-- Drawer -->
    <div
      ref="drawerEl"
      class="flyout-drawer"
      :class="{ 'flyout-drawer--open': flyout.isOpen.value }"
      :style="{ width: drawerWidth }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="flyout.activeSlot.value ? `flyout-title-${flyout.activeSlot.value}` : undefined"
    >
      <FlyoutHeader
        v-if="flyout.activeSlotConfig.value"
        :id="`flyout-title-${flyout.activeSlot.value}`"
        :title="flyout.activeSlotConfig.value.title"
        :icon="flyout.activeSlotConfig.value.icon"
        :slot-list="headerSlots"
        :active-slot-id="flyout.activeSlot.value"
        @select="selectSlot"
        @close="flyout.close"
      />

      <div class="flyout-drawer__body">
        <div v-if="activeComponent" class="flyout-drawer__slot">
          <component
            :is="activeComponent"
            :key="flyout.activeSlot.value ?? undefined"
            v-bind="flyout.currentProps.value"
            @close="flyout.close"
          >
            <template v-if="$slots.actions" #actions>
              <slot name="actions" />
            </template>
          </component>
        </div>
        <slot v-else />
      </div>

      <FlyoutFooter v-if="$slots.footer">
        <slot name="footer" />
      </FlyoutFooter>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch, type Component as VueComponent } from 'vue'
import { useFlyin } from '../composables/useFlyin'
import { FLYIN_NAVBAR_ROOT_ATTR } from '../plugin'
import FlyoutHeader from './FlyoutHeader.vue'
import FlyoutFooter from './FlyoutFooter.vue'
import { matchesShortcut, SLOT_NEXT_SHORTCUT, SLOT_PREVIOUS_SHORTCUT } from '../desk/keyboard-shortcuts'

interface FlyinInjectedOptions {
  teleportTo?: string
  drawerWidth?: string
  drawerMode?: 'overlay' | 'push'
}

const props = withDefaults(
  defineProps<{
    teleportTo?: string
    drawerWidth?: string
    showOverlay?: boolean
  }>(),
  {
    teleportTo: 'body',
    drawerWidth: 'var(--flyout-width, 380px)',
    showOverlay: false,
  }
)

const flyout = useFlyin()
const drawerEl = ref<HTMLElement | null>(null)
const injectedOptions = inject<FlyinInjectedOptions>('flyinOptions', {})
const drawerMode = computed(() => injectedOptions.drawerMode ?? 'overlay')

const headerSlots = computed(() =>
  Array.from(flyout.getSlots().entries()).map(([id, config]) => ({
    id,
    title: config.title,
    icon: config.icon,
    badgeCount: config.badgeCount,
  })),
)

const activeComponent = computed(() => {
  const config = flyout.activeSlotConfig.value
  if (!config) return null
  return config.component as VueComponent
})

function selectSlot(slotId: string) {
  flyout.open(slotId)
}

function handleOverlayClick() {
  if (flyout.clickToDismiss.value) {
    flyout.close()
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (!flyout.isOpen.value || !flyout.clickToDismiss.value) return

  const target = event.target as Node | null
  if (!target) return

  if (drawerEl.value?.contains(target)) return

  const element = target instanceof Element ? target : target.parentElement
  if (element?.closest(`[${FLYIN_NAVBAR_ROOT_ATTR}], .flyin-trigger`)) return

  flyout.close()
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const editable = target.closest('input, textarea, select, [contenteditable="true"]')
  return Boolean(editable)
}

function handleKeydown(event: KeyboardEvent) {
  if (!flyout.isOpen.value) return

  if (event.key === 'Escape') {
    flyout.close()
    return
  }

  if (isEditableTarget(event.target)) return

  const slotCount = flyout.getSlots().size
  if (slotCount <= 1) return

  if (matchesShortcut(event, SLOT_NEXT_SHORTCUT)) {
    event.preventDefault()
    flyout.cycleSlot(1)
    return
  }

  if (matchesShortcut(event, SLOT_PREVIOUS_SHORTCUT)) {
    event.preventDefault()
    flyout.cycleSlot(-1)
  }
}

function syncBodyScroll(isOpen: boolean) {
  // Only lock page scroll for modal-style flyouts with a backdrop.
  if (!props.showOverlay) return

  document.body.style.overflow = isOpen ? 'hidden' : ''
}

let pushOffsetTimer: number | undefined

function clearPushOffsetTimer() {
  if (pushOffsetTimer !== undefined) {
    window.clearTimeout(pushOffsetTimer)
    pushOffsetTimer = undefined
  }
}

function updatePushOffset() {
  const drawer = drawerEl.value
  const width = drawer?.getBoundingClientRect().width
  const offset = width && width > 0 ? Math.round(width) : 380
  document.documentElement.style.setProperty('--flyin-push-offset', `${offset}px`)
}

function schedulePushOffsetUpdate() {
  clearPushOffsetTimer()
  requestAnimationFrame(updatePushOffset)
  pushOffsetTimer = window.setTimeout(updatePushOffset, 300)
}

function syncDrawerLayout(isOpen: boolean) {
  if (drawerMode.value !== 'push') return

  document.body.classList.toggle('flyin-drawer-open', isOpen)
  document.body.classList.toggle('flyin-drawer-push', isOpen)

  if (!isOpen) {
    document.documentElement.style.removeProperty('--flyin-push-offset')
    clearPushOffsetTimer()
    return
  }

  schedulePushOffsetUpdate()
}

watch(
  () => flyout.isOpen.value && flyout.clickToDismiss.value,
  (shouldListen) => {
    if (shouldListen) {
      document.addEventListener('click', handleDocumentClick, true)
    } else {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  },
  { immediate: true }
)

watch(
  () => flyout.isOpen.value,
  (isOpen) => {
    syncBodyScroll(isOpen)
    syncDrawerLayout(isOpen)
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  syncBodyScroll(flyout.isOpen.value)
  syncDrawerLayout(flyout.isOpen.value)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleDocumentClick, true)
  syncBodyScroll(false)
  syncDrawerLayout(false)
  clearPushOffsetTimer()
})
</script>
