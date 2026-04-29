import type { SlotName } from './slot-name.js';

export interface RailMoveDetail {
  panelId: string;
  toSlot: SlotName;
  beforePanelId: string | null;
}
