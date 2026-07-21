import { createHash } from 'crypto'
import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export const FLYIN_DESK_BUNDLE_KEY = 'flyin.desk.bundle.js'
const FLYIN_DESK_BUNDLE_PREFIX = 'flyin.desk.bundle.'

function hashBundleContent(content: Buffer): string {
  return createHash('sha256')
    .update(content)
    .digest('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
}

export function registerFlyinDeskBundle(options: {
  hostApp: string
  outDir: string
  sitesDir: string
}): string {
  const { hostApp, outDir, sitesDir } = options
  const bundlePath = resolve(outDir, FLYIN_DESK_BUNDLE_KEY)

  if (!existsSync(bundlePath)) {
    throw new Error(`[flyin] Expected desk bundle at ${bundlePath}`)
  }

  const content = readFileSync(bundlePath)
  const hash = hashBundleContent(content)
  const hashedName = `${FLYIN_DESK_BUNDLE_PREFIX}${hash}.js`
  const hashedPath = resolve(outDir, hashedName)

  if (hashedPath !== bundlePath) {
    renameSync(bundlePath, hashedPath)
  }

  for (const file of readdirSync(outDir)) {
    if (
      file.startsWith(FLYIN_DESK_BUNDLE_PREFIX) &&
      file.endsWith('.js') &&
      file !== hashedName
    ) {
      unlinkSync(resolve(outDir, file))
    }
  }

  const assetPath = `/assets/${hostApp}/dist/js/${hashedName}`
  const assetsJsonPath = resolve(sitesDir, 'assets', 'assets.json')
  const assets = existsSync(assetsJsonPath)
    ? JSON.parse(readFileSync(assetsJsonPath, { encoding: 'utf-8' }))
    : {}

  assets[FLYIN_DESK_BUNDLE_KEY] = assetPath
  writeFileSync(assetsJsonPath, `${JSON.stringify(assets, null, 4)}\n`, { encoding: 'utf-8' })

  console.log(`[flyin] Registered ${FLYIN_DESK_BUNDLE_KEY} -> ${assetPath}`)
  return assetPath
}
