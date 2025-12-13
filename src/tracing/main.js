import { DEMO_FIBONACCI, DEMO_SIMPLE } from '../shared/data/demoData.js';
import { ExecutionTrace } from '../shared/models/ExecutionTrace.js';
import { CodePanel } from '../shared/components/CodePanel.js';
import { DOMStackVisualization } from '../shared/components/DOMStackVisualization.js';
import { DOMSamplingPanel } from '../shared/components/DOMSamplingPanel.js';
import { ControlPanel } from '../shared/components/ControlPanel.js';
import { Tween } from '../shared/utils/DOMAnimationUtils.js';
import { TIMINGS, LAYOUT } from '../shared/config.js';

class TracingVisualization {
  constructor(container) {
    this.container = container;

    // Initialize with simple demo
    this.trace = new ExecutionTrace(DEMO_SIMPLE.source, DEMO_SIMPLE.trace);

    // Playback state
    this.currentTime = 0;
    this.isPlaying = false;
    this.playbackSpeed = TIMINGS.defaultSpeed;
    this.eventIndex = 0;

    // Sampling state
    this.sampleInterval = TIMINGS.sampleIntervalDefault;
    this.lastSampleTime = 0;
    this.flyingAnimationInProgress = false;

    // Create new DOM structure
    this._createLayout();

    // Start animation loop
    this.lastTime = performance.now();
    this._animate();
  }

  _createLayout() {
    // Code panel goes directly into container (left column of CSS grid)
    this.codePanel = new CodePanel(this.trace.source);
    this.container.appendChild(this.codePanel.element);

    // Create visualization column (right side)
    this.vizColumn = document.createElement('div');
    this.vizColumn.className = 'viz-column';
    this.container.appendChild(this.vizColumn);

    // Stack section
    const stackSection = document.createElement('div');
    stackSection.className = 'stack-section';

    const stackTitle = document.createElement('div');
    stackTitle.className = 'stack-section-title';
    stackTitle.textContent = 'Call Stack';
    stackSection.appendChild(stackTitle);

    this.stackViz = new DOMStackVisualization();
    stackSection.appendChild(this.stackViz.element);
    this.vizColumn.appendChild(stackSection);

    // Sampling panel
    this.samplingPanel = new DOMSamplingPanel();
    this.samplingPanel.setGroundTruth(this._getGroundTruthFunctions());
    this.vizColumn.appendChild(this.samplingPanel.element);

    // Flash overlay for sampling
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.className = 'flash-overlay';
    this.vizColumn.appendChild(this.flashOverlay);

    // Create control panel (integrated into viz column)
    this.controls = new ControlPanel(
      this.vizColumn,
      () => this.play(),
      () => this.pause(),
      () => this.reset(),
      (speed) => this.setSpeed(speed),
      (progress) => this.seek(progress),
      () => this.step(),
      (interval) => this.setSampleInterval(interval)
    );
    this.controls.setDuration(this.trace.duration);
  }

  loadTrace(demoData) {
    this.pause();
    this.trace = new ExecutionTrace(demoData.source, demoData.trace);

    this.codePanel.updateSource(this.trace.source);
    this.samplingPanel.setGroundTruth(this._getGroundTruthFunctions());
    this.controls.setDuration(this.trace.duration);

    this.reset();
  }

  setSampleInterval(interval) {
    this.sampleInterval = interval;
    this.samplingPanel.setSampleInterval(interval);
  }

  _getGroundTruthFunctions() {
    const functions = new Set();
    this.trace.events.forEach(event => {
      if (event.type === 'call') {
        functions.add(event.functionName);
      }
    });
    return [...functions];
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  reset() {
    this.currentTime = 0;
    this.eventIndex = 0;
    this.isPlaying = false;
    this.lastSampleTime = 0;
    this.stackViz.clear();
    this.codePanel.reset();
    this.samplingPanel.reset();
    this.controls.updateTimeDisplay(0, this.trace.duration);
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  seek(progress) {
    this.currentTime = progress * this.trace.duration;
    this.eventIndex = 0;
    this.lastSampleTime = 0;
    this._rebuildState();
  }

  step() {
    this.pause();

    const nextEvent = this.trace.getNextEvent(this.currentTime);

    if (nextEvent) {
      this.currentTime = nextEvent.timestamp + 0.1;
      this.eventIndex = 0;
      this._rebuildState();
    }
  }

  _animate(currentTime = performance.now()) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    requestAnimationFrame((t) => this._animate(t));
  }

  update(deltaTime) {
    Tween.updateAll(deltaTime);

    if (!this.isPlaying) {
      this.controls.updateTimeDisplay(this.currentTime, this.trace.duration);
      return;
    }

    this.currentTime += deltaTime * this.playbackSpeed;

    if (this.currentTime >= this.trace.duration) {
      this.currentTime = this.trace.duration;
      this.isPlaying = false;
      this.controls.pause();
    }

    while (this.eventIndex < this.trace.events.length) {
      const event = this.trace.events[this.eventIndex];

      if (event.timestamp > this.currentTime) {
        break;
      }

      this._processEvent(event);
      this.eventIndex++;
    }

    this.controls.updateTimeDisplay(this.currentTime, this.trace.duration);

    if (this.currentTime - this.lastSampleTime >= this.sampleInterval) {
      this._takeSample();
      this.lastSampleTime = this.currentTime;
    }
  }

  _processEvent(event) {
    this.stackViz.processEvent(event);

    if (event.type === 'call') {
      this.codePanel.highlightLine(event.lineno);
    } else if (event.type === 'return') {
      const currentStack = this.trace.getStackAt(this.currentTime);
      if (currentStack.length > 0) {
        this.codePanel.highlightLine(currentStack[currentStack.length - 1].line);
      } else {
        this.codePanel.highlightLine(null);
      }
    } else if (event.type === 'line') {
      this.codePanel.highlightLine(event.lineno);
    }
  }

  _takeSample() {
    if (this.flyingAnimationInProgress) return;

    const stack = this.trace.getStackAt(this.currentTime);

    if (stack.length === 0) {
      this.samplingPanel.addSample(stack);
      return;
    }

    this.flyingAnimationInProgress = true;
    this.stackViz.flashAll();

    const clone = this.stackViz.createStackClone(document.body);
    const targetPosition = this.samplingPanel.getTargetPosition();

    this._animateStackClone(clone, targetPosition);
  }

  _animateStackClone(clone, targetPosition) {
    const rect = clone.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    clone.animate([
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1
      },
      {
        transform: `translate(${targetPosition.x - startX}px, ${targetPosition.y - startY}px) scale(0.3)`,
        opacity: 0.6
      }
    ], {
      duration: TIMINGS.sampleToFlame,
      easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      fill: 'forwards'
    }).onfinish = () => {
      this.samplingPanel.showImpactEffect(targetPosition);
      clone.remove();

      const stack = this.trace.getStackAt(this.currentTime);
      this.samplingPanel.addSample(stack);
      this.flyingAnimationInProgress = false;
    };

    this.flashOverlay.animate([
      { opacity: 0.1 },
      { opacity: 0 }
    ], {
      duration: 150,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }

  _rebuildState() {
    this.stackViz.clear();
    this.codePanel.reset();
    this.samplingPanel.reset();

    const events = this.trace.getEventsUntil(this.currentTime);

    for (let t = 0; t < this.currentTime; t += this.sampleInterval) {
      const stack = this.trace.getStackAt(t);
      this.samplingPanel.addSample(stack);
      this.lastSampleTime = t;
    }

    const stack = this.trace.getStackAt(this.currentTime);
    this.stackViz.updateToMatch(stack);

    if (stack.length > 0) {
      this.codePanel.highlightLine(stack[stack.length - 1].line);
    }

    this.eventIndex = events.length;
  }
}

// Initialize
const appContainer = document.querySelector('#app');
new TracingVisualization(appContainer);
