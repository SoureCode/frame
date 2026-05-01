import type { DockEdge } from './dock-edge.js';
import type { DockState } from './dock.js';
import type { SlotName } from './slot-name.js';

export interface LayoutState {
  docks: Record<DockEdge, DockState>;
  activePanel: Record<SlotName, string | null>;
  slotHasPinned: Record<SlotName, boolean>;
  panelPinned: Record<string, boolean>;
  panelSlot: Record<string, SlotName>;
  fullscreenPanel: string | null;
  widescreen: boolean;
  animated: boolean;
}
