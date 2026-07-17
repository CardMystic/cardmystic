import type { CardColorType } from '../models/cardModel';

export function cardColorToSymbol(color: CardColorType): string {
  switch (color) {
    case 'White':
      return 'w';
    case 'Blue':
      return 'u';
    case 'Black':
      return 'b';
    case 'Red':
      return 'r';
    case 'Green':
      return 'g';
    case 'Colorless':
      return 'c';
    default:
      return '';
  }
}
