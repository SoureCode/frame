import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageAdapter } from '../../src/storage/local-storage-adapter.js';
import type { LayoutState } from '../../src/types/layout.js';
import { DockEdge } from '../../src/types/dock-edge.js';
import { SlotName } from '../../src/types/slot-name.js';

const KEY = 'test-key';

function makeState(): LayoutState {
  return {
    docks: {
      [DockEdge.Left]:   { size: 200, splitRatio: 0.5 },
      [DockEdge.Right]:  { size: 200, splitRatio: 0.5 },
      [DockEdge.Top]:    { size: 200, splitRatio: 0.5 },
      [DockEdge.Bottom]: { size: 200, splitRatio: 0.5 },
    },
    activePanel: {
      [SlotName.LeftTop]:    null,
      [SlotName.LeftBottom]: null,
      [SlotName.RightTop]:   null,
      [SlotName.RightBottom]:null,
      [SlotName.TopLeft]:    null,
      [SlotName.TopRight]:   null,
      [SlotName.BottomLeft]: null,
      [SlotName.BottomRight]:null,
    },
    slotHasPinned: {
      [SlotName.LeftTop]:    false,
      [SlotName.LeftBottom]: false,
      [SlotName.RightTop]:   false,
      [SlotName.RightBottom]:false,
      [SlotName.TopLeft]:    false,
      [SlotName.TopRight]:   false,
      [SlotName.BottomLeft]: false,
      [SlotName.BottomRight]:false,
    },
    panelPinned: {},
    panelSlot: {},
    widescreen: false,
    animated: false,
  };
}

describe('LocalStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('load', () => {
    it('returns null when key is absent', () => {
      const adapter = new LocalStorageAdapter(KEY);
      expect(adapter.load()).toBeNull();
    });

    it('returns parsed state when key exists', () => {
      const state = makeState();
      localStorage.setItem(KEY, JSON.stringify(state));
      const adapter = new LocalStorageAdapter(KEY);
      expect(adapter.load()).toEqual(state);
    });

    it('returns null on invalid JSON without throwing', () => {
      localStorage.setItem(KEY, '{invalid}');
      const adapter = new LocalStorageAdapter(KEY);
      expect(() => adapter.load()).not.toThrow();
      expect(adapter.load()).toBeNull();
    });
  });

  describe('save', () => {
    it('persists state to localStorage', () => {
      const state = makeState();
      const adapter = new LocalStorageAdapter(KEY);
      adapter.save(state);
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(state);
    });

    it('does not throw when localStorage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      const adapter = new LocalStorageAdapter(KEY);
      expect(() => adapter.save(makeState())).not.toThrow();
    });
  });
});
