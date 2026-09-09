// src/render/SpinButton.ts

import { Container, Graphics, Text } from 'pixi.js';

export class SpinButton extends Container {
  private callback: () => void;
  private bg: Graphics;
  private text: Text;
  
  constructor(x: number, y: number, onClick: () => void) {
    super();
    this.callback = onClick;
    
    this.x = x;
    this.y = y;
    
    // Фон кнопки
    this.bg = new Graphics();
    this.bg.roundRect(-80, -25, 160, 50, 10);
    this.bg.fill({ color: 0xffd700 });
    this.addChild(this.bg);
    
    // Текст
    this.text = new Text({
      text: 'SPIN',
      style: {
        fontSize: 24,
        fill: 0x0f0f1a,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      }
    });
    this.text.anchor.set(0.5);
    this.addChild(this.text);
    
    // Делаем кликабельной
    this.eventMode = 'static';
    this.cursor = 'pointer';
    
    this.on('pointerdown', this.handleClick.bind(this));
  }
  
  private handleClick(): void {
    // Визуальный отклик
    this.scale.set(0.95);
    setTimeout(() => this.scale.set(1), 100);
    
    // Вызываем callback
    this.callback();
  }
  
  /**
   * Включает/выключает кнопку
   */
  setEnabled(enabled: boolean): void {
    this.eventMode = enabled ? 'static' : 'none';
    this.cursor = enabled ? 'pointer' : 'default';
    this.alpha = enabled ? 1 : 0.5;
  }
}