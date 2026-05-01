import type { Theme } from './theme.js';

export interface ThemeEventDetail {
  theme: Theme | string;
  previous: Theme | string;
}
