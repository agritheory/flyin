import { getSlotComponents } from './hooks'

interface ComponentResolverResult {
  name: string
  from: string
}

interface ComponentResolver {
  type: 'component'
  resolve: (name: string) => ComponentResolverResult | undefined
}

export function FlyinResolver(appsDir?: string, sitesDir?: string): ComponentResolver {
  const components = getSlotComponents({ appsDir, sitesDir })

  return {
    type: 'component',
    resolve: (name: string): ComponentResolverResult | undefined => {
      if (components[name]) {
        return {
          name,
          from: components[name],
        }
      }
      return undefined
    },
  }
}

export function createFlyinComponentResolver(appsDir?: string, sitesDir?: string) {
  const components = getSlotComponents({ appsDir, sitesDir })

  return function resolveComponent(name: string): string | undefined {
    return components[name]
  }
}

export function getFlyinComponentMap(appsDir?: string, sitesDir?: string): Record<string, string> {
  return getSlotComponents({ appsDir, sitesDir })
}

// Backward-compatible aliases
export const FlyoutResolver = FlyinResolver
export const createFlyoutComponentResolver = createFlyinComponentResolver
export const getFlyoutComponentMap = getFlyinComponentMap
