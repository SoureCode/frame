import type { LayoutState } from '../types/layout.js';
import type { StorageAdapter } from '../types/storage-adapter.js';

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly key: string) {}

  load(): LayoutState | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) { return null; }
      return JSON.parse(raw) as LayoutState;
    } catch (e) {
      console.error('[frame] Failed to load layout state:', e);
      return null;
    }
  }

  save(state: LayoutState): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch (e) {
      console.error('[frame] Failed to save layout state:', e);
    }
  }
}
