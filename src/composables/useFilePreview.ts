import { ref, readonly, computed } from 'vue'
import type { FilePreviewOptions, FilePreviewState, FilePreviewType } from '../types'

const state = ref<FilePreviewState>({
  isOpen: false,
  url: null,
  content: null,
  type: null,
  title: null,
})

const extensionTypeMap: Record<string, FilePreviewType> = {
  pdf: 'pdf',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp4: 'video',
  webm: 'video',
  ogg: 'video',
  mp3: 'audio',
  wav: 'audio',
  docx: 'docx',
  doc: 'docx',
  html: 'html',
  htm: 'html',
}

function detectType(url: string): FilePreviewType | null {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
  if (ext && ext in extensionTypeMap) {
    return extensionTypeMap[ext]
  }
  return null
}

export function useFilePreview() {
  const isOpen = computed(() => state.value.isOpen)

  const currentFile = computed(() => ({
    url: state.value.url,
    content: state.value.content,
    type: state.value.type,
    title: state.value.title,
  }))

  function show(options: FilePreviewOptions) {
    const type = options.type || (options.url ? detectType(options.url) : null) || 'html'

    state.value = {
      isOpen: true,
      url: options.url || null,
      content: options.content || null,
      type,
      title: options.title || null,
    }
  }

  function close() {
    state.value = {
      isOpen: false,
      url: null,
      content: null,
      type: null,
      title: null,
    }
  }

  function toggle(options?: FilePreviewOptions) {
    if (state.value.isOpen) {
      close()
    } else if (options) {
      show(options)
    }
  }

  return {
    isOpen,
    currentFile,
    show,
    close,
    toggle,
    state: readonly(state),
  }
}
