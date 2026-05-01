import type { PanelIcon } from './panel-icon.js';
import type { SlotName } from './slot-name.js';

export interface PanelConfig {
  id: string;
  title: string;
  slot: SlotName;
  pinned: boolean;
  fullscreenable?: boolean;
  icon?: PanelIcon;
  content?: HTMLElement;
}
