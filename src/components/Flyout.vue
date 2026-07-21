<template>
  <Teleport :to="teleportTo">
    <!-- Optional overlay -->
    <div
      v-if="showOverlay"
      class="flyout-overlay"
      :class="{ 'flyout-overlay--visible': flyout.isOpen.value }"
      @click="flyout.close"
    />

    <!-- Drawer -->
    <div
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
import { computed, inject, onMounted, onUnmounted, watch, type Component as VueComponent } from 'vue'
import { useFlyin } from '../composables/useFlyin'
import FlyoutHeader from './FlyoutHeader.vue'
import FlyoutFooter from './FlyoutFooter.vue'

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

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && flyout.isOpen.value) {
    flyout.close()
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
  const drawer = document.querySelector('.flyout-drawer.flyout-drawer--open') as HTMLElement | null
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
  syncBodyScroll(false)
  syncDrawerLayout(false)
  clearPushOffsetTimer()
})
</script>
