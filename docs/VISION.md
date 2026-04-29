# Frame

Frame is a standalone JS library for building panel dock layouts in the browser. Named after the iframe era — a page divided into fixed regions, each with a purpose.

## Concepts

- **Stage** — the central content area, always visible, owns the primary content
- **Dock** — a container on one of the four edges; always contains exactly two Slots; side Docks (left/right) split their Slots top/bottom; edge Docks (top/bottom) split their Slots left/right; only rendered when at least one Slot is open, otherwise fully absent from the layout
- **Rail** — an icon strip on the outer edge of each Dock (between Dock and screen edge); each Panel gets its own icon in the Rail; always rendered even when empty, showing two placeholder halves split by a divider
- **Slot** — one of the two named positions in a Dock; holds one or more Panels, but only one Panel is visible at a time; the eight Slots are: `left-top`, `left-bottom`, `right-top`, `right-bottom`, `top-left`, `top-right`, `bottom-left`, `bottom-right`
- **Panel** — a titled wrapper around arbitrary content that lives in a Slot; has a pin button (controls the Dock) and a close button that hides the Panel, equivalent to clicking its Rail icon
- **Splitter** — a draggable handle between the two Slots of a Dock; only visible when both Slots are open

## Layout

The Stage sits in the center. Each of the four edges has a Dock and a Rail. The Stage fills all remaining space.

## Behavior

- Each Panel has its own icon in the Rail
- Clicking a Panel's icon opens its Slot and makes that Panel visible
- Clicking the icon of another Panel in the same Slot switches to that Panel without closing the Slot
- Clicking the icon of the currently visible Panel closes the Slot
- A pinned Dock takes up space in the layout, pushing the Stage
- An unpinned Dock overlays on top of the Stage without affecting its size, and auto-closes on any interaction outside the Dock
- Pin state is per-Dock; the pin button inside a Panel is just a visual control that toggles the Dock's pin state
- Rail icons are draggable; the Rail is visually divided into two halves matching its two Slots (top/bottom for side Rails, left/right for top/bottom Rails); dragging an icon into a half moves the Panel to that Slot; icons can be reordered within the same Slot half by dragging; placeholders indicate the drop target
- Dock size (width for side Docks, height for top/bottom Docks) is resizable by dragging the outer edge of the Dock; a configurable minimum size causes the Dock to snap closed when dragged below it; a configurable maximum size keeps the Stage always visible by limiting how much space a Dock can consume
- Splitter ratios between the two Slots within a Dock are resizable by dragging
- A widescreen mode stretches the side Docks to full viewport height, covering the top/bottom Dock areas
- Dock open/close and resize transitions are configurable — either animated or instant
- All layout state persists via a storage adapter; Frame ships a localStorage adapter by default; custom adapters can be provided to store state anywhere
