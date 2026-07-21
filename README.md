# @agritheory/flyin

Pluggable flyin drawer and shared file preview for Frappe desk applications.

Apps declare flyin slots in `hooks.py`. The **build host** (highest `idx` among apps with a `flyin` hook) produces a single `flyin.desk.bundle.js` that mounts file preview once and registers all slot components.

## Installation

```bash
pnpm add @agritheory/flyin
```

The build host app also needs Vite tooling:

```bash
pnpm add -D vite @vitejs/plugin-vue
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
# or
pnpm build:flyin
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
```

Slots are registered at build time from all apps' `hooks.py` configs.

### Multi-slot header and keyboard shortcut

When two or more slots are registered, the drawer header shows icon tabs instead of a title. Click a tab to switch slots without closing the drawer.

Press **Ctrl+Shift+.** anywhere on desk (except when typing in a field) to toggle the drawer. When opening via shortcut, flyin restores the last-used slot, or the first slot with a badge count, or the first registered slot.

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

To publish `@agritheory/flyin` to npm:

1. Add an `NPM_TOKEN` secret to the GitHub repository (npm access token with publish rights for `@agritheory`).
2. Push a version tag (for example `v15.0.0`), **or** run the **Release** workflow manually from the Actions tab.
3. Consumer apps should depend on the published package:

```json
{
  "dependencies": {
    "@agritheory/flyin": "^15.0.0"
  }
}
```

For local development against an unpublished checkout, use a file dependency instead:

```json
"@agritheory/flyin": "file:../../../flyin/flyin"
```

## License

MIT
