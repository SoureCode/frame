import type { DockEdge } from './dock-edge.js';

export interface SplitterEventDetail {
  edge: DockEdge;
  ratio: number;
}
