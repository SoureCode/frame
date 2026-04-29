import { describe, it, expect, afterEach, vi } from 'vitest';
import { Resizer } from '../../src/resizer/resizer.js';
import { DockEdge } from '../../src/types/dock-edge.js';
import { ResizerEventType } from '../../src/types/resizer-event-type.js';
import { DOCK_MIN_SIZE, DOCK_SNAP_THRESHOLD } from '../../src/layout/constants.js';

function makeInDock(edge: DockEdge, rectLeft = 0): { resizer: Resizer; dock: HTMLElement } {
  const dock = document.createElement('div');
  vi.spyOn(dock, 'getBoundingClientRect').mockReturnValue(
    { left: rectLeft, top: 0, right: rectLeft + 200, bottom: 200, width: 200, height: 200 } as DOMRect,
  );
  const resizer = new Resizer(edge, DOCK_MIN_SIZE, () => 600, DOCK_SNAP_THRESHOLD);
  dock.appendChild(resizer.element);
  document.body.appendChild(dock);
  return { resizer, dock };
}

function pointerdown(el: HTMLElement, x = 0, y = 0): void {
  el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, clientX: x, clientY: y }));
}

function pointermove(el: HTMLElement, x = 0, y = 0): void {
  el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
}

describe('Resizer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('element has frame-resizer class', () => {
    const r = new Resizer(DockEdge.Left);
    expect(r.element.classList.contains('frame-resizer')).toBe(true);
  });

  it('element has the edge name class', () => {
    expect(new Resizer(DockEdge.Left).element.classList.contains('left')).toBe(true);
    expect(new Resizer(DockEdge.Right).element.classList.contains('right')).toBe(true);
    expect(new Resizer(DockEdge.Top).element.classList.contains('top')).toBe(true);
    expect(new Resizer(DockEdge.Bottom).element.classList.contains('bottom')).toBe(true);
  });

  it('does not dispatch on right-click', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
    const { resizer } = makeInDock(DockEdge.Left);
    let fired = false;
    resizer.element.addEventListener(ResizerEventType.Change, () => { fired = true; }, true);
    resizer.element.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
    pointermove(resizer.element, 200);
    expect(fired).toBe(false);
  });

  describe('Left edge', () => {
    it('dispatches size=0 when raw < snapThreshold', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
      const { resizer } = makeInDock(DockEdge.Left, 0);

      let size: number | null = null;
      resizer.element.addEventListener(ResizerEventType.Change, (e: Event) => {
        size = (e as CustomEvent<{ size: number }>).detail.size;
      }, true);

      pointerdown(resizer.element, 0);
      pointermove(resizer.element, DOCK_SNAP_THRESHOLD - 1);

      expect(size).toBe(0);
    });

    it('dispatches clamped size when raw exceeds snapThreshold', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
      const { resizer } = makeInDock(DockEdge.Left, 0);

      let size: number | null = null;
      resizer.element.addEventListener(ResizerEventType.Change, (e: Event) => {
        size = (e as CustomEvent<{ size: number }>).detail.size;
      }, true);

      pointerdown(resizer.element, 0);
      pointermove(resizer.element, 300);

      expect(size).toBe(300);
    });

    it('clamps size to minSize', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
      const { resizer } = makeInDock(DockEdge.Left, 0);

      let size: number | null = null;
      resizer.element.addEventListener(ResizerEventType.Change, (e: Event) => {
        size = (e as CustomEvent<{ size: number }>).detail.size;
      }, true);

      pointerdown(resizer.element, 0);
      pointermove(resizer.element, DOCK_SNAP_THRESHOLD + 1);

      expect(size).toBeGreaterThanOrEqual(DOCK_MIN_SIZE);
    });

    it('clamps size to maxSize', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
      const { resizer } = makeInDock(DockEdge.Left, 0);

      let size: number | null = null;
      resizer.element.addEventListener(ResizerEventType.Change, (e: Event) => {
        size = (e as CustomEvent<{ size: number }>).detail.size;
      }, true);

      pointerdown(resizer.element, 0);
      pointermove(resizer.element, 9999);

      expect(size).toBe(600);
    });
  });
});
