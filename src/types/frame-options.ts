import type { DockEdge } from './dock-edge.js';
import type { RailConfig } from './rail-config.js';
import type { TransitionConfig } from './transition-config.js';
import type { StorageAdapter } from './storage-adapter.js';

export interface FrameOptions {
  animated?: boolean;
  transition?: TransitionConfig;
  storage?: StorageAdapter;
  rails?: Partial<Record<DockEdge, RailConfig>>;
}
