import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Rail } from '../../src/rail/rail.js';
import { DockEdge } from '../../src/types/dock-edge.js';
import { SlotName } from '../../src/types/slot-name.js';
import { RailEventType } from '../../src/types/rail-event-type.js';
import type { PanelConfig } from '../../src/types/panel.js';

const INACTIVE: Record<SlotName, string | null> = {
  [SlotName.LeftTop]:    null,
  [SlotName.LeftBottom]: null,
  [SlotName.RightTop]:   null,
  [SlotName.RightBottom]:null,
  [SlotName.TopLeft]:    null,
  [SlotName.TopRight]:   null,
  [SlotName.BottomLeft]: null,
  [SlotName.BottomRight]:null,
};

function makePanels(): PanelConfig[] {
  return [
    { id: 'a', title: 'Panel A', slot: SlotName.LeftTop,    pinned: false },
    { id: 'b', title: 'Panel B', slot: SlotName.LeftBottom, pinned: false },
  ];
}

describe('Rail', () => {
  let el: HTMLElement;
  let rail: Rail;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    rail?.destroy();
    el.remove();
  });

  it('creates one icon per panel', () => {
    rail = new Rail(el, DockEdge.Left, makePanels());
    expect(el.querySelectorAll('.rail-icon').length).toBe(2);
  });

  it('icon title matches panel title', () => {
    rail = new Rail(el, DockEdge.Left, makePanels());
    const icons = el.querySelectorAll('.rail-icon');
    expect(icons[0].getAttribute('title')).toBe('Panel A');
    expect(icons[1].getAttribute('title')).toBe('Panel B');
  });

  it('icons default aria-pressed=false', () => {
    rail = new Rail(el, DockEdge.Left, makePanels());
    for (const icon of el.querySelectorAll('.rail-icon')) {
      expect(icon.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('uses first letter as fallback icon content when no icon provided', () => {
    rail = new Rail(el, DockEdge.Left, makePanels());
    const icon = el.querySelector('.rail-icon') as HTMLElement;
    expect(icon.textContent).toBe('P');
  });

  it('icon click dispatches RailEventType.Click with panelId and slot', () => {
    rail = new Rail(el, DockEdge.Left, makePanels());
    let detail: any = null;
    el.addEventListener(RailEventType.Click, (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    (el.querySelector('.rail-icon') as HTMLElement).click();
    expect(detail).toEqual({ panelId: 'a', slot: SlotName.LeftTop });
  });

  describe('update', () => {
    it('marks active panel icon with active class and aria-pressed=true', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      rail.update({ ...INACTIVE, [SlotName.LeftTop]: 'a' });
      const [iconA, iconB] = el.querySelectorAll('.rail-icon');
      expect(iconA.classList.contains('active')).toBe(true);
      expect(iconA.getAttribute('aria-pressed')).toBe('true');
      expect(iconB.classList.contains('active')).toBe(false);
      expect(iconB.getAttribute('aria-pressed')).toBe('false');
    });

    it('clears active when no panel is active', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      rail.update({ ...INACTIVE, [SlotName.LeftTop]: 'a' });
      rail.update(INACTIVE);
      for (const icon of el.querySelectorAll('.rail-icon')) {
        expect(icon.classList.contains('active')).toBe(false);
      }
    });
  });

  describe('addPanel', () => {
    it('adds icon for new panel in the correct slot', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      const panel: PanelConfig = { id: 'c', title: 'Panel C', slot: SlotName.LeftTop, pinned: false };
      rail.addPanel(panel);
      expect(el.querySelectorAll('.rail-icon').length).toBe(3);
    });

    it('does nothing for a slot not belonging to this rail', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      const panel: PanelConfig = { id: 'z', title: 'Z', slot: SlotName.RightTop, pinned: false };
      rail.addPanel(panel);
      expect(el.querySelectorAll('.rail-icon').length).toBe(2);
    });
  });

  describe('removePanel', () => {
    it('removes the icon for the panel', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      rail.removePanel('a');
      expect(el.querySelectorAll('.rail-icon').length).toBe(1);
      expect(el.querySelector('[title="Panel A"]')).toBeNull();
    });

    it('is a no-op for unknown panel id', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      rail.removePanel('nonexistent');
      expect(el.querySelectorAll('.rail-icon').length).toBe(2);
    });
  });

  describe('destroy', () => {
    it('removes event listeners without throwing', () => {
      rail = new Rail(el, DockEdge.Left, makePanels());
      expect(() => rail.destroy()).not.toThrow();
    });
  });
});
