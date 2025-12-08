import * as PIXI from 'pixi.js';
import { COLORS, LAYOUT } from '../config.js';
import { Tween } from '../utils/AnimationUtils.js';

export class StackFrame extends PIXI.Container {
  constructor(functionName, filename, lineno, args = null) {
    super();

    this.functionName = functionName;
    this.filename = filename;
    this.lineno = lineno;
    this.args = args;

    // Determine color based on function name
    const color = this._getFunctionColor(functionName);

    // Background rectangle with border
    this.bg = new PIXI.Graphics();
    this.bg.roundRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, 4); // Reduced radius
    this.bg.fill({ color: color });
    this.addChild(this.bg);

    // Function name + line number
    this.nameText = new PIXI.Text({
      text: `${functionName}:${lineno}`,
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 12,
        fill: 0xFFFFFF,
        fontWeight: '600',
      }
    });
    this.nameText.resolution = 2;
    this.nameText.position.set(8, LAYOUT.frameHeight / 2 - 8);
    this.addChild(this.nameText);

    // Set interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', this._onHover.bind(this));
    this.on('pointerout', this._onHoverOut.bind(this));
  }

  destroy(options) {
    Tween.killTweensOf(this);
    super.destroy(options);
  }

  // Update the line number displayed
  updateLine(lineno) {
    this.lineno = lineno;
    this.nameText.text = `${this.functionName}:${lineno}`;
  }

  setActive(isActive) {
    if (this.isActive === isActive) return;
    this.isActive = isActive;

    if (isActive) {
      // Highlight active frame with thicker border
      // Note: stroke() might not work if we didn't define a stroke in constructor.
      // In the simplified version we removed the stroke from constructor.
      // Let's just change alpha or add a simple border if needed.
      this.bg.alpha = 1.0;
    } else {
      // Reset to normal
      this.bg.alpha = 0.9;
    }
  }

  _getFunctionColor(funcName) {
    // Map function names to colors
    if (funcName === 'main') return COLORS.funcMain;
    if (funcName === 'fibonacci') return COLORS.funcFibonacci;
    if (funcName === 'add') return 0xE36209;      // Orange
    if (funcName === 'multiply') return 0x6F42C1; // Purple
    if (funcName === 'calculate') return COLORS.funcFibonacci;
    return COLORS.info;
  }

  _onHover() {
    this.bg.alpha = 0.8;
  }

  _onHoverOut() {
    this.bg.alpha = 1;
  }

  highlight(active) {
    // No-op for simplified version
  }

  animateIn(targetY, duration = 300) {
    this.position.set(0, targetY + 50);
    this.alpha = 0;

    Tween.to(this, {
      position: { y: targetY },
      alpha: 1
    }, duration, 'easeOutCubic');
  }

  animateOut(duration = 200, onComplete = null) {
    Tween.to(this, {
      position: { y: this.position.y + 30 },
      alpha: 0
    }, duration, 'easeInQuad', () => {
      this.destroy();
      if (onComplete) onComplete();
    });
  }

  // Flash effect for sampling profiler
  flash(duration = 150) {
    const flashOverlay = new PIXI.Graphics();
    flashOverlay.roundRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    flashOverlay.fill({ color: 0xFFFFFF, alpha: 0.4 });
    this.addChild(flashOverlay);

    Tween.to(flashOverlay, { alpha: 0 }, duration, 'easeOutQuad', () => {
      flashOverlay.destroy();
    });
  }
}
