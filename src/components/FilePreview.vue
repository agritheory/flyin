<template>
  <Teleport :to="teleportTo">
    <div
      class="file-preview"
      :class="{ 'file-preview--open': preview.isOpen.value }"
      @keydown.escape="preview.close"
    >
      <div class="file-preview__header">
        <h3 class="file-preview__title">{{ preview.currentFile.value.title || 'Preview' }}</h3>
        <button class="file-preview__close" @click="preview.close" aria-label="Close preview">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="file-preview__content" :class="`file-preview__content--${preview.currentFile.value.type}`">
        <!-- PDF -->
        <iframe
          v-if="preview.currentFile.value.type === 'pdf' && preview.currentFile.value.url"
          :src="preview.currentFile.value.url"
          title="PDF Preview"
        />

        <!-- Image -->
        <img
          v-else-if="preview.currentFile.value.type === 'image' && preview.currentFile.value.url"
          :src="preview.currentFile.value.url"
          :alt="preview.currentFile.value.title || 'Image preview'"
        />

        <!-- Video -->
        <video
          v-else-if="preview.currentFile.value.type === 'video' && preview.currentFile.value.url"
          :src="preview.currentFile.value.url"
          controls
        />

        <!-- Audio -->
        <audio
          v-else-if="preview.currentFile.value.type === 'audio' && preview.currentFile.value.url"
          :src="preview.currentFile.value.url"
          controls
        />

        <!-- DOCX (requires docx-preview library) -->
        <div
          v-else-if="preview.currentFile.value.type === 'docx'"
          ref="docxContainer"
          class="file-preview__docx"
        />

        <!-- Email / HTML content -->
        <div
          v-else-if="preview.currentFile.value.type === 'email' || preview.currentFile.value.type === 'html'"
          class="file-preview__html"
          v-html="sanitizedContent"
        />

        <!-- Fallback -->
        <div v-else class="file-preview__fallback">
          <p>Unable to preview this file type.</p>
          <a
            v-if="preview.currentFile.value.url"
            :href="preview.currentFile.value.url"
            target="_blank"
            rel="noopener"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useFilePreview } from '../composables/useFilePreview'

const props = withDefaults(
  defineProps<{
    teleportTo?: string
  }>(),
  {
    teleportTo: 'body',
  }
)

const preview = useFilePreview()
const docxContainer = ref<HTMLElement | null>(null)

const sanitizedContent = computed(() => {
  const content = preview.currentFile.value.content
  if (!content) return ''
  return content
})

watch(
  () => preview.isOpen.value,
  (isOpen) => {
    if (isOpen) {
      document.body.classList.add('flyout-preview-open')
    } else {
      document.body.classList.remove('flyout-preview-open')
    }
  }
)

watch(
  () => [preview.currentFile.value.type, preview.currentFile.value.content],
  async ([type, content]) => {
    if (type === 'docx' && content && docxContainer.value) {
      try {
        const docxPreview = await import('docx-preview')
        await docxPreview.renderAsync(content, docxContainer.value, docxContainer.value, {
          ignoreLastRenderedPageBreak: false,
          experimental: true,
        })
      } catch (error) {
        console.warn('[flyout] docx-preview not available:', error)
      }
    }
  }
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && preview.isOpen.value) {
    preview.close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('flyout-preview-open')
})
</script>
