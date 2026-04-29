import { DockEdge } from '../types/dock-edge.js';
import { SlotName } from '../types/slot-name.js';
import { SplitterOrientation } from '../types/splitter-orientation.js';

export const EDGE_NAME: Record<DockEdge, string> = {
  [DockEdge.Left]: 'left',
  [DockEdge.Right]: 'right',
  [DockEdge.Top]: 'top',
  [DockEdge.Bottom]: 'bottom',
};

export const EDGE_SLOTS: Record<DockEdge, [SlotName, SlotName]> = {
  [DockEdge.Left]: [SlotName.LeftTop, SlotName.LeftBottom],
  [DockEdge.Right]: [SlotName.RightTop, SlotName.RightBottom],
  [DockEdge.Top]: [SlotName.TopLeft, SlotName.TopRight],
  [DockEdge.Bottom]: [SlotName.BottomLeft, SlotName.BottomRight],
};

export const EDGES = [DockEdge.Top, DockEdge.Left, DockEdge.Right, DockEdge.Bottom] as const;

export const EDGE_SPLITTER_ORIENTATION: Record<DockEdge, SplitterOrientation> = {
  [DockEdge.Left]:   SplitterOrientation.Column,
  [DockEdge.Right]:  SplitterOrientation.Column,
  [DockEdge.Top]:    SplitterOrientation.Row,
  [DockEdge.Bottom]: SplitterOrientation.Row,
};

export const SLOT_EDGE: Record<SlotName, DockEdge> = {
  [SlotName.LeftTop]:     DockEdge.Left,
  [SlotName.LeftBottom]:  DockEdge.Left,
  [SlotName.RightTop]:    DockEdge.Right,
  [SlotName.RightBottom]: DockEdge.Right,
  [SlotName.TopLeft]:     DockEdge.Top,
  [SlotName.TopRight]:    DockEdge.Top,
  [SlotName.BottomLeft]:  DockEdge.Bottom,
  [SlotName.BottomRight]: DockEdge.Bottom,
};

export const OPPOSITE_EDGE: Record<DockEdge, DockEdge> = {
  [DockEdge.Left]:   DockEdge.Right,
  [DockEdge.Right]:  DockEdge.Left,
  [DockEdge.Top]:    DockEdge.Bottom,
  [DockEdge.Bottom]: DockEdge.Top,
};

export const DOCK_DEFAULT_SIZE = 200;
export const DOCK_MIN_SIZE = 80;
export const DOCK_SNAP_THRESHOLD = 40;
export const SPLITTER_MIN_SIZE = 64;
