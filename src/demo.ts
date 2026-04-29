import { FrameLayout } from './layout/frame-layout.js';
import { LocalStorageAdapter } from './storage/local-storage-adapter.js';
import type { PanelConfig } from './types/panel.js';
import { SlotName } from './types/slot-name.js';
import folderIcon from 'bootstrap-icons/icons/folder2-open.svg?raw';
import gitIcon from 'bootstrap-icons/icons/git.svg?raw';
import bugIcon from 'bootstrap-icons/icons/bug.svg?raw';
import outlineIcon from 'bootstrap-icons/icons/list-nested.svg?raw';
import searchIcon from 'bootstrap-icons/icons/search.svg?raw';
import terminalIcon from 'bootstrap-icons/icons/terminal.svg?raw';
import problemsIcon from 'bootstrap-icons/icons/exclamation-triangle.svg?raw';
import './demo.scss';

function makeEventTestContent(): HTMLElement {
  const el = document.createElement('div');

  let clicks = 0;
  const counter = document.createElement('p');
  counter.textContent = 'Clicks: 0';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Click me';
  btn.addEventListener('click', () => {
    clicks++;
    counter.textContent = `Clicks: ${clicks}`;
  });

  const echo = document.createElement('p');
  echo.textContent = 'Input: —';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type here…';
  input.addEventListener('input', () => {
    echo.textContent = `Input: ${input.value || '—'}`;
  });

  el.appendChild(counter);
  el.appendChild(btn);
  el.appendChild(echo);
  el.appendChild(input);
  return el;
}

function makeTextContent(text: string): HTMLElement {
  const el = document.createElement('p');
  el.textContent = text;
  return el;
}

const panels: PanelConfig[] = [
  { id: 'explorer', title: 'Explorer',       slot: SlotName.LeftTop,     pinned: true,  icon: folderIcon,    content: makeEventTestContent() },
  { id: 'git',      title: 'Source Control', slot: SlotName.LeftTop,     pinned: true,  icon: gitIcon,       content: makeTextContent('Git content') },
  { id: 'debug',    title: 'Debug',          slot: SlotName.LeftBottom,  pinned: true,  icon: bugIcon,       content: makeTextContent('Debug content') },
  { id: 'outline',  title: 'Outline',        slot: SlotName.RightTop,    pinned: false, icon: outlineIcon,   content: makeTextContent('Outline content') },
  { id: 'search',   title: 'Search',         slot: SlotName.TopLeft,     pinned: true,  icon: searchIcon,    content: makeTextContent('Search content') },
  { id: 'terminal', title: 'Terminal',       slot: SlotName.BottomLeft,  pinned: true,  icon: terminalIcon,  content: makeTextContent('Terminal content') },
  { id: 'problems', title: 'Problems',       slot: SlotName.BottomRight, pinned: true,  icon: problemsIcon,  content: makeTextContent('Problems content') },
];

const mount = document.getElementById('app')!;
const layout = new FrameLayout(mount, panels, {
  animated: true,
  transition: { duration: '0.2s', easing: 'ease' },
  storage: new LocalStorageAdapter('frame-demo'),
});

const themes = ['', 'light', 'solarized', 'rose', 'paper', 'high-contrast', 'warm', 'nord', 'terminal', 'dracula', 'monokai', 'glass-dark', 'glass-light', 'catppuccin', 'gruvbox', 'tokyo-night', 'synthwave', 'everforest', 'sepia', 'github-light', 'github-dark', 'github-dimmed', 'ayu', 'mint', 'lavender', 'sky', 'sand'];
const themeLabels: Record<string, string> = {
  '': 'obsidian', 'light': 'light', 'solarized': 'solarized', 'rose': 'rose',
  'paper': 'paper', 'high-contrast': 'high-contrast', 'warm': 'warm',
  'nord': 'nord', 'terminal': 'terminal', 'dracula': 'dracula',
  'monokai': 'monokai', 'glass-dark': 'glass-dark', 'glass-light': 'glass-light',
  'catppuccin': 'catppuccin', 'gruvbox': 'gruvbox', 'tokyo-night': 'tokyo-night',
  'synthwave': 'synthwave', 'everforest': 'everforest', 'sepia': 'sepia',
  'github-light': 'github-light', 'github-dark': 'github-dark', 'github-dimmed': 'github-dimmed',
  'ayu': 'ayu', 'mint': 'mint', 'lavender': 'lavender', 'sky': 'sky', 'sand': 'sand',
};

const themeBadge = document.createElement('div');
themeBadge.className = 'demo-theme-badge';
themeBadge.textContent = 'obsidian';
layout.element.querySelector('.frame-stage')!.appendChild(themeBadge);

let themeIndex = 0;
let debugMode = false;
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) { return; }
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) { return; }
  if (e.key === 'w') { layout.setWidescreen(!layout.getState().widescreen); }
  if (e.key === 'a') { layout.setAnimated(!layout.getState().animated); }
  if (e.key === 'd') { debugMode = !debugMode; mount.classList.toggle('debug', debugMode); }
  if (e.key === 't') {
    themeIndex = (themeIndex + 1) % themes.length;
    const theme = themes[themeIndex];
    layout.element.dataset['theme'] = theme;
    themeBadge.textContent = themeLabels[theme];
  }
});
