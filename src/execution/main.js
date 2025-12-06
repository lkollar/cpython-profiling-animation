import { Application } from 'pixi.js';
import { DEMO_FIBONACCI } from '../shared/data/demoData.js';
import { ExecutionTrace } from '../shared/models/ExecutionTrace.js';
import { CodePanel } from '../shared/components/CodePanel.js';
import { StackVisualization } from '../shared/components/StackVisualization.js';
import { TimelinePanel } from '../shared/components/TimelinePanel.js';
import { ControlPanel } from '../shared/components/ControlPanel.js';
import { Tween } from '../shared/utils/AnimationUtils.js';
import { TIMINGS } from '../shared/config.js';

class ExecutionVisualization {
  constructor(app) {
    this.app = app;
    this.trace = new ExecutionTrace(DEMO_FIBONACCI.source, DEMO_FIBONACCI.trace);

    // Playback state
    this.currentTime = 0;
    this.isPlaying = false;
    this.playbackSpeed = TIMINGS.defaultSpeed;
    this.eventIndex = 0;

    // Calculate layout
    this.width = app.screen.width;
    this.height = app.screen.height - 100; // Leave space for controls

    const codePanelWidth = this.width * 0.3;
    const stackPanelWidth = this.width * 0.4;
    const timelinePanelWidth = this.width * 0.3;

    // Create components
    // CodePanel is now DOM-based (HTML overlay), not added to PixiJS stage
    this.codePanel = new CodePanel(
      this.trace.source,
      codePanelWidth,
      this.height
    );

    this.stackViz = new StackVisualization();
    this.stackViz.position.set(codePanelWidth + 20, 50);
    app.stage.addChild(this.stackViz);

    this.timelinePanel = new TimelinePanel(
      timelinePanelWidth - 40,
      this.height,
      this.trace.duration
    );
    this.timelinePanel.position.set(codePanelWidth + stackPanelWidth, 0);
    app.stage.addChild(this.timelinePanel);

    // Create control panel
    this.controls = new ControlPanel(
      document.body,
      () => this.play(),
      () => this.pause(),
      () => this.reset(),
      (speed) => this.setSpeed(speed),
      (progress) => this.seek(progress),
      () => this.step()
    );
    this.controls.setDuration(this.trace.duration);

    // Start animation loop
    app.ticker.add((delta) => this.update(delta.deltaMS));
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
    this.stackViz.clear();
    this.codePanel.reset();
    this.timelinePanel.reset();
    this.controls.updateTimeDisplay(0, this.trace.duration);
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  seek(progress) {
    this.currentTime = progress * this.trace.duration;
    this.eventIndex = 0;
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
    } else {
      // If no next event, just advance a small amount or do nothing
      // Maybe loop to start? No, just stop.
    }
  }

  update(deltaTime) {
    // Scale tweens with playback speed when playing, normal when paused
    const tweenDelta = this.isPlaying ? deltaTime * this.playbackSpeed : deltaTime;
    Tween.updateAll(tweenDelta);

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
    this.timelinePanel.updateTimeIndicator(this.currentTime);
  }

  _processEvent(event) {
    // Add to timeline
    this.timelinePanel.addEvent(event);

    // Update stack
    this.stackViz.processEvent(event);

    // Highlight current line
    if (event.type === 'call') {
      this.codePanel.highlightLine(event.lineno);
    } else if (event.type === 'return') {
      // On return, highlight the calling line if stack exists
      const currentStack = this.trace.getStackAt(this.currentTime);
      if (currentStack.length > 0) {
        this.codePanel.highlightLine(currentStack[currentStack.length - 1].line);
      } else {
        this.codePanel.highlightLine(null);
      }
    }
  }

  _rebuildState() {
    // Rebuild state at current time (for seeking)
    this.stackViz.clear();
    this.codePanel.reset();
    this.timelinePanel.reset();

    const stack = this.trace.getStackAt(this.currentTime);
    this.stackViz.updateToMatch(stack);

    // Add all events up to current time to timeline
    const events = this.trace.getEventsUntil(this.currentTime);
    events.forEach(event => this.timelinePanel.addEvent(event));

    // Highlight current line
    if (stack.length > 0) {
      this.codePanel.highlightLine(stack[stack.length - 1].line);
    }

    this.timelinePanel.updateTimeIndicator(this.currentTime);

    // Reset event index to current position
    this.eventIndex = events.length;
  }
}

// Initialize
(async () => {
  const app = new Application();
  await app.init({
    background: '#FAFAFA',  // Light theme
    resizeTo: window,
    antialias: true,
    resolution: window.devicePixelRatio || 2,  // Crisp rendering on high-DPI displays
    autoDensity: true,  // Automatically adjust canvas size for pixel density
  });

  document.querySelector('#app').appendChild(app.canvas);

  new ExecutionVisualization(app);
})();
