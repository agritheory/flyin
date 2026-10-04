import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const flyinRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const flyinSrcHref = `${pathToFileURL(join(flyinRoot, 'src')).href}/`
const ts = createRequire(join(flyinRoot, 'package.json'))('typescript')

export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith('./') || specifier.startsWith('../')
  if (!relative) return nextResolve(specifier, context)

  const candidates = []
  if (specifier.endsWith('.js')) candidates.push(`${specifier.slice(0, -3)}.ts`)
  else if (!/\.[a-z]+$/i.test(specifier)) {
    candidates.push(`${specifier}.ts`, `${specifier}/index.ts`)
  }

  for (const candidate of candidates) {
    try {
      return await nextResolve(candidate, context)
    } catch {
      // Try the next candidate.
    }
  }
  return nextResolve(specifier, context)
}

// Node refuses to type-strip TypeScript that lives under node_modules.
export async function load(url, context, nextLoad) {
  if (!url.startsWith(flyinSrcHref) || !url.endsWith('.ts')) {
    return nextLoad(url, context)
  }

  let source = await readFile(fileURLToPath(url), 'utf8')
  if (source.startsWith('#!')) source = source.slice(source.indexOf('\n') + 1)

  const transpiled = ts.transpileModule(source, {
    fileName: url,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      sourceMap: false,
    },
  })

  return {
    format: 'module',
    source: transpiled.outputText,
    shortCircuit: true,
  }
}
