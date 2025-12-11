import { COLORS, TIMINGS } from '../config.js';
import { Tween } from '../utils/DOMAnimationUtils.js';
import { getFunctionColor } from '../utils/ColorUtils.js';

export class DOMSamplingPanel {
  constructor(width, height) {
    this.panelWidth = width;
    this.panelHeight = height;

    // Sampling state
    this.samples = [];
    this.functionCounts = {};  // funcName -> count
    this.totalSamples = 0;
    this.sampleInterval = TIMINGS.sampleIntervalDefault;
    this.groundTruthFunctions = new Set();  // All functions in trace

    // Visual elements tracking
    this.bars = {};  // funcName -> DOM element

    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'sampling-panel';
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    // Background
    const bg = document.createElement('div');
    bg.className = 'sampling-bg';
    this.element.appendChild(bg);

    // Title
    const title = document.createElement('h3');
    title.className = 'sampling-title';
    title.textContent = 'Sampling Profiler';
    this.element.appendChild(title);

    // Stats container
    const stats = document.createElement('div');
    stats.className = 'sampling-stats';

    this.sampleCountEl = document.createElement('span');
    this.sampleCountEl.className = 'sample-count';
    this.sampleCountEl.textContent = 'Samples: 0';
    stats.appendChild(this.sampleCountEl);

    this.intervalEl = document.createElement('span');
    this.intervalEl.className = 'sample-interval';
    this.intervalEl.textContent = `Interval: ${this.sampleInterval}ms`;
    stats.appendChild(this.intervalEl);

    this.missedFunctionsEl = document.createElement('span');
    this.missedFunctionsEl.className = 'missed-functions';
    stats.appendChild(this.missedFunctionsEl);

    this.element.appendChild(stats);

    // Bars container
    this.barsContainer = document.createElement('div');
    this.barsContainer.className = 'sampling-bars';
    this.element.appendChild(this.barsContainer);
  }

  setSampleInterval(interval) {
    this.sampleInterval = interval;
    this.intervalEl.textContent = `Interval: ${interval}ms`;
  }

  setGroundTruth(allFunctions) {
    this.groundTruthFunctions = new Set(allFunctions);
    this._updateMissedCount();
  }

  addSample(stack) {
    this.totalSamples++;
    this.sampleCountEl.textContent = `Samples: ${this.totalSamples}`;

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
    this.sampleCountEl.textContent = 'Samples: 0';
    this.missedFunctionsEl.textContent = '';

    // Clear bars
    this.barsContainer.innerHTML = '';
    this.bars = {};
  }

  _updateMissedCount() {
    if (this.groundTruthFunctions.size === 0) return;

    const capturedFunctions = new Set(Object.keys(this.functionCounts));
    const missed = [...this.groundTruthFunctions].filter(f => !capturedFunctions.has(f));

    if (missed.length > 0) {
      this.missedFunctionsEl.textContent = `Missed: ${missed.length} function${missed.length > 1 ? 's' : ''}`;
      this.missedFunctionsEl.style.color = '#E36209'; // warning color
    } else if (this.totalSamples > 0) {
      this.missedFunctionsEl.textContent = 'All functions captured!';
      this.missedFunctionsEl.style.color = '#6A9955'; // success color
    } else {
      this.missedFunctionsEl.textContent = '';
    }
  }

  _updateBars() {
    const barMaxWidth = this.panelWidth - 150;  // Leave room for percentage text
    const rowHeight = 28;

    // Sort functions by count (descending)
    const sorted = Object.entries(this.functionCounts)
      .sort((a, b) => b[1] - a[1]);

    sorted.forEach(([funcName, count], index) => {
      const y = index * rowHeight;
      const percentage = this.totalSamples > 0 ? count / this.totalSamples : 0;
      const targetWidth = Math.max(2, percentage * barMaxWidth);

      if (!this.bars[funcName]) {
        // Create new bar row
        const row = this._createBarRow(funcName, barMaxWidth);
        this.barsContainer.appendChild(row);
        this.bars[funcName] = row;
      }

      const row = this.bars[funcName];

      // Update position with transform for smooth animation
      const currentTransform = getComputedStyle(row).transform;
      const matrix = new DOMMatrix(currentTransform);
      const currentY = matrix.m42;

      if (Math.abs(currentY - y) > 0.5) {
        Tween.to(row, {
          position: { y }
        }, 200, 'easeOutQuad');
      }

      // Update bar width
      const barFill = row.querySelector('.bar-fill');
      const currentWidth = parseFloat(barFill.style.width) || 0;
      if (Math.abs(currentWidth - targetWidth) > 1) {
        // Use CSS transition for smooth width changes
        barFill.style.width = `${targetWidth}px`;
      }

      // Update percentage text
      const percentEl = row.querySelector('.bar-percent');
      percentEl.textContent = `${(percentage * 100).toFixed(0)}%`;
    });
  }

  _createBarRow(funcName, maxWidth) {
    const row = document.createElement('div');
    row.className = 'sampling-bar-row';
    row.dataset.function = funcName;

    // Function label
    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = funcName;
    row.appendChild(label);

    // Bar container (for relative positioning)
    const barContainer = document.createElement('div');
    barContainer.style.position = 'absolute';
    barContainer.style.left = '70px';
    barContainer.style.top = '0px';

    // Bar background
    const barBg = document.createElement('div');
    barBg.className = 'bar-bg';
    barBg.style.width = `${maxWidth}px`;
    barContainer.appendChild(barBg);

    // Bar fill
    const barFill = document.createElement('div');
    barFill.className = 'bar-fill';
    barFill.style.width = '2px';
    barFill.style.backgroundColor = getFunctionColor(funcName);
    barContainer.appendChild(barFill);

    row.appendChild(barContainer);

    // Percentage text
    const percent = document.createElement('span');
    percent.className = 'bar-percent';
    percent.textContent = '0%';
    percent.style.position = 'absolute';
    percent.style.left = `${75 + maxWidth}px`;
    percent.style.top = '4px';
    row.appendChild(percent);

    return row;
  }

  // Get position for flying frames to target
  getTargetPosition(container = null) {
    const barCount = Object.keys(this.bars).length;
    const centerY = barCount > 0 ? (barCount * 28) / 2 : 50;

    // Get element's position relative to the container
    const rect = this.barsContainer.getBoundingClientRect();
    const containerRect = container ? container.getBoundingClientRect() : this.element.parentElement.getBoundingClientRect();

    const barStartX = 70;  // Bars start 70px from left (see _createBarRow)
    const barMaxWidth = this.panelWidth - 150;

    return {
      x: rect.left - containerRect.left + barStartX + barMaxWidth / 2,
      y: rect.top - containerRect.top + centerY
    };
  }

  // Show impact effect when flying frames arrive
  showImpactEffect(position) {
    // Create impact circle
    const impact = document.createElement('div');
    impact.className = 'impact-circle';
    impact.style.left = `${position.x}px`;
    impact.style.top = `${position.y}px`;
    impact.style.width = '30px';
    impact.style.height = '30px';

    this.element.appendChild(impact);

    // Animate expansion and fade
    Tween.to(impact, {
      position: { x: position.x - 15, y: position.y - 15 }, // Adjust for center
      scale: 4,
      alpha: 0
    }, 300, 'easeOutQuad', () => {
      if (impact.parentNode) {
        impact.parentNode.removeChild(impact);
      }
    });
  }
}