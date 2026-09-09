// src/core/ReelAnimator.ts

import { Application, Container, Text, Graphics } from 'pixi.js';
import type { SymbolConfig } from '../types/symbols';
import { SYMBOLS, GRID_CONFIG } from '../types/symbols';

/**
 * Класс одного барабана.
 * Барабан крутится ВНИЗ и плавно останавливается без отскока.
 */
export class Reel {
  private container: Container;
  private app: Application;
  private isSpinning: boolean = false;
  
  // Лента символов (данные)
  private strip: SymbolConfig[] = [];
  
  // Визуальные объекты
  private cellSprites: Graphics[] = [];
  private symbolSprites: Text[] = [];
  
  // Текущая позиция прокрутки (в пикселях)
  private currentOffset: number = 0;
  
  // Целевая позиция прокрутки
  private targetOffset: number = 0;
  
  // Текущая скорость
  private currentSpeed: number = 0;
  
  // Целевая скорость (для плавного изменения)
  private targetSpeed: number = 0;
  
  // Текущие видимые символы
  private currentSymbols: SymbolConfig[] = [];
  
  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
  }
  
  /**
   * Инициализирует барабан
   */
  initialize(startX: number, startY: number): void {
    const { CELL_WIDTH, CELL_HEIGHT, GAP, ROWS } = GRID_CONFIG;
    
    this.container.x = startX;
    this.container.y = startY;
    
    // Создаем маску для обрезки
    const mask = new Graphics();
    const maskHeight = ROWS * (CELL_HEIGHT + GAP) - GAP;
    mask.rect(0, 0, CELL_WIDTH, maskHeight);
    mask.fill({ color: 0xffffff });
    this.container.addChild(mask);
    this.container.mask = mask;
    
    // Создаем начальные символы и их ячейки
    for (let i = 0; i < ROWS; i++) {
      const symbol = this.getRandomSymbol();
      this.currentSymbols.push(symbol);
      
      // Создаем фон ячейки
      const cellBg = this.createCellBackground();
      cellBg.x = 0;
      cellBg.y = i * (CELL_HEIGHT + GAP);
      this.cellSprites.push(cellBg);
      this.container.addChild(cellBg);
      
      // Создаем текст символа
      const sprite = this.createSymbolText(symbol.emoji);
      sprite.x = CELL_WIDTH / 2;
      sprite.y = i * (CELL_HEIGHT + GAP) + CELL_HEIGHT / 2;
      this.symbolSprites.push(sprite);
      this.container.addChild(sprite);
    }
  }
  
  /**
   * Создает фон ячейки
   */
  private createCellBackground(): Graphics {
    const { CELL_WIDTH, CELL_HEIGHT } = GRID_CONFIG;
    const cell = new Graphics();
    cell.rect(0, 0, CELL_WIDTH, CELL_HEIGHT);
    cell.fill({ color: 0x1a1a3e });
    cell.stroke({ width: 2, color: 0x3a3a6e });
    return cell;
  }
  
  /**
   * Создает текстовый объект символа
   */
  private createSymbolText(emoji: string): Text {
    const symbol = new Text({
      text: emoji,
      style: { fontSize: 60 }
    });
    symbol.anchor.set(0.5);
    return symbol;
  }
  
  /**
   * Выбирает случайный символ
   */
  private getRandomSymbol(): SymbolConfig {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const symbol of SYMBOLS) {
      random -= symbol.weight;
      if (random <= 0) return symbol;
    }
    
    return SYMBOLS[0];
  }
  
  /**
   * Генерирует ленту символов
   */
  private generateStrip(targetSymbols: SymbolConfig[]): void {
    const SPIN_LENGTH = 20;
    
    this.strip = [];
    
    // Текущие символы
    for (const symbol of this.currentSymbols) {
      this.strip.push(symbol);
    }
    
    // Случайные символы
    for (let i = 0; i < SPIN_LENGTH; i++) {
      this.strip.push(this.getRandomSymbol());
    }
    
    // Целевые символы
    for (const symbol of targetSymbols) {
      this.strip.push(symbol);
    }
  }
  
        /**
     * Запускает анимацию вращения.
     * Символы физически докатываются до своих позиций — никакой генерации в конце!
     */
    spin(targetSymbols: SymbolConfig[], duration: number): Promise<void> {
    return new Promise((resolve) => {
        this.isSpinning = true;
        
        const { CELL_HEIGHT, GAP, ROWS } = GRID_CONFIG;
        const cellTotalHeight = CELL_HEIGHT + GAP;
        
        // Генерируем ленту: текущие + случайные + целевые
        this.generateStrip(targetSymbols);
        
        // Рассчитываем целевую позицию.
        // Целевые символы находятся в КОНЦЕ ленты (последние ROWS штук).
        // Мы хотим, чтобы барабан остановился ровно на них.
        // Для этого startIndex должен быть равен (strip.length - ROWS)
        const finalStartIndex = this.strip.length - ROWS;
        this.targetOffset = finalStartIndex * cellTotalHeight;
        
        // Сбрасываем позицию
        this.currentOffset = 0;
        
        // Параметры физики
        const MAX_SPEED = 60;
        const MIN_SPEED = 3;
        const DECELERATION_DISTANCE = 30 * cellTotalHeight;
        
        const startTime = Date.now();
        
        const animate = () => {
        if (!this.isSpinning) {
            this.app.ticker.remove(animate);
            resolve();
            return;
        }
        
        const elapsed = Date.now() - startTime;
        
        // Оставшееся расстояние до цели
        const remainingDistance = this.targetOffset - this.currentOffset;
        
        // Рассчитываем целевую скорость на основе оставшегося расстояния
        let targetSpeed: number;
        
        if (remainingDistance > DECELERATION_DISTANCE) {
            // Далеко от цели — полная скорость
            targetSpeed = MAX_SPEED;
        } else {
            // Близко к цели — плавное замедление
            const progress = remainingDistance / DECELERATION_DISTANCE;
            targetSpeed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.sqrt(progress);
        }
        
        // Плавная интерполяция текущей скорости к целевой
        this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.15;
        
        // Ограничиваем скорость, чтобы не перескочить цель
        const maxAllowedSpeed = Math.max(MIN_SPEED, remainingDistance);
        if (this.currentSpeed > maxAllowedSpeed) {
            this.currentSpeed = maxAllowedSpeed;
        }
        
        // Двигаем ленту
        this.currentOffset += this.currentSpeed;
        
        // Проверяем, достигли ли цели
        if (this.currentOffset >= this.targetOffset) {
            this.currentOffset = this.targetOffset;
            this.isSpinning = false;
            
            // Сохраняем финальные символы (те, что сейчас видны)
            this.currentSymbols = [...targetSymbols];
        }
        
        // Обновляем видимые символы (это происходит КАЖДЫЙ кадр, включая последний)
        this.updateVisibleSymbols();
        };
        
        this.app.ticker.add(animate);
    });
    }
  
  /**
   * Обновляет видимые символы и их ячейки
   * Барабан крутится ВНИЗ: символы появляются сверху и движутся вниз
   */
  private updateVisibleSymbols(): void {
    const { CELL_HEIGHT, GAP, ROWS, CELL_WIDTH } = GRID_CONFIG;
    const cellTotalHeight = CELL_HEIGHT + GAP;
    
    // Вычисляем, какие символы ленты сейчас видны
    const startIndex = Math.floor(this.currentOffset / cellTotalHeight);
    const offsetInCell = this.currentOffset % cellTotalHeight;
    
    // Обновляем каждый видимый спрайт и его ячейку
    for (let i = 0; i < ROWS; i++) {
      const stripIndex = startIndex + i;
      
      if (stripIndex >= 0 && stripIndex < this.strip.length) {
        // Обновляем текст символа
        this.symbolSprites[i].text = this.strip[stripIndex].emoji;
        
        // Двигаем ВНИЗ: символы появляются сверху и движутся вниз
        const yPos = i * cellTotalHeight + offsetInCell;
        this.symbolSprites[i].y = yPos + CELL_HEIGHT / 2;
        this.cellSprites[i].y = yPos;
      }
    }
  }
  
  /**
   * Добавляет барабан на сцену
   */
  addToStage(stage: Container): void {
    stage.addChild(this.container);
  }
  
  /**
   * Проверяет, крутится ли барабан
   */
  isAnimating(): boolean {
    return this.isSpinning;
  }
}

/**
 * Контроллер всех барабанов
 */
export class SpinAnimationController {
  private reels: Reel[] = [];
  private isSpinning: boolean = false;
  
  /**
   * Создает барабаны
   */
  createReels(app: Application, reelCount: number): void {
    const { START_X, CELL_WIDTH, GAP, START_Y } = GRID_CONFIG;
    
    for (let i = 0; i < reelCount; i++) {
      const reelX = START_X + i * (CELL_WIDTH + GAP);
      const reel = new Reel(app);
      reel.initialize(reelX, START_Y);
      this.reels.push(reel);
    }
  }
  
  /**
   * Добавляет все барабаны на сцену
   */
  addToStage(stage: Container): void {
    this.reels.forEach((reel) => reel.addToStage(stage));
  }
  
  /**
   * Запускает анимацию всех барабанов
   */
  async spinAll(grids: SymbolConfig[][]): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;
    
    console.log('🎬 Начинаем вращение...');
    
    const promises = this.reels.map((reel, index) => {
      const duration = 2000 + index * 400;
      return reel.spin(grids[index], duration);
    });
    
    await Promise.all(promises);
    
    console.log('✅ Вращение завершено!');
    this.isSpinning = false;
  }
  
  /**
   * Проверяет, идет ли анимация
   */
  isAnimating(): boolean {
    return this.isSpinning;
  }
}