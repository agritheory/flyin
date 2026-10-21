type TranslateFn = (message: string) => string

const FRAPPE_TRANSLATE = '__'

function isTranslateFn(value: unknown): value is TranslateFn {
  return typeof value === 'function'
}

function readTranslate(source: unknown): TranslateFn | undefined {
  if (typeof source !== 'object' || source === null) return undefined
  const candidate = Reflect.get(source, FRAPPE_TRANSLATE)
  if (!isTranslateFn(candidate)) return undefined
  return candidate
}

/** Translate a desk msgid through Frappe when `__` is loaded. */
export function translateFlyinText(message: string): string {
  const fromWindow = readTranslate(window)
  if (fromWindow) return fromWindow(message)

  const fromFrappe = readTranslate(Reflect.get(window, 'frappe'))
  if (fromFrappe) return fromFrappe(message)

  return message
}
