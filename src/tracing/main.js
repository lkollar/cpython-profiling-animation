import { DEMO_FIBONACCI, DEMO_SIMPLE } from '../shared/data/demoData.js';
import { ExecutionTrace } from '../shared/models/ExecutionTrace.js';
import { CodePanel } from '../shared/components/CodePanel.js';
import { DOMStackVisualization } from '../shared/components/DOMStackVisualization.js';
import { DOMSamplingPanel } from '../shared/components/DOMSamplingPanel.js';
import { ControlPanel } from '../shared/components/ControlPanel.js';
import { Tween } from '../shared/utils/DOMAnimationUtils.js';
import { TIMINGS, LAYOUT, calculateLayout } from '../shared/config.js';

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

    // Calculate layout using centralized system
    const layout = calculateLayout(container.clientWidth, container.clientHeight);

    // Create visualization container
    const vizContainer = document.createElement('div');
    vizContainer.id = 'viz-container';
    vizContainer.style.cssText = `
      position: relative;
      width: 100%;
      height: ${layout.contentHeight}px;
      background: #FAFAFA;
    `;
    container.appendChild(vizContainer);
    this.vizContainer = vizContainer;

    // Create components with calculated layout
    this.codePanel = new CodePanel(
      this.trace.source,
      layout.codePanel.width,
      layout.codePanel.height
    );

    this.stackViz = new DOMStackVisualization();
    this.stackViz.element.style.left = `${layout.stack.x}px`;
    this.stackViz.element.style.top = `${layout.stack.y}px`;
    this.vizContainer.appendChild(this.stackViz.element);

    this.samplingPanel = new DOMSamplingPanel(
      layout.sampling.width,
      layout.sampling.height
    );
    this.samplingPanel.element.style.left = `${layout.sampling.x}px`;
    this.samplingPanel.element.style.top = `${layout.sampling.y}px`;
    this.samplingPanel.setGroundTruth(this._getGroundTruthFunctions());
    this.vizContainer.appendChild(this.samplingPanel.element);

    // Flash overlay for sampling
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.className = 'flash-overlay';
    this.flashOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: white;
      pointer-events: none;
      opacity: 0;
    `;
    this.vizContainer.appendChild(this.flashOverlay);

    // Create control panel
    this.controls = new ControlPanel(
      document.body,
      () => this.play(),
      () => this.pause(),
      () => this.reset(),
      (speed) => this.setSpeed(speed),
      (progress) => this.seek(progress),
      () => this.step(),
      (interval) => this.setSampleInterval(interval)
    );
    this.controls.setDuration(this.trace.duration);

    // Start animation loop
    this.lastTime = performance.now();
    this._animate();
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
    // Extract all unique function names from trace events
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

    // Find the next event after current time
    const nextEvent = this.trace.getNextEvent(this.currentTime);

    if (nextEvent) {
      // Advance to just after the event to ensure it's processed
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

    // Advance time
    this.currentTime += deltaTime * this.playbackSpeed;

    // Check for completion
    if (this.currentTime >= this.trace.duration) {
      this.currentTime = this.trace.duration;
      this.isPlaying = false;
      this.controls.pause();
    }

    // Process events up to current time
    while (this.eventIndex < this.trace.events.length) {
      const event = this.trace.events[this.eventIndex];

      if (event.timestamp > this.currentTime) {
        break;
      }

      this._processEvent(event);
      this.eventIndex++;
    }

    // Update UI
    this.controls.updateTimeDisplay(this.currentTime, this.trace.duration);

    // Take samples at configured interval
    if (this.currentTime - this.lastSampleTime >= this.sampleInterval) {
      this._takeSample();
      this.lastSampleTime = this.currentTime;
    }
  }

  _processEvent(event) {
    // Update stack visualization
    this.stackViz.processEvent(event);

    // Highlight current line
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
    // Prevent overlapping animations
    if (this.flyingAnimationInProgress) return;

    const stack = this.trace.getStackAt(this.currentTime);

    // Skip animation if stack is empty
    if (stack.length === 0) {
      this.samplingPanel.addSample(stack);
      return;
    }

    this.flyingAnimationInProgress = true;
    this.stackViz.flashAll();

    const flyingFrames = this.stackViz.createFlyingFrames(this.vizContainer);
    const targetPosition = this.samplingPanel.getTargetPosition();

    this._animateFlyingFrames(flyingFrames, targetPosition);
  }

  _animateFlyingFrames(flyingFrames, targetPosition) {
    if (flyingFrames.length === 0) {
      this.flyingAnimationInProgress = false;
      return;
    }

    // Calculate bezier path
    const firstFramePos = flyingFrames[0].getPosition();
    const startX = firstFramePos.x + LAYOUT.frameWidth / 2;
    const startY = firstFramePos.y + (flyingFrames.length * (LAYOUT.frameHeight + LAYOUT.frameSpacing)) / 2;
    const start = { x: startX, y: startY };
    const end = targetPosition;
    const control = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 80
    };

    let completedCount = 0;
    let animationFinalized = false;

    const finalizeAnimation = () => {
      if (animationFinalized) return;
      animationFinalized = true;

      this.samplingPanel.showImpactEffect(end);
      flyingFrames.forEach(f => {
        f.destroy();
      });

      const stack = this.trace.getStackAt(this.currentTime);
      this.samplingPanel.addSample(stack);
      this.flyingAnimationInProgress = false;
    };

    flyingFrames.forEach((frame, index) => {
      const framePos = frame.getPosition();
      const offsetX = framePos.x - firstFramePos.x;
      const offsetY = framePos.y - firstFramePos.y;

      const framePath = [
        { x: start.x + offsetX, y: start.y + offsetY },
        { x: control.x, y: control.y },
        { x: end.x, y: end.y }
      ];

      frame.animateAlongPath(framePath, TIMINGS.sampleToFlame, () => {
        completedCount++;
        if (completedCount === flyingFrames.length) {
          finalizeAnimation();
        }
      });
    });

    setTimeout(() => finalizeAnimation(), TIMINGS.sampleToFlame + 100);

    // Flash overlay animation
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

    // Rebuild sampling state - retake samples up to current time
    for (let t = 0; t < this.currentTime; t += this.sampleInterval) {
      const stack = this.trace.getStackAt(t);
      this.samplingPanel.addSample(stack);
      this.lastSampleTime = t;
    }

    // Update Stack Viz to match current state
    const stack = this.trace.getStackAt(this.currentTime);
    this.stackViz.updateToMatch(stack);

    // Highlight current line
    if (stack.length > 0) {
      this.codePanel.highlightLine(stack[stack.length - 1].line);
    }

    this.eventIndex = events.length;
  }
}

// Initialize
const appContainer = document.querySelector('#app');
new TracingVisualization(appContainer);