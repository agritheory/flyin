<template>
  <span class="flyin-shortcut-hint">
    <template v-if="label">{{ label }} </template>
    <template v-for="(part, index) in parts" :key="`${part}-${index}`">
      <template v-if="index > 0"> + </template>
      <kbd>{{ part }}</kbd>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DEFAULT_TOGGLE_SHORTCUT,
  isMacPlatform,
  shortcutHintParts,
} from '../desk/keyboard-shortcuts'

const props = withDefaults(
  defineProps<{
    shortcut?: string
    label?: string
    mac?: boolean | null
  }>(),
  {
    shortcut: DEFAULT_TOGGLE_SHORTCUT,
    label: '',
    // Vue turns an omitted boolean into false, which would skip Mac detection.
    mac: null,
  },
)

const parts = computed(() =>
  shortcutHintParts(props.shortcut, {
    mac: props.mac ?? isMacPlatform(),
  }),
)
</script>
