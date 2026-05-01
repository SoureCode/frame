import type { PanelEventDetail } from './panel-event-detail.js';

export type PanelPinEvent = CustomEvent<PanelEventDetail>;
export type PanelCloseEvent = CustomEvent<PanelEventDetail>;
export type PanelFullscreenEvent = CustomEvent<PanelEventDetail>;
