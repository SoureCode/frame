import type { DockEdge } from './dock-edge.js';

export interface ResizerEventDetail {
  edge: DockEdge;
  size: number;
}
