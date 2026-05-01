import { describe, it, expect, afterEach } from 'vitest';
import { Panel } from '../../src/panel/panel.js';
import { SlotName } from '../../src/types/slot-name.js';
import { PanelEventType } from '../../src/types/panel-event-type.js';
import type { PanelConfig } from '../../src/types/panel.js';

const cfg: PanelConfig = { id: 'x', title: 'Test', slot: SlotName.LeftTop, pinned: false };

describe('Panel', () => {
  let panel: Panel;

  afterEach(() => panel?.element.remove());

  it('element has class panel', () => {
    panel = new Panel(cfg);
    expect(panel.element.classList.contains('panel')).toBe(true);
  });

  it('title is rendered', () => {
    panel = new Panel(cfg);
    expect(panel.element.querySelector('.panel-title')?.textContent).toBe('Test');
  });

  it('content element is appended when provided', () => {
    const inner = document.createElement('div');
    panel = new Panel({ ...cfg, content: inner });
    expect(panel.content.contains(inner)).toBe(true);
  });

  it('content element is empty when not provided', () => {
    panel = new Panel(cfg);
    expect(panel.content.children.length).toBe(0);
  });

  describe('setActive', () => {
    it('adds active class', () => {
      panel = new Panel(cfg);
      panel.setActive(true);
      expect(panel.element.classList.contains('active')).toBe(true);
    });

    it('removes active class', () => {
      panel = new Panel(cfg);
      panel.setActive(true);
      panel.setActive(false);
      expect(panel.element.classList.contains('active')).toBe(false);
    });
  });

  describe('setPinned', () => {
    it('adds pinned class to pin button', () => {
      panel = new Panel(cfg);
      panel.setPinned(true);
      expect(panel.element.querySelector('.panel-pin')?.classList.contains('pinned')).toBe(true);
    });

    it('removes pinned class on unpin', () => {
      panel = new Panel(cfg);
      panel.setPinned(true);
      panel.setPinned(false);
      expect(panel.element.querySelector('.panel-pin')?.classList.contains('pinned')).toBe(false);
    });

    it('sets aria-pressed=true on pin', () => {
      panel = new Panel(cfg);
      panel.setPinned(true);
      expect(panel.element.querySelector('.panel-pin')?.getAttribute('aria-pressed')).toBe('true');
    });

    it('sets aria-pressed=false on unpin', () => {
      panel = new Panel(cfg);
      panel.setPinned(true);
      panel.setPinned(false);
      expect(panel.element.querySelector('.panel-pin')?.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('fullscreen button', () => {
    it('renders fullscreen button by default', () => {
      panel = new Panel(cfg);
      expect(panel.element.querySelector('.panel-fullscreen-btn')).not.toBeNull();
    });

    it('does not render fullscreen button when fullscreenable=false', () => {
      panel = new Panel({ ...cfg, fullscreenable: false });
      expect(panel.element.querySelector('.panel-fullscreen-btn')).toBeNull();
    });

    it('fullscreen button is left of pin button in DOM order', () => {
      panel = new Panel(cfg);
      const header = panel.element.querySelector('.panel-header')!;
      const children = Array.from(header.children);
      const fullscreenIndex = children.findIndex(c => c.classList.contains('panel-fullscreen-btn'));
      const pinIndex = children.findIndex(c => c.classList.contains('panel-pin'));
      expect(fullscreenIndex).toBeLessThan(pinIndex);
    });

    it('dispatches PanelEventType.Fullscreen on click', () => {
      panel = new Panel(cfg);
      document.body.appendChild(panel.element);
      let detail: any = null;
      panel.element.addEventListener(PanelEventType.Fullscreen, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      (panel.element.querySelector('.panel-fullscreen-btn') as HTMLElement).click();
      expect(detail).toEqual({ panelId: 'x', slot: SlotName.LeftTop });
    });
  });

  describe('setFullscreen', () => {
    it('adds panel-fullscreen class', () => {
      panel = new Panel(cfg);
      panel.setFullscreen(true);
      expect(panel.element.classList.contains('panel-fullscreen')).toBe(true);
    });

    it('removes panel-fullscreen class', () => {
      panel = new Panel(cfg);
      panel.setFullscreen(true);
      panel.setFullscreen(false);
      expect(panel.element.classList.contains('panel-fullscreen')).toBe(false);
    });

    it('isFullscreen reflects state', () => {
      panel = new Panel(cfg);
      expect(panel.isFullscreen()).toBe(false);
      panel.setFullscreen(true);
      expect(panel.isFullscreen()).toBe(true);
      panel.setFullscreen(false);
      expect(panel.isFullscreen()).toBe(false);
    });

    it('updates aria-pressed on fullscreen button', () => {
      panel = new Panel(cfg);
      panel.setFullscreen(true);
      expect(panel.element.querySelector('.panel-fullscreen-btn')?.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('events', () => {
    it('close button dispatches PanelEventType.Close with correct detail', () => {
      panel = new Panel(cfg);
      document.body.appendChild(panel.element);
      let detail: any = null;
      panel.element.addEventListener(PanelEventType.Close, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      (panel.element.querySelector('.panel-close') as HTMLElement).click();
      expect(detail).toEqual({ panelId: 'x', slot: SlotName.LeftTop });
    });

    it('pin button dispatches PanelEventType.Pin with correct detail', () => {
      panel = new Panel(cfg);
      document.body.appendChild(panel.element);
      let detail: any = null;
      panel.element.addEventListener(PanelEventType.Pin, (e: Event) => {
        detail = (e as CustomEvent).detail;
      });
      (panel.element.querySelector('.panel-pin') as HTMLElement).click();
      expect(detail).toEqual({ panelId: 'x', slot: SlotName.LeftTop });
    });
  });
});
