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
| `getStage()` | Returns the central content area `HTMLElement` |
| `getState()` | Returns the current `LayoutState` |
| `getTheme()` | Returns the current `Theme \| string` |
| `setTheme(theme)` | Set theme by name (`Theme` or custom string) |
| `setWidescreen(enabled)` | Toggle widescreen mode |
| `setAnimated(enabled)` | Toggle animations at runtime |
| `openPanel(id)` | Activate a panel |
| `closePanel(id)` | Deactivate a panel |
| `toggleFullscreen(id)` | Toggle a panel to fullscreen over the frame |
| `movePanel(id, slot)` | Move a panel to a different `SlotName` |
| `destroy()` | Remove the layout from the DOM and clean up |

### `PanelConfig`

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique panel identifier |
| `title` | `string` | Display title |
| `slot` | `SlotName` | Initial slot position |
| `pinned` | `boolean` | Keep panel open when dock is inactive |
| `fullscreenable` | `boolean` | Show fullscreen button (default `true`) |
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

## Events

All events are `CustomEvent`s dispatched on the frame `element` with `bubbles: true`.

| Event | Detail | Description |
|-------|--------|-------------|
| `frame:theme` | `{ theme, previous }` | Theme changed via `setTheme()` |
| `frame:fullscreen` | `{ panelId, slot }` | Panel fullscreen toggled |
| `frame:pin` | `{ panelId, slot }` | Panel pin toggled |
| `frame:close` | `{ panelId, slot }` | Panel closed |
| `frame:rail-click` | `{ panelId, slot }` | Rail icon clicked |
| `frame:rail-move` | `{ panelId, toSlot, beforePanelId }` | Panel moved via rail drag |
| `frame:splitter-change` | `{ edge, ratio }` | Splitter position changed |
| `frame:resizer-change` | `{ edge, size }` | Dock resized |
| `frame:overlay-close` | `{ edge }` | Click outside unpinned dock |

## Theming

Set `data-theme` on the mount element or use `setTheme()` / `getTheme()`:

```ts
layout.setTheme('dracula');
layout.element.addEventListener('frame:theme', (e) => {
  console.log(e.detail.previous, '->', e.detail.theme);
});
```

Available themes:

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
