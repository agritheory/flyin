#!/usr/bin/env node
import { register } from 'node:module'

await register(new URL('./source-hooks.mjs', import.meta.url))
await import('./build-if-host.ts')
