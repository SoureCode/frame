import type { ResizerEventDetail } from '../types/resizer-event-detail.js';
import { ResizerEventType } from '../types/resizer-event-type.js';
import { DockEdge } from '../types/dock-edge.js';
import { EDGE_NAME, DOCK_MIN_SIZE, DOCK_SNAP_THRESHOLD } from '../layout/constants.js';
import './resizer.scss';

export class Resizer {
  public readonly element: HTMLElement;
  private fixedEdge: number = 0;
  private dynamicMax: number = 600;
  private pendingSize: number = 0;
  private rafId: number = 0;

  constructor(
    private readonly edge: DockEdge,
    private readonly minSize: number = DOCK_MIN_SIZE,
    private readonly getMaxSize: () => number = () => 600,
    private readonly snapThreshold: number = DOCK_SNAP_THRESHOLD,
  ) {
    this.element = document.createElement('div');
    this.element.className = `frame-resizer ${EDGE_NAME[edge]}`;
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) { return; }

    const dock = this.element.parentElement!;
    const rect = dock.getBoundingClientRect();

    switch (this.edge) {
      case DockEdge.Left:   this.fixedEdge = rect.left;   break;
      case DockEdge.Right:  this.fixedEdge = rect.right;  break;
      case DockEdge.Top:    this.fixedEdge = rect.top;    break;
      case DockEdge.Bottom: this.fixedEdge = rect.bottom; break;
    }

    this.dynamicMax = this.getMaxSize();
    dock.classList.add('resizing');
    this.element.setPointerCapture(e.pointerId);
    this.element.classList.add('active');
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('pointerup', this.onPointerUp, { once: true });
    this.element.addEventListener('pointercancel', this.onPointerUp, { once: true });
  };

  private onPointerMove = (e: PointerEvent): void => {
    let raw: number;

    switch (this.edge) {
      case DockEdge.Left:   raw = e.clientX - this.fixedEdge; break;
      case DockEdge.Right:  raw = this.fixedEdge - e.clientX; break;
      case DockEdge.Top:    raw = e.clientY - this.fixedEdge; break;
      case DockEdge.Bottom: raw = this.fixedEdge - e.clientY; break;
      default:              raw = 0;
    }

    this.pendingSize = raw < this.snapThreshold
      ? 0
      : Math.min(this.dynamicMax, Math.max(this.minSize, raw));

    if (this.rafId === 0) {
      this.rafId = requestAnimationFrame(this.flush);
    }
  };

  private flush = (): void => {
    this.rafId = 0;
    const detail: ResizerEventDetail = { edge: this.edge, size: this.pendingSize };
    this.element.dispatchEvent(new CustomEvent(ResizerEventType.Change, { detail, bubbles: true }));
  };

  private onPointerUp = (): void => {
    this.element.parentElement?.classList.remove('resizing');
    this.element.classList.remove('active');
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointercancel', this.onPointerUp);

    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  };
}
