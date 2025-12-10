import * as PIXI from 'pixi.js';
import { Application } from 'pixi.js';
import { DEMO_FIBONACCI, DEMO_SIMPLE } from '../shared/data/demoData.js';
import { ExecutionTrace } from '../shared/models/ExecutionTrace.js';
import { CodePanel } from '../shared/components/CodePanel.js';
import { StackVisualization } from '../shared/components/StackVisualization.js';
import { SamplingPanel } from '../shared/components/SamplingPanel.js';
import { ControlPanel } from '../shared/components/ControlPanel.js';
import { Tween } from '../shared/utils/AnimationUtils.js';
import { TIMINGS, LAYOUT } from '../shared/config.js';

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

    // Calculate layout - optimized for documentation embedding
    this.width = app.screen.width;
    this.height = app.screen.height - 100; // Leave space for controls

    // Tighter proportions for embedded view
    const codePanelWidth = Math.min(this.width * 0.35, 400);
    const centerColumnWidth = 450; // Fixed width for consistent layout
    const stackHeight = this.height * 0.45;
    const samplingHeight = this.height * 0.55;

    // Center column starts after code panel
    const centerColumnStart = codePanelWidth;

    // Create components
    this.codePanel = new CodePanel(
      this.trace.source,
      codePanelWidth,
      this.height
    );

    this.stackViz = new StackVisualization();
    // Center stack frames in the middle column (stack frames are ~200px wide from LAYOUT.frameWidth)
    this.stackViz.position.set(centerColumnStart + (centerColumnWidth - 200) / 2, 50);
    app.stage.addChild(this.stackViz);

    this.samplingPanel = new SamplingPanel(
      centerColumnWidth - 40,
      samplingHeight
    );
    this.samplingPanel.position.set(centerColumnStart + 20, stackHeight + 50);
    this.samplingPanel.setGroundTruth(this._getGroundTruthFunctions());
    app.stage.addChild(this.samplingPanel);

    // Flash overlay for sampling
    this.flashOverlay = new PIXI.Graphics();
    this.flashOverlay.rect(0, 0, this.width, this.height);
    this.flashOverlay.fill({ color: 0xFFFFFF });
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

    // Get current stack state
    const stack = this.trace.getStackAt(this.currentTime);

    // Skip animation if stack is empty
    if (stack.length === 0) {
      this.samplingPanel.addSample(stack);
      return;
    }

    this.flyingAnimationInProgress = true;

    // Flash the stack frames
    this.stackViz.flashAll();

    // Create flying frame duplicates
    const flyingFrames = this.stackViz.createFlyingFrames(this.app.stage);

    if (flyingFrames.length === 0) {
      this.samplingPanel.addSample(stack);
      this.flyingAnimationInProgress = false;
      return;
    }

    // Calculate bezier path
    // Start: center of flying frames cluster
    const startX = flyingFrames[0].position.x + LAYOUT.frameWidth / 2;
    const startY = flyingFrames[0].position.y + (flyingFrames.length * (LAYOUT.frameHeight + LAYOUT.frameSpacing)) / 2;
    const start = { x: startX, y: startY };

    // End: sampling panel target
    const end = this.samplingPanel.getTargetPosition();

    // Control point: arc upward
    const control = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 80
    };

    const path = [start, control, end];

    // Animate all frames along the path
    let completedCount = 0;
    const totalFrames = flyingFrames.length;
    let animationFinalized = false;

    const finalizeAnimation = () => {
      if (animationFinalized) return;
      animationFinalized = true;

      // Show impact effect
      this.samplingPanel.showImpactEffect(end);

      // Destroy all flying frames (even if some didn't complete)
      flyingFrames.forEach(f => {
        if (!f.destroyed) {
          f.destroy();
        }
      });

      // Record the sample
      this.samplingPanel.addSample(stack);

      // Allow next animation
      this.flyingAnimationInProgress = false;
    };

    flyingFrames.forEach((frame, index) => {
      // Offset each frame's start position relative to cluster center
      const offsetX = frame.position.x - flyingFrames[0].position.x;
      const offsetY = frame.position.y - flyingFrames[0].position.y;

      // Create individual path offset from main path
      const framePath = [
        { x: start.x + offsetX, y: start.y + offsetY },
        { x: control.x, y: control.y },  // All converge through same control point
        { x: end.x, y: end.y }           // All arrive at same destination
      ];

      Tween.followPath(frame, framePath, TIMINGS.sampleToFlame, 'easeOutCubic', () => {
        completedCount++;

        // When all frames complete
        if (completedCount === totalFrames) {
          finalizeAnimation();
        }
      });
    });

    // Safety timeout: force completion after animation duration + buffer
    setTimeout(() => {
      finalizeAnimation();
    }, TIMINGS.sampleToFlame + 100);

    // Reduced flash overlay (flying frames are primary feedback now)
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
