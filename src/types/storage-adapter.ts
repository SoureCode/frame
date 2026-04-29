import type { LayoutState } from './layout.js';

export interface StorageAdapter {
  load(): LayoutState | null;
  save(state: LayoutState): void;
}
