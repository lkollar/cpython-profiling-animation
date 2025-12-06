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

    // Drop shadow for depth
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.1);
    shadow.drawRoundedRect(2, 2, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    shadow.endFill();
    shadow.filters = [new PIXI.BlurFilter(3)];
    this.addChild(shadow);

    // Background rectangle with border
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(color);
    this.bg.lineStyle(1, COLORS.borderLight, 1);
    this.bg.drawRoundedRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    this.bg.endFill();
    this.addChild(this.bg);

    // Highlight border (initially hidden, for hover)
    this.glow = new PIXI.Graphics();
    this.glow.lineStyle(2, COLORS.borderHighlight, 0);
    this.glow.drawRoundedRect(-1, -1, LAYOUT.frameWidth + 2, LAYOUT.frameHeight + 2, LAYOUT.frameRadius);
    this.addChildAt(this.glow, 0);

    // Function name text
    const displayName = args ? `${functionName}(${this._formatArgs(args)})` : functionName;
    this.nameText = new PIXI.Text(displayName, {
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize: 15,
      fill: 0xFFFFFF,  // White text on colored background
      fontWeight: 'bold',
      resolution: 2,  // High resolution for crisp text
    });
    this.nameText.position.set(12, 12);
    this.addChild(this.nameText);

    // File info text
    this.fileText = new PIXI.Text(`${filename}:${lineno}`, {
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize: 11,
      fill: 0xF0F0F0,  // Light gray text
      resolution: 2,  // High resolution for crisp text
    });
    this.fileText.position.set(12, 36);
    this.addChild(this.fileText);

    // Set interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', this._onHover.bind(this));
    this.on('pointerout', this._onHoverOut.bind(this));
  }

  _getFunctionColor(funcName) {
    // Map function names to colors
    if (funcName === 'main') return COLORS.funcMain;
    if (funcName === 'fibonacci') return COLORS.funcFibonacci;
    return COLORS.info;
  }

  _formatArgs(args) {
    if (!args) return '';
    return Object.entries(args)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
  }

  _onHover() {
    this.highlight(true);
  }

  _onHoverOut() {
    this.highlight(false);
  }

  highlight(active) {
    Tween.killTweensOf(this.glow);
    Tween.to(this.glow, { alpha: active ? 1 : 0 }, 150, 'easeOutQuad');
  }

  animateIn(targetY, duration = 300) {
    this.position.set(0, targetY + 80);
    this.alpha = 0;

    Tween.to(this, {
      position: { y: targetY },
      alpha: 1
    }, duration, 'easeOutCubic');
  }

  animateOut(duration = 200, onComplete = null) {
    Tween.to(this, {
      position: { y: this.position.y + 50 },
      alpha: 0
    }, duration, 'easeInQuad', () => {
      this.destroy();
      if (onComplete) onComplete();
    });
  }

  // Flash effect for sampling profiler
  flash(duration = 150) {
    const flashOverlay = new PIXI.Graphics();
    flashOverlay.beginFill(0xFFFFFF, 0.4);
    flashOverlay.drawRoundedRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    flashOverlay.endFill();
    this.addChild(flashOverlay);

    Tween.to(flashOverlay, { alpha: 0 }, duration, 'easeOutQuad', () => {
      flashOverlay.destroy();
    });
  }
}
