<template>
  <div class="flyout-drawer__header">
    <div v-if="useTabs" class="flyout-header-tabs" role="tablist">
      <button
        v-for="slot in slotList"
        :key="slot.id"
        type="button"
        class="flyout-header-tabs__tab"
        :class="{ 'flyout-header-tabs__tab--active': slot.id === activeSlotId }"
        role="tab"
        :aria-selected="slot.id === activeSlotId"
        :aria-label="slot.title"
        :title="slot.title"
        @click="$emit('select', slot.id)"
      >
        <span
          v-if="slot.icon && getIconSvg(slot.icon)"
          class="flyout-header-tabs__icon"
          v-html="getIconSvg(slot.icon)"
        />
        <span
          v-if="slot.badgeCount && slot.badgeCount > 0"
          class="flyout-header-tabs__badge"
        >
          {{ slot.badgeCount > 99 ? '99+' : slot.badgeCount }}
        </span>
      </button>
    </div>

    <h2 v-else class="flyout-drawer__title">
      <slot name="icon">
        <span v-if="icon && getIconSvg(icon)" class="flyout-drawer__icon" v-html="getIconSvg(icon)" />
      </slot>
      <slot>{{ title }}</slot>
    </h2>

    <button class="flyout-drawer__close" @click="$emit('close')" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getDeskIconSvg } from '../plugin'

export interface FlyoutHeaderSlot {
  id: string
  title: string
  icon?: string
  badgeCount?: number
}

const props = defineProps<{
  title?: string
  icon?: string
  slotList?: FlyoutHeaderSlot[]
  activeSlotId?: string | null
}>()

defineEmits<{
  close: []
  select: [slotId: string]
}>()

const useTabs = computed(() => (props.slotList?.length ?? 0) > 1)

function getIconSvg(iconName: string): string {
  return getDeskIconSvg(iconName)
}
</script>
