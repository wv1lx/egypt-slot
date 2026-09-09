// src/main.ts

import { Application, Graphics, Text } from 'pixi.js';
import { GRID_CONFIG } from './types/symbols';
import { generateGrid } from './core/gridGenerator';
import { SpinButton } from './render/SpinButton';
import { SpinAnimationController } from './core/ReelAnimator';
import { ClusterEvaluator } from './core/ClusterEvaluator';
import { GridRenderer } from './render/GridRenderer';

// ============================================
// 1. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================
const app = new Application();

await app.init({
  width: 960,
  height: 720,
  backgroundColor: 0x0f0f1a,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

// ============================================
// 2. НАСТРОЙКИ
// ============================================
const { REELS, ROWS, CELL_WIDTH, CELL_HEIGHT, GAP, START_X, START_Y } = GRID_CONFIG;
const totalWidth = REELS * (CELL_WIDTH + GAP) - GAP;
const totalHeight = ROWS * (CELL_HEIGHT + GAP) - GAP;

// ============================================
// 3. РИСУЕМ РАМКУ
// ============================================
const border = new Graphics();
border.rect(START_X - 10, START_Y - 10, totalWidth + 20, totalHeight + 20);
border.stroke({ width: 5, color: 0xffd700 });
app.stage.addChild(border);

// ============================================
// 4. ЗАГОЛОВОК
// ============================================
const title = new Text({
  text: 'EGYPT SLOT - 6x4',
  style: {
    fontSize: 28,
    fill: 0xffd700,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  }
});
title.anchor.set(0.5, 0);
title.x = START_X + totalWidth / 2;
title.y = START_Y - 45;
app.stage.addChild(title);

// ============================================
// 5. СОЗДАЕМ РЕНДЕРЕР СЕТКИ
// ============================================
const gridRenderer = new GridRenderer(app.stage);

// ============================================
// 6. СОЗДАЕМ КОНТРОЛЛЕР АНИМАЦИИ
// ============================================
const animationController = new SpinAnimationController();
animationController.createReels(app, REELS);
animationController.addToStage(app.stage);

// ============================================
// 7. СОЗДАЕМ ОЦЕНЩИК КЛАСТЕРОВ
// ============================================
const clusterEvaluator = new ClusterEvaluator();

// ============================================
// 8. ТЕКУЩАЯ СЕТКА
// ============================================
let currentGrid = generateGrid();

// Отрисовываем начальную сетку
gridRenderer.render(currentGrid);

// ============================================
// 9. КНОПКА SPIN
// ============================================
let isSpinning = false;

const spinButton = new SpinButton(
  START_X + totalWidth / 2,
  START_Y + totalHeight + 40,
  async () => {
    if (isSpinning || animationController.isAnimating()) {
      console.log('⏳ Уже крутится!');
      return;
    }
    
    console.log('🎰 Начинаем спин!');
    isSpinning = true;
    
    // Генерируем новую сетку
    currentGrid = generateGrid();
    
    // Запускаем анимацию
    await animationController.spinAll(currentGrid);
    
    // ============================================
    // ОЦЕНИВАЕМ КЛАСТЕРЫ
    // ============================================
    const result = clusterEvaluator.evaluate(currentGrid);
    
    // ============================================
    // ПОДСВЕЧИВАЕМ ВЫИГРЫШНЫЕ КЛАСТЕРЫ
    // ============================================
    if (result.clusters.length > 0) {
      gridRenderer.highlightClusters(result.clusters);
    }
    
    console.log('🎯 Результат оценки:');
    console.log(`   Кластеров найдено: ${result.clusters.length}`);
    console.log(`   Scatter: ${result.scatterCount}`);
    console.log(`   Общая выплата: x${result.totalPayout}`);
    
    result.clusters.forEach((cluster, i) => {
      console.log(`   Кластер ${i + 1}: ${cluster.symbolId} x${cluster.size} = x${cluster.payout}`);
    });
    
    console.log('✅ Спин завершен!');
    isSpinning = false;
  }
);
app.stage.addChild(spinButton);

// ============================================
// 10. СТАТУС
// ============================================
const statusText = new Text({
  text: 'Нажми SPIN чтобы начать!',
  style: {
    fontSize: 16,
    fill: 0x94a3b8,
    fontFamily: 'Arial',
  }
});
statusText.anchor.set(0.5);
statusText.x = START_X + totalWidth / 2;
statusText.y = START_Y + totalHeight + 90;
app.stage.addChild(statusText);

console.log('✅ Слот с кластерными выплатами загружен!');