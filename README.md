# @agritheory/flyin

Pluggable flyin drawer and shared file preview for Frappe desk applications.

Apps declare flyin slots in `hooks.py`. The **build host** (highest `idx` among apps with a `flyin` hook) produces a single `flyin.desk.bundle.js` that mounts file preview once and registers all slot components.

## Installation

`@agritheory/flyin` is published to [GitHub Packages](https://github.com/agritheory/flyin/pkgs/npm/flyin). Point the `@agritheory` scope at that registry:

```ini
# .npmrc (project or ~/.npmrc)
@agritheory:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

The PAT needs `read:packages` (and `repo` if the package is private).

```bash
yarn add @agritheory/flyin
```

The build host app also needs Vite tooling:

```bash
yarn add -D vite @vitejs/plugin-vue
```

## Declare slots (any participating app)

```python
# autoreader/hooks.py
flyin = {
    "slots": {
        "autoreader-exceptions": {
            "title": "Exception Queue",
            "icon": "mail-warning",
            "component": "./autoreader/public/js/flyout/ExceptionQueue.vue",
        },
    },
}
```

Slot components own their own data fetching and API calls (`frappe.xcall`, `frappe.db`, etc.).

## Build host setup

Only the build host includes the desk bundle. Add to the host app's `hooks.py`:

```python
app_include_js = ["flyin.desk.bundle.js"]
```

Add to the host app's `package.json`:

```json
{
  "scripts": {
    "build:flyin": "flyin-build"
  },
  "dependencies": {
    "@agritheory/flyin": "^15.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "vite": "^8.0.0"
  }
}
```

Run the desk build from any flyin app — only the host executes:

```bash
yarn build:flyin
```

### Build host selection

1. If exactly one app sets `flyin_build_host = True` in `hooks.py`, that app is the host.
2. Otherwise, the app with the highest `idx` in `sites/apps.json` among apps with a `flyin` hook.

## Slot component example

```vue
<!-- autoreader/public/js/flyout/ExceptionQueue.vue -->
<template>
  <div class="exception-queue">
    <div v-for="item in items" :key="item.name" @click="select(item)">
      {{ item.reference_name }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFilePreview } from '@agritheory/flyin/file-preview'

const items = ref([])
const preview = useFilePreview()

onMounted(async () => {
  items.value = await frappe.db.get_list('ToDo', { /* filters */ })
})

async function select(item) {
  const comm = await frappe.db.get_doc('Communication', item.reference_name)
  preview.show({ url: comm.attachments?.[0]?.file_url, title: comm.subject })
}
</script>
```

## Preview-only consumers

Apps that only need file preview (Check Run, Cloud Storage) should **not** bundle `@agritheory/flyin`. Use the global singleton from the desk bundle:

```javascript
// check_run.bundle.js
window.check_run = window.check_run || {}
window.check_run.preview = window.flyin.preview
```

## API

The desk bundle exposes a global singleton at `window.flyin` with the same methods as `useFlyin()`, plus `window.flyin.preview` for file preview and `window.flyin.mounted` once initialized.

```javascript
window.flyin.open('autoreader-exceptions')
window.flyin.preview.show({ url: '/files/foo.pdf', title: 'Invoice' })
```

### `useFlyin()`

```typescript
import { useFlyin } from '@agritheory/flyin'

const flyin = useFlyin()
flyin.open('autoreader-exceptions')
flyin.close()
flyin.toggle('autoreader-exceptions')
flyin.setClickToDismiss(true)
```

When click-to-dismiss is enabled, clicking outside the open drawer closes it. Clicks inside the drawer and on the desk navbar flyin trigger are ignored so toggling does not immediately re-close.

```javascript
window.flyin.setClickToDismiss(true)
window.flyin.clickToDismiss.value // boolean
```

Build hosts can set the default in `hooks.py`:

```python
flyin = {
    "slots": { ... },
    "click_to_dismiss": True,
}
```

Slots are registered at build time from all apps' `hooks.py` configs.

### Multi-slot header and keyboard shortcut

When two or more slots are registered, the drawer header shows icon tabs instead of a title. Click a tab to switch slots without closing the drawer.

Press **Ctrl+Shift+X** anywhere on desk (except when typing in a field) to toggle the drawer. On macOS, **⌘+Shift+X** matches the same shortcut. Browser window commands (close, quit) and Frappe **Alt** menu accelerators are not overridable from the page.

When opening via shortcut, flyin restores the last-used slot, or the first slot with a badge count, or the first registered slot.

With the drawer open and two or more slots registered, use **Ctrl+Shift+]** and **Ctrl+Shift+[** to move to the next or previous slot tab.

The build host can override the toggle chord in `hooks.py`:

```python
flyin = {
    "toggle_shortcut": "ctrl+shift+x",
    "slots": { ... },
}
```

### Slot context (form-bound consumers)

```javascript
// Set default props merged on open/toggle for a slot
window.flyin.setSlotContext('shipping-wizard', {
  doctype: frm.doc.doctype,
  docname: frm.doc.name,
})
```

Slot components receive merged context + explicit `open()` props as Vue component props.

### `useFilePreview()`

```typescript
import { useFilePreview } from '@agritheory/flyin/file-preview'

const preview = useFilePreview()
preview.show({ url: '/files/doc.pdf', type: 'pdf', title: 'Invoice' })
preview.close()
```

### Programmatic registration

```typescript
import { markRaw } from 'vue'
import { useFlyin } from '@agritheory/flyin'
import MyQueue from './flyout/MyQueue.vue'

useFlyin().register('my-slot', {
  title: 'My Queue',
  icon: 'clipboard',
  component: markRaw(MyQueue),
  badge: async () => frappe.xcall('myapp.api.get_count'),
})
```

## Vite plugin

```typescript
import { flyinDeskPlugin, getBuildHostApp } from '@agritheory/flyin/plugins'

console.log('Build host:', getBuildHostApp())
```

## CSS

```css
@import '@agritheory/flyin/styles.css';
```

## Publishing

CI runs on every push and pull request to `version-15` (typecheck, tests, build).

A push to `version-15` publishes the next patch on its own. The workflow looks up the latest `v15.*` tag, bumps the patch, stamps that version onto `package.json`, publishes, and creates the GitHub release. `version-16` will do the same for `16.x.x`. You leave `package.json` alone.

Releases publish to **GitHub Packages** (`https://npm.pkg.github.com`). The Release workflow uses `GITHUB_TOKEN`.

### Publish a specific version

Push a full semver tag when you want a version other than the next patch, such as `v15.3.0`.

```bash
git tag v15.3.0
git push origin v15.3.0
```

To republish an existing version after a workflow change, run **Release** from the Actions tab and pass the version (for example `15.2.0`).

**Local publish** (optional):

```bash
yarn install && yarn typecheck && yarn test --run && yarn build
NODE_AUTH_TOKEN=ghp_your_pat yarn publish --non-interactive --access public
```

### Consumer dependency

Add `.npmrc` in each consumer app:

```ini
@agritheory:registry=https://npm.pkg.github.com
```

In GitHub Actions, configure `actions/setup-node` with `registry-url: https://npm.pkg.github.com`, `scope: '@agritheory'`, and grant the workflow `packages: read`. Consumer repos also need access to the package: GitHub → **Packages** → `@agritheory/flyin` → **Package settings** → **Manage Actions access** → add each consumer repo.

```json
{
  "dependencies": {
    "@agritheory/flyin": "^15.0.0"
  }
}
```

After the first publish, refresh each consumer lockfile with `yarn install`.

For local development against an unpublished checkout, use a file dependency instead:

```json
"@agritheory/flyin": "file:../../../flyin/flyin"
```

## License

MIT
