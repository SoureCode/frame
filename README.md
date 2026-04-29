# @sourecode/frame

[![CI](https://github.com/SoureCode/frame/actions/workflows/ci.yml/badge.svg)](https://github.com/SoureCode/frame/actions/workflows/ci.yml)

A dockable panel layout system for building IDE-style UIs.

## Installation

Download the tarball from the [latest GitHub Release](https://github.com/SoureCode/frame/releases/latest) and install it:

```bash
npm install https://github.com/SoureCode/frame/releases/download/v0.1.0/sourecode-frame-0.1.0.tgz
```

Import the stylesheet:

```js
import '@sourecode/frame/styles';
```

## Quick Start

```ts
import { FrameLayout, LocalStorageAdapter, SlotName } from '@sourecode/frame';
import type { PanelConfig } from '@sourecode/frame';

const panels: PanelConfig[] = [
  { id: 'explorer', title: 'Explorer', slot: SlotName.LeftTop, pinned: true },
  { id: 'debug', title: 'Debug', slot: SlotName.LeftBottom, pinned: true },
  { id: 'outline', title: 'Outline', slot: SlotName.RightTop, pinned: false },
];

const layout = new FrameLayout(document.getElementById('app')!, panels, {
  animated: true,
  storage: new LocalStorageAdapter('my-layout'),
});
```

## API

### `new FrameLayout(mount, panels, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `mount` | `HTMLElement` | Element to render the layout into |
| `panels` | `PanelConfig[]` | Panel definitions |
| `options` | `FrameOptions` | Optional configuration |

#### `FrameOptions`

| Property | Type | Description |
|----------|------|-------------|
| `animated` | `boolean` | Enable CSS transitions |
| `transition` | `TransitionConfig` | Custom `{ duration, easing }` |
| `storage` | `StorageAdapter` | Persist layout state |

#### Instance properties and methods

| Member | Description |
|--------|-------------|
| `element` | The root `HTMLElement` |
| `getState()` | Returns the current `LayoutState` |
| `setWidescreen(enabled)` | Toggle widescreen mode |
| `setAnimated(enabled)` | Toggle animations at runtime |
| `openPanel(id)` | Activate a panel |
| `closePanel(id)` | Deactivate a panel |
| `movePanel(id, slot)` | Move a panel to a different `SlotName` |
| `destroy()` | Remove the layout from the DOM and clean up |

### `PanelConfig`

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique panel identifier |
| `title` | `string` | Display title |
| `slot` | `SlotName` | Initial slot position |
| `pinned` | `boolean` | Keep panel open when dock is inactive |
| `icon` | `PanelIcon` | Optional icon (`HTMLElement`, SVG string, or factory) |
| `content` | `HTMLElement` | Optional panel body element |

### `SlotName`

```ts
enum SlotName {
  LeftTop, LeftBottom,
  RightTop, RightBottom,
  TopLeft, TopRight,
  BottomLeft, BottomRight,
}
```

### `LocalStorageAdapter`

Persists layout state to `localStorage`.

```ts
const storage = new LocalStorageAdapter('storage-key');
```

Implements `StorageAdapter`:

```ts
interface StorageAdapter {
  load(): LayoutState | null;
  save(state: LayoutState): void;
}
```

## Theming

Set `data-theme` on the mount element to one of:

- `obsidian` (default; omit `data-theme` or set it to empty)
- `light`
- `solarized`
- `rose`
- `paper`
- `high-contrast`
- `warm`
- `nord`
- `terminal`
- `dracula`
- `monokai`
- `glass-dark`
- `glass-light`
- `catppuccin`
- `gruvbox`
- `tokyo-night`
- `synthwave`
- `everforest`
- `sepia`
- `github-light`
- `github-dark`
- `github-dimmed`
- `ayu`
- `mint`
- `lavender`
- `sky`
- `sand`
