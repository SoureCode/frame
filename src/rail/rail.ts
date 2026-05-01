import type { PanelConfig } from '../types/panel.js';
import type { PanelIcon } from '../types/panel-icon.js';
import type { RailEventDetail } from '../types/rail-event-detail.js';
import type { RailMoveDetail } from '../types/rail-move-detail.js';
import { RailEventType } from '../types/rail-event-type.js';
import { SlotName } from '../types/slot-name.js';
import { EDGE_SLOTS } from '../layout/constants.js';
import { DockEdge } from '../types/dock-edge.js';
import './rail.scss';

interface ActiveDrag {
  panelId: string;
  icon: HTMLElement;
  placeholder: HTMLElement;
}

export class Rail {
  private static activeDrag: ActiveDrag | null = null;
  private static readonly instances: Rail[] = [];
  private static activeDropSlot: HTMLElement | null = null;

  private static initDropZones(): void {
    for (const rail of Rail.instances) {
      for (const half of rail.halfSlot.keys()) {
        half.appendChild(Rail.makeIndicator());
      }
    }
  }

  private static setActiveDropSlot(slot: HTMLElement): void {
    if (Rail.activeDropSlot === slot) { return; }
    if (Rail.activeDropSlot) {
      Rail.activeDropSlot.appendChild(Rail.makeIndicator());
    }
    slot.querySelector('.rail-indicator')?.remove();
    Rail.activeDropSlot = slot;
  }

  private static clearDropZones(): void {
    for (const indicator of document.querySelectorAll('.rail-indicator')) {
      indicator.remove();
    }
    Rail.activeDropSlot = null;
  }

  private static makeIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'rail-placeholder rail-indicator';
    return indicator;
  }

  private readonly slots: [SlotName, SlotName];
  private readonly isVertical: boolean;
  private readonly icons: Map<string, HTMLElement> = new Map();
  private readonly iconSlot: Map<string, SlotName> = new Map();
  private readonly halfSlot: Map<HTMLElement, SlotName> = new Map();
  private readonly iconId: Map<HTMLElement, string> = new Map();

  constructor(
    public readonly element: HTMLElement,
    edge: DockEdge,
    panels: PanelConfig[],
  ) {
    this.slots = EDGE_SLOTS[edge];
    this.isVertical = edge === DockEdge.Left || edge === DockEdge.Right;
    Rail.instances.push(this);
    this.build(panels);
    this.element.addEventListener('dragover', this.onDragOver);
    this.element.addEventListener('drop', this.onDrop);
  }

  public destroy(): void {
    this.element.removeEventListener('dragover', this.onDragOver);
    this.element.removeEventListener('drop', this.onDrop);
    const idx = Rail.instances.indexOf(this);
    if (idx !== -1) { Rail.instances.splice(idx, 1); }
  }

  public removePanel(panelId: string): void {
    const icon = this.icons.get(panelId);
    if (!icon) { return; }
    icon.remove();
    this.icons.delete(panelId);
    this.iconSlot.delete(panelId);
    this.iconId.delete(icon);
  }

  public addPanel(panel: PanelConfig): void {
    for (const [halfElement, slot] of this.halfSlot) {
      if (slot === panel.slot) {
        const icon = this.buildIcon(panel);
        this.icons.set(panel.id, icon);
        this.iconSlot.set(panel.id, slot);
        this.iconId.set(icon, panel.id);
        halfElement.appendChild(icon);
        break;
      }
    }
  }

  public update(activePanel: Record<SlotName, string | null>): void {
    for (const slot of this.slots) {
      const activePanelId = activePanel[slot];

      for (const [panelId, icon] of this.icons) {
        if (this.iconSlot.get(panelId) !== slot) { continue; }
        const active = panelId === activePanelId;
        icon.classList.toggle('active', active);
        icon.setAttribute('aria-pressed', String(active));
      }
    }
  }

  private build(panels: PanelConfig[]): void {
    const [slotA, slotB] = this.slots;
    const half1 = this.buildHalf(slotA, panels.filter(p => p.slot === slotA));
    const half2 = this.buildHalf(slotB, panels.filter(p => p.slot === slotB));
    this.element.appendChild(half1);
    this.element.appendChild(half2);
  }

  private buildHalf(slot: SlotName, panels: PanelConfig[]): HTMLElement {
    const half = document.createElement('div');
    half.className = 'rail-slot';
    this.halfSlot.set(half, slot);

    for (const panel of panels) {
      const icon = this.buildIcon(panel);
      this.icons.set(panel.id, icon);
      this.iconSlot.set(panel.id, slot);
      this.iconId.set(icon, panel.id);
      half.appendChild(icon);
    }

    return half;
  }

  private buildIcon(panel: PanelConfig): HTMLElement {
    const button = document.createElement('button');
    button.className = 'rail-icon';
    button.type = 'button';
    button.title = panel.title;
    button.setAttribute('aria-label', panel.title);
    button.setAttribute('aria-pressed', 'false');
    button.draggable = true;

    this.applyIconContent(button, panel.icon, panel.title);

    button.addEventListener('click', () => {
      const detail: RailEventDetail = { panelId: panel.id, slot: panel.slot };
      this.element.dispatchEvent(new CustomEvent(RailEventType.Click, { detail, bubbles: true }));
    });

    button.addEventListener('dragstart', (e) => {
      const placeholder = document.createElement('div');
      placeholder.className = 'rail-placeholder';
      Rail.activeDrag = { panelId: panel.id, icon: button, placeholder };
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', panel.id);
      requestAnimationFrame(() => {
        button.parentElement!.insertBefore(placeholder, button);
        button.style.display = 'none';
        Rail.initDropZones();
      });
    });

    button.addEventListener('dragend', () => {
      if (Rail.activeDrag?.icon === button) {
        Rail.activeDrag.placeholder.remove();
        Rail.activeDrag = null;
      }
      button.style.display = '';
      Rail.clearDropZones();
    });

    return button;
  }

  private onDragOver = (e: DragEvent): void => {
    const drag = Rail.activeDrag;
    if (!drag) { return; }
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';

    const target = e.target as HTMLElement;
    if (target === drag.placeholder || drag.placeholder.contains(target)) { return; }

    const overIcon = target.closest('.rail-icon') as HTMLElement | null;
    const overSlot = target.closest('.rail-slot') as HTMLElement | null;

    if (overIcon && overIcon !== drag.icon) {
      const rect = overIcon.getBoundingClientRect();
      const mid = this.isVertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const pos = this.isVertical ? e.clientY : e.clientX;
      const before = pos < mid;
      const alreadyInPlace = before
        ? drag.placeholder.nextSibling === overIcon
        : drag.placeholder.previousSibling === overIcon;

      if (!alreadyInPlace) {
        Rail.setActiveDropSlot(overIcon.parentElement!);
        overIcon.parentElement!.insertBefore(drag.placeholder, before ? overIcon : overIcon.nextSibling);
      }
    } else if (overSlot && overIcon !== drag.icon) {
      if (overSlot.lastElementChild !== drag.placeholder) {
        Rail.setActiveDropSlot(overSlot);
        overSlot.appendChild(drag.placeholder);
      }
    }
  };

  private onDrop = (e: DragEvent): void => {
    e.preventDefault();
    const drag = Rail.activeDrag;
    if (!drag) { return; }

    const slot = drag.placeholder.parentElement as HTMLElement;
    const toSlot = this.halfSlot.get(slot);
    if (toSlot === undefined) {
      drag.placeholder.remove();
      drag.icon.style.display = '';
      Rail.activeDrag = null;
      return;
    }

    const next = drag.placeholder.nextElementSibling as HTMLElement | null;
    const beforePanelId = next?.classList.contains('rail-icon')
      ? (this.iconId.get(next) ?? null)
      : null;

    slot.insertBefore(drag.icon, drag.placeholder);
    drag.placeholder.remove();

    for (const rail of Rail.instances) {
      if (rail !== this) {
        rail.icons.delete(drag.panelId);
        rail.iconSlot.delete(drag.panelId);
        rail.iconId.delete(drag.icon);
      }
    }
    this.icons.set(drag.panelId, drag.icon);
    this.iconId.set(drag.icon, drag.panelId);
    this.iconSlot.set(drag.panelId, toSlot);

    const detail: RailMoveDetail = { panelId: drag.panelId, toSlot, beforePanelId };
    this.element.dispatchEvent(new CustomEvent(RailEventType.Move, { detail, bubbles: true }));

    Rail.activeDrag = null;
    Rail.clearDropZones();
  };

  private applyIconContent(button: HTMLElement, icon: PanelIcon | undefined, title: string): void {
    if (!icon) {
      button.textContent = title[0].toUpperCase();
      return;
    }
    if (typeof icon === 'string') {
      const doc = new DOMParser().parseFromString(icon, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (svg) {
        for (const node of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
          for (const attr of Array.from(node.attributes)) {
            if (attr.name.startsWith('on')) { node.removeAttribute(attr.name); }
          }
        }
        button.appendChild(document.adoptNode(svg));
      } else {
        button.textContent = title[0].toUpperCase();
      }
      return;
    }
    if (typeof icon === 'function') {
      button.appendChild(icon());
      return;
    }
    button.appendChild(icon);
  }
}
