import { Application, Graphics, Text, Container } from 'pixi.js';
import { DEMO_FIBONACCI, DEMO_SIMPLE } from '../shared/data/demoData.js';
import { ExecutionTrace } from '../shared/models/ExecutionTrace.js';
import { CodePanel } from '../shared/components/CodePanel.js';
import { StackVisualization } from '../shared/components/StackVisualization.js';
import { SamplingPanel } from '../shared/components/SamplingPanel.js';
import { ControlPanel } from '../shared/components/ControlPanel.js';
import { Tween } from '../shared/utils/AnimationUtils.js';
import { TIMINGS, LAYOUT, calculateLayout } from '../shared/config.js';

class TracingVisualization {
  constructor(app) {
    this.app = app;
    
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
    const layout = calculateLayout(app.screen.width, app.screen.height);

    // Create components with calculated layout
    this.codePanel = new CodePanel(
      this.trace.source,
      layout.codePanel.width,
      layout.codePanel.height
    );

    this.stackViz = new StackVisualization();
    this.stackViz.position.set(layout.stack.x, layout.stack.y);
    app.stage.addChild(this.stackViz);

    this.samplingPanel = new SamplingPanel(
      layout.sampling.width,
      layout.sampling.height
    );
    this.samplingPanel.position.set(layout.sampling.x, layout.sampling.y);
    this.samplingPanel.setGroundTruth(this._getGroundTruthFunctions());
    app.stage.addChild(this.samplingPanel);

    // Flash overlay for sampling
    this.flashOverlay = new Graphics()
      .rect(0, 0, app.screen.width, layout.contentHeight)
      .fill({ color: 0xFFFFFF });
    this.flashOverlay.alpha = 0;
    app.stage.addChild(this.flashOverlay);

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
    app.ticker.add((delta) => this.update(delta.deltaMS));
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

  update(deltaTime) {
    Tween.updateAll(deltaTime);

    // Update flying frame positions along their paths
    this.app.stage.children.forEach(child => {
      if (child._updatePathPosition) {
        child._updatePathPosition();
      }
    });

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

    const flyingFrames = this.stackViz.createFlyingFrames(this.app.stage);
    const targetPosition = this.samplingPanel.getTargetPosition();

    this._animateFlyingFrames(flyingFrames, targetPosition);
  }

  _animateFlyingFrames(flyingFrames, targetPosition) {
    if (flyingFrames.length === 0) {
      this.flyingAnimationInProgress = false;
      return;
    }

    // Calculate bezier path
    const startX = flyingFrames[0].position.x + LAYOUT.frameWidth / 2;
    const startY = flyingFrames[0].position.y + (flyingFrames.length * (LAYOUT.frameHeight + LAYOUT.frameSpacing)) / 2;
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
        if (!f.destroyed) f.destroy();
      });

      const stack = this.trace.getStackAt(this.currentTime);
      this.samplingPanel.addSample(stack);
      this.flyingAnimationInProgress = false;
    };

    flyingFrames.forEach((frame, index) => {
      const offsetX = frame.position.x - flyingFrames[0].position.x;
      const offsetY = frame.position.y - flyingFrames[0].position.y;

      const framePath = [
        { x: start.x + offsetX, y: start.y + offsetY },
        { x: control.x, y: control.y },
        { x: end.x, y: end.y }
      ];

      Tween.followPath(frame, framePath, TIMINGS.sampleToFlame, 'easeOutCubic', () => {
        completedCount++;
        if (completedCount === flyingFrames.length) {
          finalizeAnimation();
        }
      });
    });

    setTimeout(() => finalizeAnimation(), TIMINGS.sampleToFlame + 100);

    this.flashOverlay.alpha = 0.1;
    Tween.to(this.flashOverlay, { alpha: 0 }, 150, 'easeOutQuad');
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
(async () => {
  const app = new Application();
  await app.init({
    background: '#FAFAFA',
    resizeTo: window,
    antialias: true,
    resolution: window.devicePixelRatio || 2,
    autoDensity: true,
  });

  document.querySelector('#app').appendChild(app.canvas);

  new TracingVisualization(app);
})();
