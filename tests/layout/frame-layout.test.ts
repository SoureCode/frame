import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FrameLayout } from '../../src/layout/frame-layout.js';
import { SlotName } from '../../src/types/slot-name.js';
import { DockEdge } from '../../src/types/dock-edge.js';
import { PanelEventType } from '../../src/types/panel-event-type.js';
import { RailEventType } from '../../src/types/rail-event-type.js';
import { ResizerEventType } from '../../src/types/resizer-event-type.js';
import { SplitterEventType } from '../../src/types/splitter-event-type.js';
import { OverlayEventType } from '../../src/types/overlay-event-type.js';
import { ThemeEventType } from '../../src/types/theme-event-type.js';
import { RailDisabledEventType } from '../../src/types/rail-disabled-event-type.js';
import type { PanelConfig } from '../../src/types/panel.js';
import type { StorageAdapter } from '../../src/types/storage-adapter.js';
import type { LayoutState } from '../../src/types/layout.js';

function dispatch<T>(el: HTMLElement, type: string, detail: T): void {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
}

function makePanels(): PanelConfig[] {
  return [
    { id: 'a', title: 'Panel A', slot: SlotName.LeftTop,    pinned: false },
    { id: 'b', title: 'Panel B', slot: SlotName.LeftBottom, pinned: false },
    { id: 'c', title: 'Panel C', slot: SlotName.RightTop,   pinned: true  },
  ];
}

function makeStoredState(): LayoutState {
  return {
    docks: {
      [DockEdge.Left]:   { size: 200, splitRatio: 0.5 },
      [DockEdge.Right]:  { size: 200, splitRatio: 0.5 },
      [DockEdge.Top]:    { size: 200, splitRatio: 0.5 },
      [DockEdge.Bottom]: { size: 200, splitRatio: 0.5 },
    },
    activePanel: {
      [SlotName.LeftTop]:    null,
      [SlotName.LeftBottom]: null,
      [SlotName.RightTop]:   'c',
      [SlotName.RightBottom]:null,
      [SlotName.TopLeft]:    null,
      [SlotName.TopRight]:   null,
      [SlotName.BottomLeft]: null,
      [SlotName.BottomRight]:null,
    },
    slotHasPinned: {
      [SlotName.LeftTop]:    false,
      [SlotName.LeftBottom]: false,
      [SlotName.RightTop]:   true,
      [SlotName.RightBottom]:false,
      [SlotName.TopLeft]:    false,
      [SlotName.TopRight]:   false,
      [SlotName.BottomLeft]: false,
      [SlotName.BottomRight]:false,
    },
    panelPinned: { a: false, b: false, c: true },
    panelSlot: {
      a: SlotName.LeftTop,
      b: SlotName.LeftBottom,
      c: SlotName.RightTop,
    },
    fullscreenPanel: null,
    widescreen: true,
    animated: false,
  };
}

describe('FrameLayout', () => {
  let mount: HTMLElement;
  let layout: FrameLayout;

  beforeEach(() => {
    mount = document.createElement('div');
    document.body.appendChild(mount);
  });

  afterEach(() => {
    layout?.destroy();
    mount.remove();
  });

  describe('constructor', () => {
    it('appends element to mount', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(mount.contains(layout.element)).toBe(true);
    });

    it('root element has class frame', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.element.classList.contains('frame')).toBe(true);
    });

    it('animated defaults to false', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.getState().animated).toBe(false);
    });

    it('animated option is applied', () => {
      layout = new FrameLayout(mount, makePanels(), { animated: true });
      expect(layout.getState().animated).toBe(true);
    });

    it('widescreen defaults to false', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.getState().widescreen).toBe(false);
    });

    it('sets transition CSS custom properties from options', () => {
      layout = new FrameLayout(mount, makePanels(), {
        transition: { duration: '300ms', easing: 'linear' },
      });
      expect(layout.element.style.getPropertyValue('--frame-transition-duration')).toBe('300ms');
      expect(layout.element.style.getPropertyValue('--frame-transition-easing')).toBe('linear');
    });

    it('does not set transition CSS properties when option is absent', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.element.style.getPropertyValue('--frame-transition-duration')).toBe('');
    });

    it('pinned panel is active in initial state', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.getState().activePanel[SlotName.RightTop]).toBe('c');
    });

    it('unpinned panel is not active in initial state', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });
  });

  describe('setWidescreen', () => {
    it('updates state', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setWidescreen(true);
      expect(layout.getState().widescreen).toBe(true);
    });

    it('adds widescreen class', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setWidescreen(true);
      expect(layout.element.classList.contains('widescreen')).toBe(true);
    });

    it('removes widescreen class', () => {
      layout = new FrameLayout(mount, makePanels(), { });
      layout.setWidescreen(true);
      layout.setWidescreen(false);
      expect(layout.element.classList.contains('widescreen')).toBe(false);
    });
  });

  describe('setAnimated', () => {
    it('updates state', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setAnimated(true);
      expect(layout.getState().animated).toBe(true);
    });

    it('adds animated class', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setAnimated(true);
      expect(layout.element.classList.contains('animated')).toBe(true);
    });

    it('removes animated class', () => {
      layout = new FrameLayout(mount, makePanels(), { animated: true });
      layout.setAnimated(false);
      expect(layout.element.classList.contains('animated')).toBe(false);
    });
  });

  describe('openPanel', () => {
    it('sets panel as active', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a');
    });

    it('replaces previously active panel in same slot', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      const panels = makePanels();
      panels.push({ id: 'a2', title: 'A2', slot: SlotName.LeftTop, pinned: false });
      const layout2 = new FrameLayout(document.createElement('div'), panels);
      layout2.openPanel('a');
      layout2.openPanel('a2');
      expect(layout2.getState().activePanel[SlotName.LeftTop]).toBe('a2');
      layout2.destroy();
    });

    it('does nothing for unknown id', () => {
      layout = new FrameLayout(mount, makePanels());
      const before = { ...layout.getState().activePanel };
      layout.openPanel('nonexistent');
      expect(layout.getState().activePanel).toEqual(before);
    });

    it('is a no-op when panel already active', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a');
      layout.openPanel('a');
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a');
    });
  });

  describe('closePanel', () => {
    it('sets activePanel to null', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.closePanel('c');
      expect(layout.getState().activePanel[SlotName.RightTop]).toBeNull();
    });

    it('does nothing when panel is not active', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.closePanel('a');
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });

    it('does nothing for unknown id', () => {
      layout = new FrameLayout(mount, makePanels());
      const before = { ...layout.getState().activePanel };
      layout.closePanel('nonexistent');
      expect(layout.getState().activePanel).toEqual(before);
    });
  });

  describe('movePanel', () => {
    it('updates panelSlot in state', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.movePanel('a', SlotName.RightBottom);
      expect(layout.getState().panelSlot['a']).toBe(SlotName.RightBottom);
    });

    it('is a no-op when source and target slot are the same', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.movePanel('a', SlotName.LeftTop);
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a');
    });

    it('deactivates panel in source slot when it was active', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.movePanel('a', SlotName.RightBottom);
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });

    it('does nothing for unknown id', () => {
      layout = new FrameLayout(mount, makePanels());
      const before = { ...layout.getState().panelSlot };
      layout.movePanel('nonexistent', SlotName.RightBottom);
      expect(layout.getState().panelSlot).toEqual(before);
    });
  });

  describe('destroy', () => {
    it('removes element from DOM', () => {
      layout = new FrameLayout(mount, makePanels());
      const el = layout.element;
      layout.destroy();
      expect(mount.contains(el)).toBe(false);
    });
  });

  describe('storage', () => {
    it('calls load on construction', () => {
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      expect(storage.load).toHaveBeenCalledOnce();
    });

    it('restores widescreen from stored state', () => {
      const stored = makeStoredState();
      stored.widescreen = true;
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(stored),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      expect(layout.getState().widescreen).toBe(true);
    });

    it('animated option overrides stored value', () => {
      const stored = makeStoredState();
      stored.animated = true;
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(stored),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { animated: false, storage });
      expect(layout.getState().animated).toBe(false);
    });

    it('calls save when openPanel is called', () => {
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      layout.openPanel('a');
      expect(storage.save).toHaveBeenCalled();
    });

    it('calls save when setWidescreen is called', () => {
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      layout.setWidescreen(true);
      expect(storage.save).toHaveBeenCalled();
    });

    it('calls save when closePanel is called', () => {
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      layout.closePanel('c');
      expect(storage.save).toHaveBeenCalled();
    });
  });

  describe('RailEventType.Click', () => {
    it('opens panel when slot is empty', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, RailEventType.Click, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a');
    });

    it('closes panel when same panel is already active (toggle off)', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      dispatch(layout.element, RailEventType.Click, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });

    it('switches to different panel in same slot', () => {
      const panels = makePanels();
      panels.push({ id: 'a2', title: 'A2', slot: SlotName.LeftTop, pinned: false });
      layout = new FrameLayout(mount, panels);
      layout.openPanel('a');
      dispatch(layout.element, RailEventType.Click, { panelId: 'a2', slot: SlotName.LeftTop });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a2');
    });
  });

  describe('PanelEventType.Close', () => {
    it('deactivates active panel', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      dispatch(layout.element, PanelEventType.Close, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });

    it('does nothing when panel is not the active one', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, PanelEventType.Close, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });
  });

  describe('PanelEventType.Pin', () => {
    it('toggles unpinned panel to pinned in panelPinned state', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, PanelEventType.Pin, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().panelPinned['a']).toBe(true);
    });

    it('updates slotHasPinned when panel is pinned', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, PanelEventType.Pin, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().slotHasPinned[SlotName.LeftTop]).toBe(true);
    });

    it('toggles pinned panel back to unpinned', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, PanelEventType.Pin, { panelId: 'c', slot: SlotName.RightTop });
      expect(layout.getState().panelPinned['c']).toBe(false);
    });

    it('updates slotHasPinned when last pinned panel is unpinned', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, PanelEventType.Pin, { panelId: 'c', slot: SlotName.RightTop });
      expect(layout.getState().slotHasPinned[SlotName.RightTop]).toBe(false);
    });
  });

  describe('ResizerEventType.Change', () => {
    it('closes all panels in the dock when size is 0', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      dispatch(layout.element, ResizerEventType.Change, { edge: DockEdge.Left, size: 0 });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
      expect(layout.getState().activePanel[SlotName.LeftBottom]).toBeNull();
    });

    it('updates dock size in state when size > 0', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, ResizerEventType.Change, { edge: DockEdge.Left, size: 320 });
      expect(layout.getState().docks[DockEdge.Left].size).toBe(320);
    });
  });

  describe('SplitterEventType.Change', () => {
    it('updates split ratio for the dock', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, SplitterEventType.Change, { edge: DockEdge.Left, ratio: 0.3 });
      expect(layout.getState().docks[DockEdge.Left].splitRatio).toBe(0.3);
    });
  });

  describe('getStage', () => {
    it('returns the .frame-stage element', () => {
      layout = new FrameLayout(mount, makePanels());
      const stage = layout.getStage();
      expect(stage.classList.contains('frame-stage')).toBe(true);
      expect(layout.element.contains(stage)).toBe(true);
    });

    it('consumers can append content to stage', () => {
      layout = new FrameLayout(mount, makePanels());
      const stage = layout.getStage();
      const child = document.createElement('span');
      child.textContent = 'mounted';
      stage.appendChild(child);
      expect(layout.element.querySelector('.frame-stage')?.contains(child)).toBe(true);
    });
  });

  describe('OverlayEventType.Close', () => {
    it('does not throw when activePanel references an id missing from panels[]', () => {
      const stored = makeStoredState();
      stored.activePanel[SlotName.LeftTop] = 'ghost';
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(stored),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      const handler = (layout as unknown as { onOverlayClose: (e: CustomEvent) => void }).onOverlayClose;
      const ev = new CustomEvent(OverlayEventType.Close, { detail: { edge: DockEdge.Left } });
      expect(() => handler.call(layout, ev)).not.toThrow();
    });

    it('pointerdown outside open dock with stale activePanel id does not report a window error', () => {
      const stored = makeStoredState();
      stored.activePanel[SlotName.LeftTop] = 'ghost';
      const storage: StorageAdapter = {
        load: vi.fn().mockReturnValue(stored),
        save: vi.fn(),
      };
      layout = new FrameLayout(mount, makePanels(), { storage });
      const errors: unknown[] = [];
      const onError = (e: ErrorEvent): void => { errors.push(e.error ?? e.message); };
      window.addEventListener('error', onError);
      try {
        const outside = document.createElement('div');
        document.body.appendChild(outside);
        outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        outside.remove();
      } finally {
        window.removeEventListener('error', onError);
      }
      expect(errors).toEqual([]);
    });

    it('clears non-pinned panels on overlay close', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      dispatch(layout.element, OverlayEventType.Close, { edge: DockEdge.Left });
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
    });

    it('preserves pinned panels on overlay close', () => {
      layout = new FrameLayout(mount, makePanels());
      dispatch(layout.element, OverlayEventType.Close, { edge: DockEdge.Right });
      expect(layout.getState().activePanel[SlotName.RightTop]).toBe('c');
    });
  });

  describe('toggleFullscreen', () => {
    it('sets fullscreenPanel in state', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      expect(layout.getState().fullscreenPanel).toBe('a');
    });

    it('adds panel-fullscreen class to panel element', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      const panel = layout.element.querySelector('.panel-fullscreen');
      expect(panel).not.toBeNull();
    });

    it('moves panel element to frame root', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      const panel = layout.element.querySelector('.panel-fullscreen');
      expect(panel?.parentElement).toBe(layout.element);
    });

    it('exits fullscreen on second toggle', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      layout.toggleFullscreen('a');
      expect(layout.getState().fullscreenPanel).toBeNull();
    });

    it('removes panel-fullscreen class on exit', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      layout.toggleFullscreen('a');
      expect(layout.element.querySelector('.panel-fullscreen')).toBeNull();
    });

    it('only one panel can be fullscreen at a time', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      layout.toggleFullscreen('c');
      expect(layout.getState().fullscreenPanel).toBe('c');
      expect(layout.element.querySelectorAll('.panel-fullscreen').length).toBe(1);
    });

    it('exits fullscreen when panel is closed', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      dispatch(layout.element, PanelEventType.Close, { panelId: 'a', slot: SlotName.LeftTop });
      expect(layout.getState().fullscreenPanel).toBeNull();
    });

    it('exits fullscreen when panel is moved', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      layout.movePanel('a', SlotName.RightBottom);
      expect(layout.getState().fullscreenPanel).toBeNull();
    });

    it('dispatches frame:fullscreen event from button click', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      let detail: any = null;
      layout.element.addEventListener(PanelEventType.Fullscreen, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      dispatch(layout.element, PanelEventType.Fullscreen, { panelId: 'a', slot: SlotName.LeftTop });
      expect(detail).toEqual({ panelId: 'a', slot: SlotName.LeftTop });
    });
  });

  describe('theme', () => {
    it('getTheme returns obsidian by default', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.getTheme()).toBe('obsidian');
    });

    it('setTheme sets data-theme attribute', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setTheme('dracula');
      expect(layout.element.getAttribute('data-theme')).toBe('dracula');
    });

    it('setTheme removes data-theme for obsidian', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setTheme('dracula');
      layout.setTheme('obsidian');
      expect(layout.element.getAttribute('data-theme')).toBeNull();
    });

    it('getTheme returns current theme', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setTheme('nord');
      expect(layout.getTheme()).toBe('nord');
    });

    it('dispatches frame:theme event on change', () => {
      layout = new FrameLayout(mount, makePanels());
      let detail: any = null;
      layout.element.addEventListener(ThemeEventType.Change, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      layout.setTheme('dracula');
      expect(detail).toEqual({ theme: 'dracula', previous: 'obsidian' });
    });

    it('does not dispatch event when theme is unchanged', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setTheme('dracula');
      let called = false;
      layout.element.addEventListener(ThemeEventType.Change, () => { called = true; });
      layout.setTheme('dracula');
      expect(called).toBe(false);
    });

    it('accepts custom string themes', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.setTheme('my-custom-theme');
      expect(layout.getTheme()).toBe('my-custom-theme');
      expect(layout.element.getAttribute('data-theme')).toBe('my-custom-theme');
    });
  });

  describe('disableRail', () => {
    it('removes rail element from DOM', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      expect(layout.element.querySelector('.frame-rail.left')).toBeNull();
    });

    it('removes dock element from DOM', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      expect(layout.element.querySelector('.frame-dock.left')).toBeNull();
    });

    it('isRailDisabled returns true after disable', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      expect(layout.isRailDisabled(DockEdge.Left)).toBe(true);
    });

    it('isRailDisabled returns false by default', () => {
      layout = new FrameLayout(mount, makePanels());
      expect(layout.isRailDisabled(DockEdge.Left)).toBe(false);
    });

    it('closes active panels in disabled rail', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.disableRail(DockEdge.Left);
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
      expect(layout.getState().activePanel[SlotName.LeftBottom]).toBeNull();
    });

    it('exits fullscreen when panel in disabled rail is fullscreen', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.openPanel('a');
      layout.toggleFullscreen('a');
      layout.disableRail(DockEdge.Left);
      expect(layout.getState().fullscreenPanel).toBeNull();
    });

    it('openPanel is a no-op for panel in disabled rail', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      layout.openPanel('a');
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBeNull();
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Cannot open panel'));
      spy.mockRestore();
    });

    it('movePanel to disabled rail is a no-op', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Right);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      layout.movePanel('a', SlotName.RightTop);
      expect(layout.getState().panelSlot['a']).toBe(SlotName.LeftTop);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Cannot move panel'));
      spy.mockRestore();
    });

    it('dispatches frame:rail-disabled event', () => {
      layout = new FrameLayout(mount, makePanels());
      let detail: any = null;
      layout.element.addEventListener(RailDisabledEventType.Change, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      layout.disableRail(DockEdge.Left);
      expect(detail).toEqual({ edge: DockEdge.Left, disabled: true });
    });

    it('is a no-op when already disabled', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      let called = false;
      layout.element.addEventListener(RailDisabledEventType.Change, () => { called = true; });
      layout.disableRail(DockEdge.Left);
      expect(called).toBe(false);
    });

    it('auto-moves panels to target rail', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left, DockEdge.Right);
      expect(layout.getState().panelSlot['a']).toBe(SlotName.RightTop);
      expect(layout.getState().panelSlot['b']).toBe(SlotName.RightBottom);
    });

    it('errors when autoMoveTarget is also disabled', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Right);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      layout.disableRail(DockEdge.Left, DockEdge.Right);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Cannot auto-move'));
      expect(layout.isRailDisabled(DockEdge.Left)).toBe(false);
      spy.mockRestore();
    });
  });

  describe('enableRail', () => {
    it('restores rail element to DOM', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      layout.enableRail(DockEdge.Left);
      expect(layout.element.querySelector('.frame-rail.left')).not.toBeNull();
    });

    it('restores dock element to DOM', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      layout.enableRail(DockEdge.Left);
      expect(layout.element.querySelector('.frame-dock.left')).not.toBeNull();
    });

    it('isRailDisabled returns false after enable', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      layout.enableRail(DockEdge.Left);
      expect(layout.isRailDisabled(DockEdge.Left)).toBe(false);
    });

    it('dispatches frame:rail-disabled event with disabled=false', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      let detail: any = null;
      layout.element.addEventListener(RailDisabledEventType.Change, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      layout.enableRail(DockEdge.Left);
      expect(detail).toEqual({ edge: DockEdge.Left, disabled: false });
    });

    it('is a no-op when rail is not disabled', () => {
      layout = new FrameLayout(mount, makePanels());
      let called = false;
      layout.element.addEventListener(RailDisabledEventType.Change, () => { called = true; });
      layout.enableRail(DockEdge.Left);
      expect(called).toBe(false);
    });

    it('panels in re-enabled rail can be opened again', () => {
      layout = new FrameLayout(mount, makePanels());
      layout.disableRail(DockEdge.Left);
      layout.enableRail(DockEdge.Left);
      layout.openPanel('a');
      expect(layout.getState().activePanel[SlotName.LeftTop]).toBe('a');
    });
  });

  describe('rail disable via config', () => {
    it('disables rail at init time', () => {
      layout = new FrameLayout(mount, makePanels(), {
        rails: { [DockEdge.Left]: { disabled: true } },
      });
      expect(layout.isRailDisabled(DockEdge.Left)).toBe(true);
      expect(layout.element.querySelector('.frame-rail.left')).toBeNull();
    });

    it('auto-moves panels at init time', () => {
      layout = new FrameLayout(mount, makePanels(), {
        rails: { [DockEdge.Left]: { disabled: true, autoMoveTarget: DockEdge.Right } },
      });
      expect(layout.getState().panelSlot['a']).toBe(SlotName.RightTop);
      expect(layout.getState().panelSlot['b']).toBe(SlotName.RightBottom);
    });
  });
});
