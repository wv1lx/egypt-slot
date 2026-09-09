// src/core/ClusterEvaluator.ts

import type { SymbolConfig } from '../types/symbols';
import { GRID_CONFIG } from '../types/symbols';

/**
 * Позиция ячейки на поле
 */
export interface CellPosition {
  reel: number;
  row: number;
}

/**
 * Информация о найденном кластере
 */
export interface Cluster {
  symbolId: string;           // ID символа (или 'wild' если кластер из wild)
  cells: CellPosition[];      // Позиции всех ячеек кластера
  size: number;               // Размер кластера
  payout: number;             // Выплата (множитель ставки)
}

/**
 * Результат оценки всего поля
 */
export interface EvaluationResult {
  clusters: Cluster[];        // Все найденные кластеры
  totalPayout: number;        // Суммарная выплата
  scatterCount: number;       // Количество scatter символов
  scatterPayout: number;      // Выплата за scatter
}

/**
 * Таблица выплат для символов
 * Ключ: размер кластера, Значение: множитель ставки
 */
const PAYOUT_TABLE: Record<string, Record<number, number>> = {
  scarab:   { 3: 0.5, 4: 1, 5: 2, 6: 5, 7: 10, 8: 20, 9: 50 },
  ankh:     { 3: 0.5, 4: 1, 5: 2, 6: 5, 7: 10, 8: 20, 9: 50 },
  eye:      { 3: 1, 4: 2, 5: 5, 6: 10, 7: 25, 8: 50, 9: 100 },
  snake:    { 3: 1, 4: 2, 5: 5, 6: 10, 7: 25, 8: 50, 9: 100 },
  vase:     { 3: 2, 4: 5, 5: 10, 6: 25, 7: 50, 8: 100, 9: 250 },
  pyramid:  { 3: 2, 4: 5, 5: 10, 6: 25, 7: 50, 8: 100, 9: 250 },
  pharaoh:  { 3: 5, 4: 10, 5: 25, 6: 50, 7: 100, 8: 250, 9: 500 },
  wild:     { 3: 10, 4: 25, 5: 50, 6: 100, 7: 250, 8: 500, 9: 1000 },
};

/**
 * Выплаты за Scatter (независимо от позиций)
 */
const SCATTER_PAYOUTS: Record<number, number> = {
  3: 2,
  4: 10,
  5: 50,
  6: 200,
};

/**
 * Минимальный размер кластера для выплаты
 */
const MIN_CLUSTER_SIZE = 3;

/**
 * Класс оценки кластерных выплат
 * Использует алгоритм Flood Fill (BFS) для поиска групп соседних символов
 */
export class ClusterEvaluator {
  /**
   * Оценивает поле и находит все выигрышные кластеры
   */
  evaluate(grid: SymbolConfig[][]): EvaluationResult {
    const { REELS, ROWS } = GRID_CONFIG;
    const clusters: Cluster[] = [];
    
    // Массив для отслеживания посещённых ячеек
    const visited: boolean[][] = Array.from({ length: REELS }, () =>
      Array(ROWS).fill(false)
    );
    
    // Проходим по каждой ячейке поля
    for (let reel = 0; reel < REELS; reel++) {
      for (let row = 0; row < ROWS; row++) {
        // Если ячейка уже посещена — пропускаем
        if (visited[reel][row]) continue;
        
        const symbol = grid[reel][row];
        
        // Scatter не участвует в кластерах — пропускаем
        if (symbol.id === 'scatter') continue;
        
        // Ищем кластер для этого символа (с учётом Wild)
        const cluster = this.findCluster(grid, visited, reel, row, symbol.id);
        
        // Если кластер достаточно большой — добавляем в результат
        if (cluster.size >= MIN_CLUSTER_SIZE) {
          const payout = this.calculatePayout(cluster.symbolId, cluster.size);
          clusters.push({
            ...cluster,
            payout,
          });
        }
      }
    }
    
    // Считаем scatter
    const scatterCount = this.countScatters(grid);
    const scatterPayout = SCATTER_PAYOUTS[scatterCount] || 0;
    
    // Суммарная выплата
    const totalPayout = clusters.reduce((sum, c) => sum + c.payout, 0) + scatterPayout;
    
    return {
      clusters,
      totalPayout,
      scatterCount,
      scatterPayout,
    };
  }
  
  /**
   * Ищет кластер символов начиная с позиции (reel, row)
   * Использует BFS (поиск в ширину)
   * Wild считается совпадающим с любым символом
   */
  private findCluster(
    grid: SymbolConfig[][],
    visited: boolean[][],
    startReel: number,
    startRow: number,
    baseSymbolId: string
  ): { symbolId: string; cells: CellPosition[]; size: number } {
    const { REELS, ROWS } = GRID_CONFIG;
    const cells: CellPosition[] = [];
    
    // Очередь для BFS
    const queue: CellPosition[] = [{ reel: startReel, row: startRow }];
    visited[startReel][startRow] = true;
    
    // Определяем, какой символ "главный" в кластере
    // Если стартовая ячейка — Wild, то главный символ определится по первому не-Wild
    let clusterSymbolId = baseSymbolId;
    let hasNonWild = baseSymbolId !== 'wild';
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      cells.push(current);
      
      const currentSymbol = grid[current.reel][current.row];
      
      // Если это не Wild и мы ещё не определили главный символ — запоминаем
      if (currentSymbol.id !== 'wild' && !hasNonWild) {
        clusterSymbolId = currentSymbol.id;
        hasNonWild = true;
      }
      
      // Проверяем 4 соседних ячейки (вверх, вниз, влево, вправо)
      const neighbors = [
        { reel: current.reel - 1, row: current.row },
        { reel: current.reel + 1, row: current.row },
        { reel: current.reel, row: current.row - 1 },
        { reel: current.reel, row: current.row + 1 },
      ];
      
      for (const neighbor of neighbors) {
        // Проверяем границы поля
        if (neighbor.reel < 0 || neighbor.reel >= REELS) continue;
        if (neighbor.row < 0 || neighbor.row >= ROWS) continue;
        
        // Если уже посещали — пропускаем
        if (visited[neighbor.reel][neighbor.row]) continue;
        
        const neighborSymbol = grid[neighbor.reel][neighbor.row];
        
        // Проверяем совпадение:
        // - Сосед такой же как baseSymbolId
        // - ИЛИ сосед — Wild (он заменяет любой)
        // - ИЛИ baseSymbolId — Wild (тогда любой символ подходит)
        const matches =
          neighborSymbol.id === clusterSymbolId ||
          neighborSymbol.id === 'wild' ||
          baseSymbolId === 'wild';
        
        if (matches) {
          visited[neighbor.reel][neighbor.row] = true;
          queue.push(neighbor);
        }
      }
    }
    
    return {
      symbolId: clusterSymbolId,
      cells,
      size: cells.length,
    };
  }
  
  /**
   * Рассчитывает выплату для кластера
   */
  private calculatePayout(symbolId: string, size: number): number {
    const table = PAYOUT_TABLE[symbolId];
    if (!table) return 0;
    
    // Находим ближайший размер в таблице (если точного нет)
    let payout = 0;
    for (const [clusterSize, multiplier] of Object.entries(table)) {
      const cs = parseInt(clusterSize);
      if (size >= cs) {
        payout = Math.max(payout, multiplier);
      }
    }
    
    return payout;
  }
  
  /**
   * Считает количество Scatter на поле
   */
  private countScatters(grid: SymbolConfig[][]): number {
    let count = 0;
    for (const reel of grid) {
      for (const symbol of reel) {
        if (symbol.id === 'scatter') count++;
      }
    }
    return count;
  }
}