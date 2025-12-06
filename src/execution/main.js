import { Application } from 'pixi.js';
import { DEMO_FIBONACCI, DEMO_SIMPLE } from '../shared/data/demoData.js';
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
    
    // Initialize with simple demo
    this.trace = new ExecutionTrace(DEMO_SIMPLE.source, DEMO_SIMPLE.trace);

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

    // Create scenario selector
    this._createScenarioSelector();
  }

  _createScenarioSelector() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.zIndex = '100';
    container.style.background = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '10px';

    const label = document.createElement('label');
    label.textContent = 'Scenario:';
    label.style.fontWeight = 'bold';
    label.style.fontFamily = 'system-ui, sans-serif';
    container.appendChild(label);

    const select = document.createElement('select');
    select.style.padding = '5px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #ccc';
    
    const options = [
      { value: 'simple', label: 'Simple Call (Non-recursive)' },
      { value: 'fibonacci', label: 'Fibonacci (Recursive)' }
    ];

    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });

    select.value = 'simple'; // Default

    select.addEventListener('change', (e) => {
      if (e.target.value === 'simple') {
        this.loadTrace(DEMO_SIMPLE);
      } else {
        this.loadTrace(DEMO_FIBONACCI);
      }
    });

    container.appendChild(select);
    document.body.appendChild(container);
  }

  loadTrace(demoData) {
    this.pause();
    this.trace = new ExecutionTrace(demoData.source, demoData.trace);
    
    this.codePanel.updateSource(this.trace.source);
    this.timelinePanel.setDuration(this.trace.duration);
    this.controls.setDuration(this.trace.duration);
    
    this.reset();
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
    // Update tweens at real-time speed, independent of playback speed
    // This ensures animations (like stack frames sliding) look smooth even at slow playback speeds
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
    this.timelinePanel.updateTimeIndicator(this.currentTime);
  }

  _processEvent(event) {
    // Add to timeline (skip line events to avoid clutter)
    if (event.type !== 'line') {
      this.timelinePanel.addEvent(event);
    }

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
    } else if (event.type === 'line') {
      this.codePanel.highlightLine(event.lineno);
    }
  }

  _rebuildState() {
    // Rebuild state at current time (for seeking)
    this.stackViz.clear();
    this.codePanel.reset();
    this.timelinePanel.reset();

    const stack = this.trace.getStackAt(this.currentTime);
    this.stackViz.updateToMatch(stack);

    // Add all events up to current time to timeline (excluding line events)
    const events = this.trace.getEventsUntil(this.currentTime);
    events.forEach(event => {
      if (event.type !== 'line') {
        this.timelinePanel.addEvent(event);
      }
    });

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
