import * as PIXI from 'pixi.js';
import { COLORS, TIMINGS } from '../config.js';
import { Tween } from '../utils/AnimationUtils.js';

export class SamplingPanel extends PIXI.Container {
  constructor(width, height) {
    super();

    this.panelWidth = width;
    this.panelHeight = height;

    // Sampling state
    this.samples = [];
    this.functionCounts = {};  // funcName -> count
    this.totalSamples = 0;
    this.sampleInterval = TIMINGS.sampleIntervalDefault;
    this.groundTruthFunctions = new Set();  // All functions in trace

    // Visual elements
    this.bars = {};  // funcName -> { bg, bar, label, pct }

    // Background
    this.bg = new PIXI.Graphics();
    this.bg.rect(0, 0, width, height);
    this.bg.fill(COLORS.panelBg);
    this.addChild(this.bg);

    // Title
    this.titleText = new PIXI.Text({
      text: 'Sampling Profiler',
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 14,
        fill: COLORS.textSecondary,
        fontWeight: 'bold',
      }
    });
    this.titleText.resolution = 2;
    this.titleText.position.set(12, 8);
    this.addChild(this.titleText);

    // Stats row
    this.statsContainer = new PIXI.Container();
    this.statsContainer.position.set(12, 32);
    this.addChild(this.statsContainer);

    this.sampleCountText = new PIXI.Text({
      text: 'Samples: 0',
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
        fill: COLORS.textSecondary,
      }
    });
    this.sampleCountText.resolution = 2;
    this.statsContainer.addChild(this.sampleCountText);

    this.intervalText = new PIXI.Text({
      text: `Interval: ${this.sampleInterval}ms`,
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
        fill: COLORS.textSecondary,
      }
    });
    this.intervalText.resolution = 2;
    this.intervalText.position.set(100, 0);
    this.statsContainer.addChild(this.intervalText);

    this.missedText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
        fill: COLORS.warning,
      }
    });
    this.missedText.resolution = 2;
    this.missedText.position.set(0, 16);
    this.statsContainer.addChild(this.missedText);

    // Bar chart container
    this.barContainer = new PIXI.Container();
    this.barContainer.position.set(12, 70);
    this.addChild(this.barContainer);
  }

  setSampleInterval(interval) {
    this.sampleInterval = interval;
    this.intervalText.text = `Interval: ${interval}ms`;
  }

  setGroundTruth(allFunctions) {
    this.groundTruthFunctions = new Set(allFunctions);
    this._updateMissedCount();
  }

  addSample(stack) {
    this.totalSamples++;
    this.sampleCountText.text = `Samples: ${this.totalSamples}`;

    // Record each function in the stack
    stack.forEach(frame => {
      const funcName = frame.func;
      this.functionCounts[funcName] = (this.functionCounts[funcName] || 0) + 1;
    });

    // Update display
    this._updateBars();
    this._updateMissedCount();
  }

  reset() {
    this.samples = [];
    this.functionCounts = {};
    this.totalSamples = 0;
    this.sampleCountText.text = 'Samples: 0';
    this.missedText.text = '';

    // Clear bar container
    this.barContainer.removeChildren();
    this.bars = {};
  }

  _updateMissedCount() {
    if (this.groundTruthFunctions.size === 0) return;

    const capturedFunctions = new Set(Object.keys(this.functionCounts));
    const missed = [...this.groundTruthFunctions].filter(f => !capturedFunctions.has(f));

    if (missed.length > 0) {
      this.missedText.text = `Missed: ${missed.length} function${missed.length > 1 ? 's' : ''}`;
      this.missedText.style.fill = COLORS.warning;
    } else if (this.totalSamples > 0) {
      this.missedText.text = 'All functions captured!';
      this.missedText.style.fill = COLORS.success;
    } else {
      this.missedText.text = '';
    }
  }

  _updateBars() {
    const barMaxWidth = this.panelWidth - 120;
    const rowHeight = 28;
    const barHeight = 20;

    // Sort functions by count (descending)
    const sorted = Object.entries(this.functionCounts)
      .sort((a, b) => b[1] - a[1]);

    sorted.forEach(([funcName, count], index) => {
      const y = index * rowHeight;
      const percentage = this.totalSamples > 0 ? count / this.totalSamples : 0;
      const targetWidth = Math.max(2, percentage * barMaxWidth);

      if (!this.bars[funcName]) {
        // Create new bar row
        const row = this._createBarRow(funcName, y, barMaxWidth, barHeight);
        this.bars[funcName] = row;
      }

      const barData = this.bars[funcName];

      // Update position if order changed
      if (barData.row.position.y !== y) {
        Tween.to(barData.row.position, { y: y }, 200, 'easeOutQuad');
      }

      // Animate bar width
      const currentWidth = barData.bar.width;
      if (Math.abs(currentWidth - targetWidth) > 1) {
        // Redraw bar with new width
        barData.bar.clear();
        barData.bar.roundRect(0, 0, targetWidth, barHeight, 3);
        barData.bar.fill({ color: this._getFunctionColor(funcName) });
      }

      // Update percentage text
      barData.pct.text = `${(percentage * 100).toFixed(0)}%`;
    });
  }

  _createBarRow(funcName, y, maxWidth, height) {
    const row = new PIXI.Container();
    row.position.set(0, y);

    // Function label
    const label = new PIXI.Text({
      text: funcName,
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
        fill: COLORS.textPrimary,
      }
    });
    label.resolution = 2;
    label.position.set(0, 3);
    row.addChild(label);

    // Bar background
    const bg = new PIXI.Graphics();
    bg.roundRect(70, 0, maxWidth, height, 3);
    bg.fill({ color: COLORS.borderLight });
    row.addChild(bg);

    // Active bar
    const bar = new PIXI.Graphics();
    bar.roundRect(0, 0, 2, height, 3);
    bar.fill({ color: this._getFunctionColor(funcName) });
    bar.position.set(70, 0);
    row.addChild(bar);

    // Percentage text
    const pct = new PIXI.Text({
      text: '0%',
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 10,
        fill: COLORS.textSecondary,
      }
    });
    pct.resolution = 2;
    pct.position.set(75 + maxWidth, 4);
    row.addChild(pct);

    this.barContainer.addChild(row);

    return { row, bg, bar, label, pct };
  }

  _getFunctionColor(funcName) {
    if (funcName === 'main') return COLORS.funcMain;
    if (funcName === 'fibonacci') return COLORS.funcFibonacci;
    if (funcName === 'add') return 0xE36209;      // Orange
    if (funcName === 'multiply') return 0x6F42C1; // Purple
    if (funcName === 'calculate') return COLORS.funcFibonacci;
    return COLORS.info;
  }

  // Get global position for flying frames to target
  getTargetPosition() {
    // Target the center of the bar chart area
    const globalPos = this.barContainer.getGlobalPosition();
    const barCount = Object.keys(this.bars).length;
    const centerY = barCount > 0 ? (barCount * 28) / 2 : 50;

    return {
      x: globalPos.x + (this.panelWidth - 120) / 2,
      y: globalPos.y + centerY
    };
  }

  // Show impact effect when flying frames arrive
  showImpactEffect(position) {
    // Convert global position to local
    const localPos = this.toLocal(position);

    const impact = new PIXI.Graphics();
    impact.circle(0, 0, 15);
    impact.fill({ color: COLORS.samplingAccent, alpha: 0.4 });
    impact.position.set(localPos.x, localPos.y);
    this.addChild(impact);

    // Animate expansion and fade
    Tween.to(impact.scale, { x: 4, y: 4 }, 300, 'easeOutQuad');
    Tween.to(impact, { alpha: 0 }, 300, 'easeOutQuad', () => {
      impact.destroy();
    });
  }
}
