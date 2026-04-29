import { describe, it, expect, afterEach, vi } from 'vitest';
import { Splitter } from '../../src/splitter/splitter.js';
import { DockEdge } from '../../src/types/dock-edge.js';
import { SplitterOrientation } from '../../src/types/splitter-orientation.js';
import { SplitterEventType } from '../../src/types/splitter-event-type.js';

function makeInContainer(): { splitter: Splitter; container: HTMLElement } {
  const container = document.createElement('div');
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
    { left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 } as DOMRect,
  );
  const splitter = new Splitter(DockEdge.Left, SplitterOrientation.Column);
  container.appendChild(splitter.element);
  document.body.appendChild(container);
  return { splitter, container };
}

describe('Splitter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('element has frame-splitter class', () => {
    const s = new Splitter(DockEdge.Left, SplitterOrientation.Column);
    expect(s.element.classList.contains('frame-splitter')).toBe(true);
  });

  it('column orientation adds column class', () => {
    const s = new Splitter(DockEdge.Left, SplitterOrientation.Column);
    expect(s.element.classList.contains('column')).toBe(true);
  });

  it('row orientation adds row class', () => {
    const s = new Splitter(DockEdge.Top, SplitterOrientation.Row);
    expect(s.element.classList.contains('row')).toBe(true);
  });

  describe('setVisible', () => {
    it('adds hidden class when false', () => {
      const s = new Splitter(DockEdge.Left, SplitterOrientation.Column);
      s.setVisible(false);
      expect(s.element.classList.contains('hidden')).toBe(true);
    });

    it('removes hidden class when true', () => {
      const s = new Splitter(DockEdge.Left, SplitterOrientation.Column);
      s.setVisible(false);
      s.setVisible(true);
      expect(s.element.classList.contains('hidden')).toBe(false);
    });
  });

  it('dispatches SplitterEventType.Change on pointermove after pointerdown', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
    const { splitter } = makeInContainer();

    let detail: any = null;
    splitter.element.addEventListener(SplitterEventType.Change, (e: Event) => {
      detail = (e as CustomEvent).detail;
    }, true);

    splitter.element.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
    splitter.element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 0, clientY: 200 }));

    expect(detail).not.toBeNull();
    expect(detail.edge).toBe(DockEdge.Left);
    expect(typeof detail.ratio).toBe('number');
  });

  it('does not dispatch on right-click pointerdown', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
    const { splitter } = makeInContainer();

    let fired = false;
    splitter.element.addEventListener(SplitterEventType.Change, () => { fired = true; }, true);

    splitter.element.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
    splitter.element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 0, clientY: 200 }));

    expect(fired).toBe(false);
  });

  it('clamped ratio stays between 0 and 1', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
    const { splitter } = makeInContainer();

    const ratios: number[] = [];
    splitter.element.addEventListener(SplitterEventType.Change, (e: Event) => {
      ratios.push((e as CustomEvent<{ ratio: number }>).detail.ratio);
    }, true);

    splitter.element.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
    for (const y of [-500, 0, 200, 400, 900]) {
      splitter.element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 0, clientY: y }));
    }

    expect(ratios.every(r => r >= 0 && r <= 1)).toBe(true);
  });
});
