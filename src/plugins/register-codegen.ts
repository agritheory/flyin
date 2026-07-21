import { resolve } from 'path'
import { getAppConfigs, getMergedFlyinConfig } from './hooks'

export function generateFlyinRegisterModule(options?: {
  appsDir?: string
  sitesDir?: string
}): string {
  const configs = getAppConfigs(options)
  const merged = getMergedFlyinConfig(options)

  const imports: string[] = [
    "import { markRaw } from 'vue'",
    "import { useFlyin } from '@/composables/useFlyin'",
  ]

  const registrations: string[] = []

  for (const [slotId, slot] of Object.entries(merged.slots)) {
    const importName = toImportName(slotId)
    const owningConfig = configs.find(config => slotId in config.flyin.slots)
    if (!owningConfig) continue

    let componentPath = slot.component
    if (componentPath.startsWith('./')) {
      componentPath = resolve(owningConfig.appPath, componentPath.slice(2))
    } else if (!componentPath.startsWith('/')) {
      componentPath = resolve(owningConfig.appPath, componentPath)
    }

    imports.push(`import ${importName} from '${componentPath.replace(/\\/g, '/')}'`)
    const badgeLine = slot.badge_method
      ? `    badge: async () => window.frappe.xcall(${JSON.stringify(slot.badge_method)}),`
      : ''

    registrations.push(
      `  flyin.register('${slotId}', {
    title: ${JSON.stringify(slot.title)},
    icon: ${JSON.stringify(slot.icon ?? '')},
    component: markRaw(${importName}),
    navbarPosition: ${slot.navbar_position ? JSON.stringify(slot.navbar_position) : 'undefined'},
${badgeLine}
  })`
    )
  }

  return `${imports.join('\n')}

export function registerFlyinSlots() {
  const flyin = useFlyin()

${registrations.join('\n\n')}
}
`
}

function toImportName(slotId: string): string {
  const cleaned = slotId.replace(/[^a-zA-Z0-9]+/g, ' ')
  const parts = cleaned.split(' ').filter(Boolean)
  const name = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  return `FlyinSlot${name}`
}
