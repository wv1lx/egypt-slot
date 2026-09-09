// src/render/GridRenderer.ts

import { Container, Graphics, Text } from 'pixi.js';
import type { SymbolConfig } from '../types/symbols';
import { GRID_CONFIG } from '../types/symbols';

export class GridRenderer {
  private container: Container;
  private symbolTexts: Text[][];
  private cellBackgrounds: Graphics[][]; // <-- ИСПРАВЛЕНО: теперь двумерный массив
  
  constructor(stage: Container) {
    this.container = new Container();
    stage.addChild(this.container);
    this.symbolTexts = [];
    this.cellBackgrounds = []; // <-- ИСПРАВЛЕНО
    
    this.createGrid();
  }
  
  /**
   * Создает визуальную сетку ячеек
   */
  private createGrid(): void {
    const { REELS, ROWS, CELL_WIDTH, CELL_HEIGHT, GAP, START_X, START_Y } = GRID_CONFIG;
    
    for (let reel = 0; reel < REELS; reel++) {
      this.symbolTexts[reel] = [];
      this.cellBackgrounds[reel] = []; // <-- ИСПРАВЛЕНО: инициализируем вложенный массив
      
      for (let row = 0; row < ROWS; row++) {
        const x = START_X + reel * (CELL_WIDTH + GAP);
        const y = START_Y + row * (CELL_HEIGHT + GAP);
        
        // Рисуем ячейку
        const cell = new Graphics();
        cell.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
        cell.fill({ color: 0x1a1a3e });
        cell.stroke({ width: 2, color: 0x3a3a6e });
        this.container.addChild(cell);
        this.cellBackgrounds[reel][row] = cell;
        
        // Создаем текстовый объект для символа
        const symbolText = new Text({
          text: '',
          style: {
            fontSize: 60,
          }
        });
        symbolText.anchor.set(0.5);
        symbolText.x = x + CELL_WIDTH / 2;
        symbolText.y = y + CELL_HEIGHT / 2;
        this.container.addChild(symbolText);
        
        this.symbolTexts[reel][row] = symbolText;
      }
    }
  }
  
  /**
   * Отрисовывает сетку с данными
   */
  render(grid: SymbolConfig[][]): void {
    const { REELS, ROWS } = GRID_CONFIG;
    
    for (let reel = 0; reel < REELS; reel++) {
      for (let row = 0; row < ROWS; row++) {
        const symbol = grid[reel][row];
        this.symbolTexts[reel][row].text = symbol.emoji;
        
        // Эффект появления (увеличение)
        this.symbolTexts[reel][row].scale.set(0);
        this.animateSymbolAppear(reel, row);
      }
    }
  }
  
  /**
   * Анимация появления символа
   */
  private animateSymbolAppear(reel: number, row: number): void {
    const symbol = this.symbolTexts[reel][row];
    let scale = 0;
    const targetScale = 1;
    const speed = 0.15;
    
    const animate = () => {
      scale += (targetScale - scale) * speed;
      symbol.scale.set(scale);
      
      if (scale < 0.99) {
        requestAnimationFrame(animate);
      }
    };
    
    // Задержка для каждого барабана
    setTimeout(() => {
      animate();
    }, reel * 100);
  }
  
  /**
   * Применяет эффект размытия к барабану
   */
  setReelBlur(reelIndex: number, blur: boolean): void {
    const { ROWS } = GRID_CONFIG;
    
    for (let row = 0; row < ROWS; row++) {
      const symbol = this.symbolTexts[reelIndex][row];
      if (blur) {
        symbol.alpha = 0.5;
      } else {
        symbol.alpha = 1;
      }
    }
  }
  
  /**
   * Очищает сетку
   */
  clear(): void {
    const { REELS, ROWS } = GRID_CONFIG;
    
    for (let reel = 0; reel < REELS; reel++) {
      for (let row = 0; row < ROWS; row++) {
        this.symbolTexts[reel][row].text = '';
      }
    }
  }
  
  /**
   * Подсвечивает выигрышные символы
   */
  highlightSymbols(positions: { reel: number; row: number }[]): void {
    positions.forEach(({ reel, row }) => {
      const cell = this.cellBackgrounds[reel][row];
      cell.fill({ color: 0x3a3a1e });
      cell.stroke({ width: 3, color: 0xffd700 });
    });
  }
  
  /**
   * Сбрасывает подсветку
   */
  resetHighlight(): void {
    const { REELS, ROWS } = GRID_CONFIG;
    
    for (let reel = 0; reel < REELS; reel++) {
      for (let row = 0; row < ROWS; row++) {
        const cell = this.cellBackgrounds[reel][row];
        cell.fill({ color: 0x1a1a3e });
        cell.stroke({ width: 2, color: 0x3a3a6e });
      }
    }
  }
}