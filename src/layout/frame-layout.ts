import { DockEdge } from '../types/dock-edge.js';
import type { LayoutState } from '../types/layout.js';
import type { SlotName } from '../types/slot-name.js';
import type { FrameOptions } from '../types/frame-options.js';
import type { StorageAdapter } from '../types/storage-adapter.js';
import type { PanelConfig } from '../types/panel.js';
import type { SplitterEventDetail } from '../types/splitter-event-detail.js';
import type { ResizerEventDetail } from '../types/resizer-event-detail.js';
import type { RailEventDetail } from '../types/rail-event-detail.js';
import type { RailMoveDetail } from '../types/rail-move-detail.js';
import type { PanelEventDetail } from '../types/panel-event-detail.js';
import type { OverlayEventDetail } from '../types/overlay-event-detail.js';
import { SplitterEventType } from '../types/splitter-event-type.js';
import { ResizerEventType } from '../types/resizer-event-type.js';
import { RailEventType } from '../types/rail-event-type.js';
import { PanelEventType } from '../types/panel-event-type.js';
import { OverlayEventType } from '../types/overlay-event-type.js';
import { Panel } from '../panel/panel.js';
import { Rail } from '../rail/rail.js';
import { Splitter } from '../splitter/splitter.js';
import { Resizer } from '../resizer/resizer.js';
import { EDGE_NAME, EDGE_SLOTS, EDGE_SPLITTER_ORIENTATION, EDGES, OPPOSITE_EDGE, SLOT_EDGE, DOCK_DEFAULT_SIZE, DOCK_MIN_SIZE } from './constants.js';
import './frame-layout.scss';
import '../themes/frame-theme.scss';

export class FrameLayout {
  readonly element: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly railEls: Record<DockEdge, HTMLElement>;
  private readonly docks: Record<DockEdge, HTMLElement>;
  private readonly slots: Partial<Record<SlotName, HTMLElement>>;
  private readonly splitters: Record<DockEdge, Splitter>;
  private readonly resizers: Record<DockEdge, Resizer>;
  private readonly dockOpen: Partial<Record<DockEdge, boolean>> = {};
  private readonly storage: StorageAdapter | null = null;
  private readonly panels: PanelConfig[];
  private readonly panelMap: Map<string, Panel> = new Map();
  private readonly railMap: Map<DockEdge, Rail> = new Map();
  private state: LayoutState;

  constructor(mount: HTMLElement, panels: PanelConfig[], options?: FrameOptions) {
    this.panels = panels;
    this.slots = {};
    this.splitters = {} as Record<DockEdge, Splitter>;
    this.resizers = {} as Record<DockEdge, Resizer>;
    this.railEls = this.buildRailElements();
    this.docks = this.buildDocks();
    this.stage = document.createElement('div');
    this.stage.className = 'frame-stage';
    this.element = document.createElement('div');
    this.element.className = 'frame';
    this.buildDOM();
    mount.appendChild(this.element);

    if (options?.transition) {
      this.element.style.setProperty('--frame-transition-duration', options.transition.duration);
      this.element.style.setProperty('--frame-transition-easing', options.transition.easing);
    }

    this.state = this.buildInitialState(options?.animated ?? false);

    if (options?.storage) {
      this.storage = options.storage;
      const loaded = options.storage.load();
      if (loaded) {
        this.state = loaded;
        if (options?.animated !== undefined) { this.state.animated = options.animated; }
        for (const p of panels) {
          p.pinned = loaded.panelPinned[p.id] ?? p.pinned;
          p.slot = loaded.panelSlot[p.id] ?? p.slot;
        }
      }
    }

    this.element.classList.toggle('widescreen', this.state.widescreen);
    this.element.classList.toggle('animated', this.state.animated);

    this.mountPanels();
    this.mountRails();
    this.apply(this.state);

    this.element.addEventListener(SplitterEventType.Change, this.onSplitterChange as EventListener);
    this.element.addEventListener(ResizerEventType.Change, this.onResizerChange as EventListener);
    this.element.addEventListener(RailEventType.Click, this.onRailClick as EventListener);
    this.element.addEventListener(RailEventType.Move, this.onRailMove as EventListener);
    this.element.addEventListener(PanelEventType.Close, this.onPanelClose as EventListener);
    this.element.addEventListener(PanelEventType.Pin, this.onPanelPin as EventListener);
    this.element.addEventListener(OverlayEventType.Close, this.onOverlayClose as EventListener);
    document.addEventListener('pointerdown', this.onPointerDown);
  }

  destroy(): void {
    this.element.removeEventListener(SplitterEventType.Change, this.onSplitterChange as EventListener);
    this.element.removeEventListener(ResizerEventType.Change, this.onResizerChange as EventListener);
    this.element.removeEventListener(RailEventType.Click, this.onRailClick as EventListener);
    this.element.removeEventListener(RailEventType.Move, this.onRailMove as EventListener);
    this.element.removeEventListener(PanelEventType.Close, this.onPanelClose as EventListener);
    this.element.removeEventListener(PanelEventType.Pin, this.onPanelPin as EventListener);
    this.element.removeEventListener(OverlayEventType.Close, this.onOverlayClose as EventListener);
    document.removeEventListener('pointerdown', this.onPointerDown);
    for (const rail of this.railMap.values()) { rail.destroy(); }
    this.element.remove();
  }

  getState(): LayoutState {
    return this.state;
  }

  setWidescreen(enabled: boolean): void {
    this.state.widescreen = enabled;
    this.element.classList.toggle('widescreen', enabled);
    this.save();
  }

  setAnimated(enabled: boolean): void {
    this.state.animated = enabled;
    this.element.classList.toggle('animated', enabled);
    this.save();
  }

  openPanel(id: string): void {
    const config = this.panels.find(p => p.id === id);
    if (!config) { return; }
    const { slot } = config;
    const edge = SLOT_EDGE[slot];
    if (this.state.activePanel[slot] === id) { return; }
    const prev = this.state.activePanel[slot];
    if (prev) { this.panelMap.get(prev)?.setActive(false); }
    this.state.activePanel[slot] = id;
    this.panelMap.get(id)?.setActive(true);
    this.state.docks[edge].size = this.state.docks[edge].size || DOCK_DEFAULT_SIZE;
    this.apply(this.state);
    this.updateRails();
    this.save();
  }

  closePanel(id: string): void {
    const config = this.panels.find(p => p.id === id);
    if (!config) { return; }
    const { slot } = config;
    if (this.state.activePanel[slot] !== id) { return; }
    this.panelMap.get(id)?.setActive(false);
    this.state.activePanel[slot] = null;
    this.apply(this.state);
    this.updateRails();
    this.save();
  }

  movePanel(id: string, toSlot: SlotName): void {
    const config = this.panels.find(p => p.id === id);
    if (!config) { return; }
    const fromSlot = config.slot;
    if (fromSlot === toSlot) { return; }
    const fromEdge = SLOT_EDGE[fromSlot];
    const toEdge = SLOT_EDGE[toSlot];
    config.slot = toSlot;
    this.state.panelSlot[id] = toSlot;
    const panel = this.panelMap.get(id)!;
    this.slots[toSlot]!.appendChild(panel.element);
    if (this.state.activePanel[fromSlot] === id) {
      this.state.activePanel[fromSlot] = null;
      panel.setActive(false);
    }
    this.state.slotHasPinned[fromSlot] = this.panels.some(p => p.slot === fromSlot && p.pinned);
    this.state.slotHasPinned[toSlot] = this.panels.some(p => p.slot === toSlot && p.pinned);
    this.railMap.get(fromEdge)!.removePanel(id);
    this.railMap.get(toEdge)!.addPanel(config);
    this.apply(this.state);
    this.updateRails();
    this.save();
  }

  private buildInitialState(animated: boolean): LayoutState {
    const activePanel = {} as Record<SlotName, string | null>;
    const slotHasPinned = {} as Record<SlotName, boolean>;
    const panelPinned: Record<string, boolean> = {};
    const panelSlot: Record<string, SlotName> = {};

    for (const edge of EDGES) {
      const [slotA, slotB] = EDGE_SLOTS[edge];
      for (const slot of [slotA, slotB]) {
        const slotPanels = this.panels.filter(p => p.slot === slot);
        activePanel[slot] = slotPanels.find(p => p.pinned)?.id ?? null;
        slotHasPinned[slot] = slotPanels.some(p => p.pinned);
      }
    }

    for (const p of this.panels) {
      panelPinned[p.id] = p.pinned;
      panelSlot[p.id] = p.slot;
    }

    return {
      docks: {
        [DockEdge.Left]:   { size: DOCK_DEFAULT_SIZE, splitRatio: 0.5 },
        [DockEdge.Right]:  { size: DOCK_DEFAULT_SIZE, splitRatio: 0.5 },
        [DockEdge.Top]:    { size: DOCK_DEFAULT_SIZE, splitRatio: 0.5 },
        [DockEdge.Bottom]: { size: DOCK_DEFAULT_SIZE, splitRatio: 0.5 },
      },
      activePanel,
      slotHasPinned,
      panelPinned,
      panelSlot,
      widescreen: false,
      animated,
    };
  }

  private mountPanels(): void {
    for (const config of this.panels) {
      const panel = new Panel(config);
      panel.setPinned(config.pinned);
      panel.setActive(this.state.activePanel[config.slot] === config.id);
      this.panelMap.set(config.id, panel);
      this.slots[config.slot]!.appendChild(panel.element);
    }
  }

  private mountRails(): void {
    for (const edge of EDGES) {
      const [slotA, slotB] = EDGE_SLOTS[edge];
      const edgePanels = this.panels.filter(p => p.slot === slotA || p.slot === slotB);
      const rail = new Rail(this.railEls[edge], edge, edgePanels);
      rail.update(this.state.activePanel);
      this.railMap.set(edge, rail);
    }
  }

  private updateRails(): void {
    for (const rail of this.railMap.values()) { rail.update(this.state.activePanel); }
  }

  private save(): void {
    if (!this.storage) { return; }
    const activePanel = { ...this.state.activePanel };
    for (const edge of EDGES) {
      const [slotA, slotB] = EDGE_SLOTS[edge];
      if (!this.state.slotHasPinned[slotA]) { activePanel[slotA] = null; }
      if (!this.state.slotHasPinned[slotB]) { activePanel[slotB] = null; }
    }
    this.storage.save({ ...this.state, activePanel });
  }

  private onSplitterChange = (e: CustomEvent<SplitterEventDetail>): void => {
    this.state.docks[e.detail.edge].splitRatio = e.detail.ratio;
    this.apply(this.state);
    this.save();
  };

  private onResizerChange = (e: CustomEvent<ResizerEventDetail>): void => {
    const { edge, size } = e.detail;
    if (size === 0) {
      const [slotA, slotB] = EDGE_SLOTS[edge];
      for (const slot of [slotA, slotB]) {
        const panelId = this.state.activePanel[slot];
        if (panelId) { this.panelMap.get(panelId)?.setActive(false); }
        this.state.activePanel[slot] = null;
      }
      this.updateRails();
    } else {
      this.state.docks[edge].size = size;
    }
    this.apply(this.state);
    this.save();
  };

  private onRailClick = (e: CustomEvent<RailEventDetail>): void => {
    const { panelId, slot } = e.detail;
    const edge = SLOT_EDGE[slot];

    if (this.state.activePanel[slot] === null) {
      this.state.activePanel[slot] = panelId;
      this.panelMap.get(panelId)?.setActive(true);
      this.state.docks[edge].size = this.state.docks[edge].size || DOCK_DEFAULT_SIZE;
    } else if (this.state.activePanel[slot] === panelId) {
      this.state.activePanel[slot] = null;
      this.panelMap.get(panelId)?.setActive(false);
    } else {
      this.panelMap.get(this.state.activePanel[slot]!)?.setActive(false);
      this.state.activePanel[slot] = panelId;
      this.panelMap.get(panelId)?.setActive(true);
    }

    this.apply(this.state);
    this.updateRails();
    this.save();
  };

  private onRailMove = (e: CustomEvent<RailMoveDetail>): void => {
    const { panelId, toSlot, beforePanelId } = e.detail;
    const config = this.panels.find(p => p.id === panelId)!;
    const fromSlot = config.slot;
    config.slot = toSlot;
    this.state.panelSlot[panelId] = toSlot;

    const panel = this.panelMap.get(panelId)!;
    const targetSlotEl = this.slots[toSlot]!;

    if (beforePanelId) {
      const beforeEl = this.panelMap.get(beforePanelId)?.element;
      if (beforeEl) { targetSlotEl.insertBefore(panel.element, beforeEl); }
      else { targetSlotEl.appendChild(panel.element); }
    } else {
      targetSlotEl.appendChild(panel.element);
    }

    if (this.state.activePanel[fromSlot] === panelId) {
      this.state.activePanel[fromSlot] = null;
      panel.setActive(false);
    }

    panel.setActive(this.state.activePanel[toSlot] === panelId);
    panel.setPinned(config.pinned);
    this.state.slotHasPinned[fromSlot] = this.panels.some(p => p.slot === fromSlot && p.pinned);
    this.state.slotHasPinned[toSlot] = this.panels.some(p => p.slot === toSlot && p.pinned);

    this.apply(this.state);
    this.updateRails();
    this.save();
  };

  private onPanelClose = (e: CustomEvent<PanelEventDetail>): void => {
    const { panelId, slot } = e.detail;
    if (this.state.activePanel[slot] !== panelId) { return; }
    this.panelMap.get(panelId)?.setActive(false);
    this.state.activePanel[slot] = null;
    this.apply(this.state);
    this.updateRails();
    this.save();
  };

  private onPanelPin = (e: CustomEvent<PanelEventDetail>): void => {
    const config = this.panels.find(p => p.id === e.detail.panelId)!;
    config.pinned = !config.pinned;
    this.state.panelPinned[config.id] = config.pinned;
    this.panelMap.get(config.id)?.setPinned(config.pinned);
    this.state.slotHasPinned[config.slot] = this.panels.some(p => p.slot === config.slot && p.pinned);
    this.apply(this.state);
    this.save();
  };

  private onOverlayClose = (e: CustomEvent<OverlayEventDetail>): void => {
    const [slotA, slotB] = EDGE_SLOTS[e.detail.edge];
    let changed = false;
    for (const slot of [slotA, slotB] as const) {
      const panelId = this.state.activePanel[slot];
      if (!panelId) { continue; }
      const config = this.panels.find(p => p.id === panelId)!;
      if (config.pinned) { continue; }
      this.panelMap.get(panelId)?.setActive(false);
      this.state.activePanel[slot] = null;
      changed = true;
    }
    if (changed) {
      this.apply(this.state);
      this.updateRails();
      this.save();
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    const target = e.target as HTMLElement;
    for (const edge of EDGES) {
      if (!this.dockOpen[edge]) { continue; }
      if (!this.docks[edge].contains(target) && !this.railEls[edge].contains(target)) {
        const detail: OverlayEventDetail = { edge };
        this.element.dispatchEvent(new CustomEvent(OverlayEventType.Close, { detail, bubbles: true }));
      }
    }
  };

  private buildRailElements(): Record<DockEdge, HTMLElement> {
    const map = {} as Record<DockEdge, HTMLElement>;
    for (const edge of EDGES) {
      const el = document.createElement('div');
      el.className = `frame-rail ${EDGE_NAME[edge]}`;
      map[edge] = el;
    }
    return map;
  }

  private buildDocks(): Record<DockEdge, HTMLElement> {
    const map = {} as Record<DockEdge, HTMLElement>;
    for (const edge of EDGES) {
      const dock = document.createElement('div');
      dock.className = `frame-dock ${EDGE_NAME[edge]}`;
      const [slotA, slotB] = EDGE_SLOTS[edge];
      const slotAEl = document.createElement('div');
      slotAEl.className = 'dock-slot';
      const slotBEl = document.createElement('div');
      slotBEl.className = 'dock-slot';

      const isVertical = edge === DockEdge.Left || edge === DockEdge.Right;
      const oppositeEdge = OPPOSITE_EDGE[edge];
      const getMaxSize = () => {
        const dockRect = dock.getBoundingClientRect();
        const oppRect = this.docks[oppositeEdge].getBoundingClientRect();
        if (isVertical) {
          return edge === DockEdge.Left
            ? Math.max(0, oppRect.left - dockRect.left - 100)
            : Math.max(0, dockRect.right - oppRect.right - 100);
        } else {
          return edge === DockEdge.Top
            ? Math.max(0, oppRect.top - dockRect.top - 100)
            : Math.max(0, dockRect.bottom - oppRect.bottom - 100);
        }
      };

      const splitter = new Splitter(edge, EDGE_SPLITTER_ORIENTATION[edge]);
      const resizer = new Resizer(edge, DOCK_MIN_SIZE, getMaxSize);

      this.slots[slotA] = slotAEl;
      this.slots[slotB] = slotBEl;
      this.splitters[edge] = splitter;
      this.resizers[edge] = resizer;

      dock.appendChild(slotAEl);
      dock.appendChild(splitter.element);
      dock.appendChild(slotBEl);
      dock.appendChild(resizer.element);
      map[edge] = dock;
    }
    return map;
  }

  private buildDOM(): void {
    this.element.appendChild(this.railEls[DockEdge.Top]);
    this.element.appendChild(this.docks[DockEdge.Top]);
    this.element.appendChild(this.railEls[DockEdge.Left]);
    this.element.appendChild(this.docks[DockEdge.Left]);
    this.element.appendChild(this.stage);
    this.element.appendChild(this.docks[DockEdge.Right]);
    this.element.appendChild(this.railEls[DockEdge.Right]);
    this.element.appendChild(this.docks[DockEdge.Bottom]);
    this.element.appendChild(this.railEls[DockEdge.Bottom]);
  }

  private apply(state: LayoutState): void {
    for (const edge of EDGES) {
      const [slotA, slotB] = EDGE_SLOTS[edge];
      const aOpen = state.activePanel[slotA] !== null;
      const bOpen = state.activePanel[slotB] !== null;
      const dock = this.docks[edge];
      const { size, splitRatio } = state.docks[edge];
      const isVertical = edge === DockEdge.Left || edge === DockEdge.Right;
      const anyOpen = aOpen || bOpen;

      this.dockOpen[edge] = anyOpen;
      const dockPinned = state.slotHasPinned[slotA] || state.slotHasPinned[slotB];
      dock.classList.toggle('open', anyOpen);
      dock.classList.toggle('pinned', dockPinned);
      dock.style[isVertical ? 'width' : 'height'] = anyOpen ? `${size}px` : '0';
      dock.style[isVertical ? 'height' : 'width'] = '';

      const slotAEl = this.slots[slotA]!;
      const slotBEl = this.slots[slotB]!;
      slotAEl.classList.toggle('hidden', !aOpen);
      slotBEl.classList.toggle('hidden', !bOpen);

      if (aOpen && bOpen) {
        slotAEl.style.flex = `${splitRatio}`;
        slotBEl.style.flex = `${1 - splitRatio}`;
      } else {
        slotAEl.style.flex = '';
        slotBEl.style.flex = '';
      }

      this.splitters[edge].setVisible(aOpen && bOpen);
    }
  }
}
