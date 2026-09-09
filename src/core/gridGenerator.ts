// src/core/gridGenerator.ts

import type { SymbolConfig } from '../types/symbols';
import { SYMBOLS, GRID_CONFIG } from '../types/symbols';

/**
 * Выбирает случайный символ с учетом весов (weighted random)
 * Чем больше weight у символа, тем выше шанс его выпадения
 */
export function getRandomSymbol(): SymbolConfig {
  // Считаем общий вес всех символов
  const totalWeight = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
  
  // Генерируем случайное число от 0 до totalWeight
  let random = Math.random() * totalWeight;
  
  // Идем по списку символов и вычитаем их вес
  for (const symbol of SYMBOLS) {
    random -= symbol.weight;
    if (random <= 0) {
      return symbol;
    }
  }
  
  // Возвращаем первый символ (на всякий случай)
  return SYMBOLS[0];
}

/**
 * Генерирует полную сетку 6x4
 * Возвращает двумерный массив: grid[reel][row]
 */
export function generateGrid(): SymbolConfig[][] {
  const { REELS, ROWS } = GRID_CONFIG;
  const grid: SymbolConfig[][] = [];
  
  for (let reel = 0; reel < REELS; reel++) {
    const reelSymbols: SymbolConfig[] = [];
    for (let row = 0; row < ROWS; row++) {
      reelSymbols.push(getRandomSymbol());
    }
    grid.push(reelSymbols);
  }
  
  return grid;
}