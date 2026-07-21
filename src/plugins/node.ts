import { existsSync, readFileSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join, resolve } from 'path'

const MIN_NODE_MAJOR = 20
const MIN_NODE_MINOR = 11

export function isNodeVersionSufficient(version: string): boolean {
  const [major, minor] = version.split('.').map(Number)
  if (Number.isNaN(major) || Number.isNaN(minor)) return false
  return major > MIN_NODE_MAJOR || (major === MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR)
}

function compareNodeVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = a.split('.').map(Number)
  const [bMajor, bMinor, bPatch] = b.split('.').map(Number)

  if (aMajor !== bMajor) return aMajor - bMajor
  if (aMinor !== bMinor) return aMinor - bMinor
  return (aPatch || 0) - (bPatch || 0)
}

function readNvmrcVersion(cwd: string): string | null {
  const nvmrcPath = resolve(cwd, '.nvmrc')
  if (!existsSync(nvmrcPath)) return null

  const version = readFileSync(nvmrcPath, { encoding: 'utf-8' }).trim()
  return version || null
}

function resolveNvmNode(versionSpec?: string): string | null {
  const nvmDir = process.env.NVM_DIR || join(homedir(), '.nvm')
  const versionsDir = join(nvmDir, 'versions', 'node')

  if (!existsSync(versionsDir)) return null

  if (versionSpec) {
    const normalized = versionSpec.startsWith('v') ? versionSpec : `v${versionSpec}`
    const exactPath = join(versionsDir, normalized, 'bin', 'node')
    if (existsSync(exactPath) && isNodeVersionSufficient(normalized.slice(1))) {
      return exactPath
    }
  }

  const available = readdirSync(versionsDir)
    .filter(name => name.startsWith('v'))
    .map(name => ({
      name,
      path: join(versionsDir, name, 'bin', 'node'),
      version: name.slice(1),
    }))
    .filter(entry => existsSync(entry.path) && isNodeVersionSufficient(entry.version))
    .sort((a, b) => compareNodeVersions(b.version, a.version))

  if (available.length === 0) return null

  if (versionSpec) {
    const requestedMajor = Number.parseInt(versionSpec.replace(/^v/, '').split('.')[0], 10)
    if (!Number.isNaN(requestedMajor)) {
      const majorMatch = available.find(
        entry => Number.parseInt(entry.version.split('.')[0], 10) === requestedMajor
      )
      if (majorMatch) return majorMatch.path
    }
  }

  return available[0].path
}

export function resolveNodeBinary(options?: { cwd?: string }): string {
  const cwd = options?.cwd || process.cwd()

  if (isNodeVersionSufficient(process.versions.node)) {
    return process.execPath
  }

  const nvmrcVersion = readNvmrcVersion(cwd)
  if (nvmrcVersion) {
    const nvmrcNode = resolveNvmNode(nvmrcVersion)
    if (nvmrcNode) {
      console.log(`[flyin] Using Node from .nvmrc (${nvmrcVersion}): ${nvmrcNode}`)
      return nvmrcNode
    }
  }

  const newestNvmNode = resolveNvmNode()
  if (newestNvmNode) {
    console.log(`[flyin] Current Node ${process.versions.node} is too old; using ${newestNvmNode}`)
    return newestNvmNode
  }

  throw new Error(
    `[flyin] Node.js >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR} is required to build the desk bundle ` +
      `(current: ${process.versions.node}). Install a newer Node via nvm or add a .nvmrc to the build host app.`
  )
}
