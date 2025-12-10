import * as PIXI from 'pixi.js';
import { COLORS, LAYOUT } from '../config.js';
import { Tween } from '../utils/AnimationUtils.js';

export class FlyingStackFrame extends PIXI.Container {
  constructor(functionName, color) {
    super();

    // Background matching StackFrame appearance
    this.bg = new PIXI.Graphics();
    this.bg.roundRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, 4);
    this.bg.fill({ color: color });
    this.addChild(this.bg);

    // Function name text
    this.label = new PIXI.Text({
      text: functionName,
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 12,
        fill: 0xFFFFFF,
        fontWeight: '600',
      }
    });
    this.label.resolution = 2;
    this.label.position.set(8, LAYOUT.frameHeight / 2 - 8);
    this.addChild(this.label);
  }

  destroy(options) {
    Tween.killTweensOf(this);
    // Kill tweens on the tracker object too
    if (this._pathTracker) {
      Tween.killTweensOf(this._pathTracker);
    }
    // Clean up path tracking references
    this._path = null;
    this._pathTracker = null;
    this._updatePathPosition = null;
    // Ensure removal from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }
    super.destroy(options);
  }
}
