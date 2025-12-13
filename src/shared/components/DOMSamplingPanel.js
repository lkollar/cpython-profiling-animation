import { TIMINGS } from '../config.js';
import { getFunctionColor } from '../utils/ColorUtils.js';

export class DOMSamplingPanel {
  constructor() {
    // Sampling state
    this.samples = [];
    this.functionCounts = {};
    this.totalSamples = 0;
    this.sampleInterval = TIMINGS.sampleIntervalDefault;
    this.groundTruthFunctions = new Set();

    // Visual elements tracking
    this.bars = {};

    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'sampling-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'sampling-header';

    // Title
    const title = document.createElement('h3');
    title.className = 'sampling-title';
    title.textContent = 'Sampling Profiler';
    header.appendChild(title);

    // Stats container
    const stats = document.createElement('div');
    stats.className = 'sampling-stats';

    this.sampleCountEl = document.createElement('span');
    this.sampleCountEl.textContent = 'Samples: 0';
    stats.appendChild(this.sampleCountEl);

    this.intervalEl = document.createElement('span');
    this.intervalEl.textContent = `Interval: ${this.sampleInterval}ms`;
    stats.appendChild(this.intervalEl);

    this.missedFunctionsEl = document.createElement('span');
    this.missedFunctionsEl.className = 'missed';
    stats.appendChild(this.missedFunctionsEl);

    header.appendChild(stats);
    this.element.appendChild(header);

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

    stack.forEach(frame => {
      const funcName = frame.func;
      this.functionCounts[funcName] = (this.functionCounts[funcName] || 0) + 1;
    });

    this._updateBars();
    this._updateMissedCount();
  }

  reset() {
    this.samples = [];
    this.functionCounts = {};
    this.totalSamples = 0;
    this.sampleCountEl.textContent = 'Samples: 0';
    this.missedFunctionsEl.textContent = '';

    this.barsContainer.innerHTML = '';
    this.bars = {};
  }

  _updateMissedCount() {
    if (this.groundTruthFunctions.size === 0) return;

    const capturedFunctions = new Set(Object.keys(this.functionCounts));
    const missed = [...this.groundTruthFunctions].filter(f => !capturedFunctions.has(f));

    if (missed.length > 0) {
      this.missedFunctionsEl.textContent = `Missed: ${missed.length} function${missed.length > 1 ? 's' : ''}`;
      this.missedFunctionsEl.classList.add('missed');
    } else if (this.totalSamples > 0) {
      this.missedFunctionsEl.textContent = 'All captured!';
      this.missedFunctionsEl.classList.remove('missed');
      this.missedFunctionsEl.style.color = 'var(--color-green)';
    } else {
      this.missedFunctionsEl.textContent = '';
    }
  }

  _updateBars() {
    // Sort functions by count (descending)
    const sorted = Object.entries(this.functionCounts)
      .sort((a, b) => b[1] - a[1]);

    sorted.forEach(([funcName, count], index) => {
      const percentage = this.totalSamples > 0 ? count / this.totalSamples : 0;

      if (!this.bars[funcName]) {
        const row = this._createBarRow(funcName);
        this.barsContainer.appendChild(row);
        this.bars[funcName] = row;
      }

      const row = this.bars[funcName];

      // Update bar width
      const barFill = row.querySelector('.bar-fill');
      barFill.style.width = `${percentage * 100}%`;

      // Update percentage text
      const percentEl = row.querySelector('.bar-percent');
      percentEl.textContent = `${(percentage * 100).toFixed(0)}%`;

      // Reorder in DOM if needed
      const currentIndex = Array.from(this.barsContainer.children).indexOf(row);
      if (currentIndex !== index) {
        this.barsContainer.insertBefore(row, this.barsContainer.children[index]);
      }
    });
  }

  _createBarRow(funcName) {
    const row = document.createElement('div');
    row.className = 'sampling-bar-row';
    row.dataset.function = funcName;

    // Function label
    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = funcName;
    row.appendChild(label);

    // Bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';

    // Bar fill
    const barFill = document.createElement('div');
    barFill.className = 'bar-fill';
    barFill.style.backgroundColor = getFunctionColor(funcName);
    barContainer.appendChild(barFill);

    row.appendChild(barContainer);

    // Percentage text
    const percent = document.createElement('span');
    percent.className = 'bar-percent';
    percent.textContent = '0%';
    row.appendChild(percent);

    return row;
  }

  // Get position for flying frames to target (screen coordinates)
  getTargetPosition() {
    const rect = this.barsContainer.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + 50
    };
  }

  // Show impact effect when flying frames arrive
  showImpactEffect(position) {
    const impact = document.createElement('div');
    impact.className = 'impact-circle';
    impact.style.position = 'fixed';
    impact.style.left = `${position.x}px`;
    impact.style.top = `${position.y}px`;

    document.body.appendChild(impact);

    impact.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.6 },
      { transform: 'translate(-50%, -50%) scale(4)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-out'
    }).onfinish = () => {
      impact.remove();
    };
  }
}
