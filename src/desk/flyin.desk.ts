import { createApp, h } from 'vue'
import { FlyinPlugin, PreviewPlugin } from '../plugin'
import Flyout from '../components/Flyout.vue'
import FilePreview from '../components/FilePreview.vue'
import { useFlyin } from '../composables/useFlyin'
import { useFilePreview } from '../composables/useFilePreview'
import { registerFlyinSlots } from 'virtual:flyin-register'
import { flyinDeskOptions } from 'virtual:flyin-desk-options'
import { setupDeskIntegrations } from './integrations'
import '../styles.css'

function mountDeskBundle() {
  if (typeof window !== 'undefined' && window.flyin?.mounted) {
    return
  }

  const mountEl = document.createElement('div')
  mountEl.id = 'flyin-desk-root'
  document.body.appendChild(mountEl)

  const app = createApp({
    setup() {
      registerFlyinSlots()
      return () => [h(Flyout), h(FilePreview)]
    },
  })

  app.use(PreviewPlugin)
  app.use(FlyinPlugin, {
    drawerMode: flyinDeskOptions.drawerMode,
  })

  app.mount(mountEl)

  const flyinApi = useFlyin()
  const previewApi = useFilePreview()

  window.flyin = Object.assign(flyinApi, {
    preview: previewApi,
    mounted: true,
  })

  setupDeskIntegrations()
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountDeskBundle)
  } else {
    mountDeskBundle()
  }
}
