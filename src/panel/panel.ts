import type { PanelConfig } from '../types/panel.js';
import type { PanelEventDetail } from '../types/panel-event-detail.js';
import { PanelEventType } from '../types/panel-event-type.js';
import { PIN_ICON, CLOSE_ICON, FULLSCREEN_ICON, FULLSCREEN_EXIT_ICON } from './icons.js';
import './panel.scss';

export class Panel {
  public readonly element: HTMLElement;
  public readonly content: HTMLElement;
  private readonly pinButton: HTMLElement;
  private readonly fullscreenButton: HTMLElement | null;
  private fullscreen = false;

  constructor(private readonly config: PanelConfig) {
    this.content = document.createElement('div');
    this.content.className = 'panel-content';
    if (config.content) {
      this.content.appendChild(config.content);
    }
    this.pinButton = this.buildPinButton();
    this.fullscreenButton = config.fullscreenable !== false ? this.buildFullscreenButton() : null;
    this.element = this.build();
  }

  public setActive(active: boolean): void {
    this.element.classList.toggle('active', active);
  }

  public setPinned(pinned: boolean): void {
    this.pinButton.classList.toggle('pinned', pinned);
    this.pinButton.setAttribute('aria-pressed', String(pinned));
  }

  public isFullscreen(): boolean {
    return this.fullscreen;
  }

  public setFullscreen(active: boolean): void {
    this.fullscreen = active;
    this.element.classList.toggle('panel-fullscreen', active);
    if (this.fullscreenButton) {
      this.fullscreenButton.innerHTML = active ? FULLSCREEN_EXIT_ICON : FULLSCREEN_ICON;
      this.fullscreenButton.setAttribute('aria-pressed', String(active));
      this.fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Fullscreen panel');
    }
  }

  public toggleFullscreen(): void {
    this.dispatch(PanelEventType.Fullscreen);
  }

  private buildPinButton(): HTMLElement {
    const pin = document.createElement('button');
    pin.className = 'panel-pin';
    pin.type = 'button';
    pin.setAttribute('aria-label', 'Pin panel');
    pin.setAttribute('aria-pressed', 'false');
    pin.innerHTML = PIN_ICON;
    pin.addEventListener('click', () => this.dispatch(PanelEventType.Pin));
    return pin;
  }

  private buildFullscreenButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'panel-fullscreen-btn';
    button.type = 'button';
    button.setAttribute('aria-label', 'Fullscreen panel');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = FULLSCREEN_ICON;
    button.addEventListener('click', () => this.dispatch(PanelEventType.Fullscreen));
    return button;
  }

  private build(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = this.config.title;

    const closeButton = document.createElement('button');
    closeButton.className = 'panel-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close panel');
    closeButton.innerHTML = CLOSE_ICON;
    closeButton.addEventListener('click', () => this.dispatch(PanelEventType.Close));

    header.appendChild(title);
    if (this.fullscreenButton) {
      header.appendChild(this.fullscreenButton);
    }
    header.appendChild(this.pinButton);
    header.appendChild(closeButton);
    panel.appendChild(header);
    panel.appendChild(this.content);

    return panel;
  }

  private dispatch(type: PanelEventType): void {
    const detail: PanelEventDetail = { panelId: this.config.id, slot: this.config.slot };
    this.element.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }
}
