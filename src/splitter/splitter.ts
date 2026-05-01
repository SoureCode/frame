import type { SplitterEventDetail } from '../types/splitter-event-detail.js';
import { SplitterEventType } from '../types/splitter-event-type.js';
import { SplitterOrientation } from '../types/splitter-orientation.js';
import type { DockEdge } from '../types/dock-edge.js';
import { SPLITTER_MIN_SIZE } from '../layout/constants.js';
import './splitter.scss';

export class Splitter {
  public readonly element: HTMLElement;
  private containerRect: DOMRect | null = null;
  private minSizeA: number = SPLITTER_MIN_SIZE;
  private minSizeB: number = SPLITTER_MIN_SIZE;
  private pendingRatio: number = 0;
  private rafId: number = 0;

  constructor(
    private readonly edge: DockEdge,
    private readonly orientation: SplitterOrientation,
    private readonly minSize: number = SPLITTER_MIN_SIZE,
  ) {
    this.element = document.createElement('div');
    this.element.className = `frame-splitter ${orientation === SplitterOrientation.Column ? 'column' : 'row'}`;
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  public setVisible(visible: boolean): void {
    this.element.classList.toggle('hidden', !visible);
  }

  private measureSlotMin(slot: HTMLElement | null): number {
    if (!slot) {
      return this.minSize;
    }

    const panel = Array.from(slot.children).find(
      child => !child.classList.contains('hidden'),
    ) as HTMLElement | undefined;

    if (!panel) {
      return this.minSize;
    }

    const header = panel.firstElementChild as HTMLElement | null;
    if (!header) {
      return this.minSize;
    }

    if (this.orientation === SplitterOrientation.Column) {
      return Math.max(this.minSize, header.offsetHeight);
    }

    let fixedWidth = 0;
    for (const child of header.children) {
      const element = child as HTMLElement;
      if (parseFloat(getComputedStyle(element).flexGrow) === 0) {
        fixedWidth += element.offsetWidth;
      }
    }

    return Math.max(this.minSize, fixedWidth + 48);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) { return; }

    const parent = this.element.parentElement!;
    this.containerRect = parent.getBoundingClientRect();
    parent.classList.add('dragging');

    const prevSlot = this.element.previousElementSibling as HTMLElement | null;
    const nextSlot = this.element.nextElementSibling as HTMLElement | null;
    this.minSizeA = this.measureSlotMin(prevSlot);
    this.minSizeB = this.measureSlotMin(nextSlot);

    this.element.setPointerCapture(e.pointerId);
    this.element.classList.add('active');
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('pointerup', this.onPointerUp, { once: true });
    this.element.addEventListener('pointercancel', this.onPointerUp, { once: true });
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.containerRect!;
    const isColumn = this.orientation === SplitterOrientation.Column;
    const size = isColumn ? rect.height : rect.width;
    const pos = isColumn ? e.clientY - rect.top : e.clientX - rect.left;
    const clamped = Math.max(this.minSizeA, Math.min(size - this.minSizeB, pos));

    this.pendingRatio = clamped / size;

    if (this.rafId === 0) {
      this.rafId = requestAnimationFrame(this.flush);
    }
  };

  private flush = (): void => {
    this.rafId = 0;
    const detail: SplitterEventDetail = { edge: this.edge, ratio: this.pendingRatio };
    this.element.dispatchEvent(new CustomEvent(SplitterEventType.Change, { detail, bubbles: true }));
  };

  private onPointerUp = (): void => {
    this.element.parentElement?.classList.remove('dragging');
    this.element.classList.remove('active');
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointercancel', this.onPointerUp);

    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  };
}
