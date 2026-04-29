import type { PanelEventDetail } from './types/panel-event-detail.js';
import type { PanelEventType } from './types/panel-event-type.js';
import type { RailEventDetail } from './types/rail-event-detail.js';
import type { RailMoveDetail } from './types/rail-move-detail.js';
import type { RailEventType } from './types/rail-event-type.js';
import type { SplitterEventDetail } from './types/splitter-event-detail.js';
import type { SplitterEventType } from './types/splitter-event-type.js';
import type { ResizerEventDetail } from './types/resizer-event-detail.js';
import type { ResizerEventType } from './types/resizer-event-type.js';
import type { OverlayEventDetail } from './types/overlay-event-detail.js';
import type { OverlayEventType } from './types/overlay-event-type.js';

declare global {
  interface HTMLElementEventMap {
    [PanelEventType.Pin]: CustomEvent<PanelEventDetail>;
    [PanelEventType.Close]: CustomEvent<PanelEventDetail>;
    [RailEventType.Click]: CustomEvent<RailEventDetail>;
    [RailEventType.Move]:  CustomEvent<RailMoveDetail>;
    [SplitterEventType.Change]: CustomEvent<SplitterEventDetail>;
    [ResizerEventType.Change]: CustomEvent<ResizerEventDetail>;
    [OverlayEventType.Close]: CustomEvent<OverlayEventDetail>;
  }
}
