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
    shadow.roundRect(2, 2, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    shadow.fill({ color: 0x000000, alpha: 0.1 });
    shadow.filters = [new PIXI.BlurFilter({ strength: 3 })];
    this.addChild(shadow);

    // Background rectangle with border
    this.bg = new PIXI.Graphics();
    this.bg.roundRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    this.bg.fill({ color: color });
    this.bg.stroke({ width: 1, color: COLORS.borderLight, alpha: 1 });
    this.addChild(this.bg);

    // Highlight border (initially hidden, for hover)
    this.glow = new PIXI.Graphics();
    this.glow.roundRect(-1, -1, LAYOUT.frameWidth + 2, LAYOUT.frameHeight + 2, LAYOUT.frameRadius);
    this.glow.stroke({ width: 2, color: COLORS.borderHighlight, alpha: 0 });
    this.addChildAt(this.glow, 0);

    // Function name text
    const displayName = args ? `${functionName}(${this._formatArgs(args)})` : functionName;
    this.nameText = new PIXI.Text({
      text: displayName,
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 15,
        fill: 0xFFFFFF,  // White text on colored background
        fontWeight: 'bold',
      }
    });
    this.nameText.resolution = 2; // Set resolution directly on instance if needed, or in style options? v8 style options usually don't have resolution. Text instance has it.
    this.nameText.position.set(12, 12);
    this.addChild(this.nameText);

    // File info text
    this.fileText = new PIXI.Text({
      text: `${filename}:${lineno}`,
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
        fill: 0xF0F0F0,  // Light gray text
      }
    });
    this.fileText.resolution = 2;
    this.fileText.position.set(12, 36);
    this.addChild(this.fileText);

    // Profiler Stats Text (Initially empty)
    this.statsText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 10,
        fill: 0xFFFFFF,
        align: 'right',
      }
    });
    this.statsText.anchor.set(1, 0.5);
    this.statsText.position.set(LAYOUT.frameWidth - 12, LAYOUT.frameHeight / 2);
    this.addChild(this.statsText);

    // Set interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', this._onHover.bind(this));
    this.on('pointerout', this._onHoverOut.bind(this));
  }

  destroy(options) {
    Tween.killTweensOf(this);
    Tween.killTweensOf(this.glow);
    super.destroy(options);
  }

  // Update the line number displayed
  updateLine(lineno) {
    this.lineno = lineno;
    this.fileText.text = `${this.filename}:${lineno}`;
  }

  // Update profiler stats
  updateStats(ncalls, tottime, cumtime) {
    // Format times (ms)
    const tot = tottime.toFixed(0);
    const cum = cumtime.toFixed(0);
    this.statsText.text = `${ncalls} calls | tot: ${tot}ms | cum: ${cum}ms`;
  }

  setActive(isActive) {
    if (this.isActive === isActive) return;
    this.isActive = isActive;

    if (isActive) {
      // Highlight active frame with thicker border and glow
      this.bg.stroke({ width: 3, color: COLORS.borderHighlight, alpha: 1 });
      this.glow.alpha = 0.5; // Persistent glow for active frame
    } else {
      // Reset to normal
      this.bg.stroke({ width: 1, color: COLORS.borderLight, alpha: 1 });
      this.glow.alpha = 0;
    }
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
    flashOverlay.roundRect(0, 0, LAYOUT.frameWidth, LAYOUT.frameHeight, LAYOUT.frameRadius);
    flashOverlay.fill({ color: 0xFFFFFF, alpha: 0.4 });
    this.addChild(flashOverlay);

    Tween.to(flashOverlay, { alpha: 0 }, duration, 'easeOutQuad', () => {
      flashOverlay.destroy();
    });
  }
}
