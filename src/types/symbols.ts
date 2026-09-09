// src/types/symbols.ts

/**
 * Типы египетских символов для слота
 */
export interface SymbolConfig {
  id: string;        // Уникальный идентификатор
  emoji: string;     // Эмодзи для отображения (пока вместо графики)
  weight: number;    // Вес (чем больше, тем чаще выпадает)
  color: number;     // Цвет для будущей графики (в формате 0xRRGGBB)
}

/**
 * Полный набор символов для египетского слота
 */
export const SYMBOLS: SymbolConfig[] = [
  { id: 'scarab',   emoji: '🪲', weight: 10, color: 0x22c55e }, // Скарабей - частый
  { id: 'ankh',     emoji: '☥',  weight: 10, color: 0x3b82f6 }, // Анх
  { id: 'eye',      emoji: '👁️', weight: 8,  color: 0x8b5cf6 }, // Глаз Гора
  { id: 'snake',    emoji: '🐍', weight: 8,  color: 0x10b981 }, // Змея
  { id: 'vase',     emoji: '🏺', weight: 6,  color: 0xf59e0b }, // Ваза
  { id: 'pyramid',  emoji: '🔺', weight: 6,  color: 0xd97706 }, // Пирамида (исправили!)
  { id: 'pharaoh',  emoji: '👑', weight: 4,  color: 0xfbbf24 }, // Фараон - редкий
  { id: 'wild',     emoji: '🌟', weight: 2,  color: 0xfcd34d }, // Wild - очень редкий
  { id: 'scatter',  emoji: '🔱', weight: 2,  color: 0xef4444 }, // Scatter - очень редкий
];

/**
 * Настройки сетки
 */
export const GRID_CONFIG = {
  REELS: 6,          // Количество барабанов
  ROWS: 4,           // Количество рядов
  CELL_WIDTH: 100,   // Ширина ячейки
  CELL_HEIGHT: 120,  // Высота ячейки
  GAP: 10,           // Отступ между ячейками
  START_X: 80,       // Отступ слева
  START_Y: 60,       // Отступ сверху
} as const;