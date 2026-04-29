import type { TransitionConfig } from './transition-config.js';
import type { StorageAdapter } from './storage-adapter.js';

export interface FrameOptions {
  animated?: boolean;
  transition?: TransitionConfig;
  storage?: StorageAdapter;
}
