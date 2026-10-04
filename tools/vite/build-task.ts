/**
 * Cached compile task for Vite+ (`vp run compile`, via `yarn build`).
 *
 * Mirrors stonecrop's build-task pattern: vite must run before declaration emit so
 * `emptyOutDir` clears dist without a separate rm that would fight the cache.
 */
export function buildTask() {
  return {
    compile: {
      command: [
        'vite build --logLevel warn',
        'vue-tsc --emitDeclarationOnly',
        'cp src/styles.css dist/styles.css',
      ].join(' && '),
      input: [{ auto: true }, 'vite.config.ts', 'tools/vite/**', '!dist/**'],
      output: ['dist/**'],
    },
  }
}
