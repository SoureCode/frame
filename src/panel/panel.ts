import type { PanelConfig } from '../types/panel.js';
import type { PanelEventDetail } from '../types/panel-event-detail.js';
import { PanelEventType } from '../types/panel-event-type.js';
import { PIN_ICON, CLOSE_ICON } from './icons.js';
import './panel.scss';

export class Panel {
  readonly element: HTMLElement;
  readonly content: HTMLElement;
  private readonly pinBtn: HTMLElement;

  constructor(private readonly config: PanelConfig) {
    this.content = document.createElement('div');
    this.content.className = 'panel-content';
    if (config.content) {
      this.content.appendChild(config.content);
    }
    this.pinBtn = this.buildPinBtn();
    this.element = this.build();
  }

  setActive(active: boolean): void {
    this.element.classList.toggle('active', active);
  }

  setPinned(pinned: boolean): void {
    this.pinBtn.classList.toggle('pinned', pinned);
    this.pinBtn.setAttribute('aria-pressed', String(pinned));
  }

  private buildPinBtn(): HTMLElement {
    const pin = document.createElement('button');
    pin.className = 'panel-pin';
    pin.type = 'button';
    pin.setAttribute('aria-label', 'Pin panel');
    pin.setAttribute('aria-pressed', 'false');
    pin.innerHTML = PIN_ICON;
    pin.addEventListener('click', () => this.dispatch(PanelEventType.Pin));
    return pin;
  }

  private build(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel';

    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = this.config.title;

    const close = document.createElement('button');
    close.className = 'panel-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close panel');
    close.innerHTML = CLOSE_ICON;
    close.addEventListener('click', () => this.dispatch(PanelEventType.Close));

    header.appendChild(title);
    header.appendChild(this.pinBtn);
    header.appendChild(close);
    el.appendChild(header);
    el.appendChild(this.content);

    return el;
  }

  private dispatch(type: PanelEventType): void {
    const detail: PanelEventDetail = { panelId: this.config.id, slot: this.config.slot };
    this.element.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }
}
