import type { DockEdge } from './dock-edge.js';

export interface RailDisabledEventDetail {
  edge: DockEdge;
  disabled: boolean;
}
