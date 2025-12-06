import { Application } from 'pixi.js';
import { DEMO_FIBONACCI, DEMO_SIMPLE } from '../shared/data/demoData.js';
import { ExecutionTrace } from '../shared/models/ExecutionTrace.js';
import { CodePanel } from '../shared/components/CodePanel.js';
import { StackVisualization } from '../shared/components/StackVisualization.js';
import { TimelinePanel } from '../shared/components/TimelinePanel.js';
import { ControlPanel } from '../shared/components/ControlPanel.js';
import { ProfilerGate } from './ProfilerGate.js';
import { Tween } from '../shared/utils/AnimationUtils.js';
import { TIMINGS } from '../shared/config.js';

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
    
    // Tracing specific state
    this.profilerLag = 0; // Accumulated overhead delay in ms
    this.profilerData = {}; // Key: "func:file", Value: { ncalls, tottime, cumtime }
    this.activeProfilerStack = []; // [{ key, startTime, childrenTime }]

    // Calculate layout
    this.width = app.screen.width;
    this.height = app.screen.height - 100; // Leave space for controls

    // Adjusted layout for Gate
    const codePanelWidth = this.width * 0.3;
    const gateWidth = 100;
    const stackPanelWidth = this.width * 0.4;
    const timelinePanelWidth = this.width - codePanelWidth - gateWidth - stackPanelWidth;

    // Create components
    this.codePanel = new CodePanel(
      this.trace.source,
      codePanelWidth,
      this.height
    );

    // Profiler Gate (Between Code and Stack)
    this.profilerGate = new ProfilerGate(gateWidth, this.height);
    this.profilerGate.position.set(codePanelWidth, 0);
    app.stage.addChild(this.profilerGate);

    this.stackViz = new StackVisualization();
    this.stackViz.position.set(codePanelWidth + gateWidth + 20, 50);
    app.stage.addChild(this.stackViz);

    this.timelinePanel = new TimelinePanel(
      timelinePanelWidth - 20,
      this.height,
      this.trace.duration
    );
    this.timelinePanel.position.set(codePanelWidth + gateWidth + stackPanelWidth, 0);
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
    this.profilerLag = 0;
    this.profilerData = {};
    this.activeProfilerStack = [];
    this.isPlaying = false;
    this.stackViz.clear();
    this.codePanel.reset();
    this.timelinePanel.reset();
    this.profilerGate.reset();
    this.controls.updateTimeDisplay(0, this.trace.duration);
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  seek(progress) {
    this.currentTime = progress * this.trace.duration;
    this.eventIndex = 0;
    this.profilerLag = 0;
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

    if (!this.isPlaying) {
      this.controls.updateTimeDisplay(this.currentTime, this.trace.duration);
      return;
    }

    // Handle Profiler Lag (Overhead)
    if (this.profilerLag > 0) {
        // Consume lag
        // We want the lag to pause the *execution time*, but we still want real time to pass
        // so the user sees the pause.
        // The amount of lag consumed per frame depends on playback speed?
        // If playback speed is 1x, we consume 1ms of lag per 1ms of real time.
        // If playback speed is 0.1x, we consume 0.1ms of lag per 1ms of real time?
        // No, lag is "real time" delay.
        // Let's say lag is 100ms. We want the visualization to pause for 100ms * (1/speed)?
        // Or is lag defined in "execution time"?
        // The plan says "Add 5ms delay per hook event".
        // If we are running at 0.1x speed, 5ms of execution time takes 50ms of real time.
        // So we should just subtract deltaTime * playbackSpeed from lag?
        // No, if we want to simulate "CPU busy with profiler", we should just pause `currentTime` advancement
        // until the "simulated overhead" is paid.
        
        // Let's treat `profilerLag` as "ms of execution time spent in profiler".
        // We need to spend this time.
        
        const timeToSpend = deltaTime * this.playbackSpeed;
        
        if (this.profilerLag > timeToSpend) {
            this.profilerLag -= timeToSpend;
            // Don't advance currentTime
            return;
        } else {
            // Consumed all lag, advance currentTime by remainder
            const remainder = timeToSpend - this.profilerLag;
            this.profilerLag = 0;
            this.currentTime += remainder;
        }
    } else {
        // Advance time normally
        this.currentTime += deltaTime * this.playbackSpeed;
    }

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

    // Update live stats on stack frames
    this.activeProfilerStack.forEach((frameData, index) => {
        const frame = this.stackViz.getFrame(index);
        if (frame) {
            const currentDuration = this.currentTime - frameData.startTime;
            const key = frameData.key;
            const baseStats = this.profilerData[key];
            
            // profilerData stores accumulated time from COMPLETED calls.
            // But for the current active call, we need to add the current duration.
            // However, if this function has been called before, baseStats.cumtime has value.
            // So liveCumTime = baseStats.cumtime + currentDuration.
            // Correct.
            
            const liveCumTime = baseStats.cumtime + currentDuration;
            const liveTotTime = baseStats.tottime + (currentDuration - frameData.childrenTime);
            
            frame.updateStats(baseStats.ncalls, liveTotTime, liveCumTime);
        }
    });
  }

  _processEvent(event) {
    // Add to timeline (skip line events)
    if (event.type !== 'line') {
      this.timelinePanel.addEvent(event);
      
      // Activate Profiler Hook for call/return
      this.profilerGate.activate(event.type);
      
      // Add overhead
      const overhead = TIMINGS.hookDelay; // e.g. 10ms
      this.profilerLag += overhead;
      this.profilerGate.addOverhead(overhead);
    }

    // Update Profiler Stats
    if (event.type === 'call') {
        const key = `${event.functionName}:${event.filename}`;
        if (!this.profilerData[key]) this.profilerData[key] = { ncalls: 0, tottime: 0, cumtime: 0 };
        
        this.profilerData[key].ncalls++;
        
        this.activeProfilerStack.push({
            key: key,
            startTime: this.currentTime,
            childrenTime: 0
        });
    } else if (event.type === 'return') {
        const frame = this.activeProfilerStack.pop();
        if (frame) {
            const duration = this.currentTime - frame.startTime;
            this.profilerData[frame.key].cumtime += duration;
            this.profilerData[frame.key].tottime += (duration - frame.childrenTime);
            
            if (this.activeProfilerStack.length > 0) {
                const parent = this.activeProfilerStack[this.activeProfilerStack.length - 1];
                parent.childrenTime += duration;
            }
        }
    }

    // Update stack
    this.stackViz.processEvent(event);

    // Update stack frame stats
    // We need to update the stats on the stack frames.
    // Since we just updated the data, we can iterate over the active stack and update them?
    // Or just update the top frame?
    // Actually, ncalls updates on call. cumtime/tottime update on return.
    // So on call, we update the new frame.
    // On return, we update the returning frame (which is about to disappear, so maybe not useful?)
    // But we might want to see the final stats before it pops?
    // StackVisualization pops immediately on 'return'.
    // So we should update stats BEFORE processing the event in StackViz?
    // No, StackViz.processEvent handles the push/pop.
    
    // If 'call', StackViz pushes a frame. We can then get it and update stats.
    if (event.type === 'call') {
        const key = `${event.functionName}:${event.filename}`;
        const stats = this.profilerData[key];
        // The frame was just pushed, so it's at the top.
        const frameIndex = this.stackViz.getStackHeight() - 1;
        const frame = this.stackViz.getFrame(frameIndex);
        if (frame) {
            frame.updateStats(stats.ncalls, stats.tottime, stats.cumtime);
        }
    }
    // If 'return', the frame is popped. We can't update it easily unless we do it before pop.
    // But the stats are updated on return.
    // Maybe we don't need to show the final stats on the popping frame, 
    // but we should update the stats for the *next* time it appears?
    // Or maybe we want to see the stats accumulating on the frame while it's active?
    // cumtime increases while active. tottime increases while active (if not in child).
    // To show "live" timer, we would need to update in the `update` loop.
    // That would be cool!
    
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

  _rebuildState() {
    this.stackViz.clear();
    this.codePanel.reset();
    this.timelinePanel.reset();
    this.profilerGate.reset();
    
    // Reset profiler state
    this.profilerData = {};
    this.activeProfilerStack = [];

    // Replay ALL events up to current time to rebuild stats
    const events = this.trace.getEventsUntil(this.currentTime);
    
    events.forEach(event => {
        // Update Profiler Stats
        if (event.type === 'call') {
            const key = `${event.functionName}:${event.filename}`;
            if (!this.profilerData[key]) this.profilerData[key] = { ncalls: 0, tottime: 0, cumtime: 0 };
            this.profilerData[key].ncalls++;
            this.activeProfilerStack.push({
                key: key,
                startTime: event.timestamp,
                childrenTime: 0
            });
        } else if (event.type === 'return') {
            const frame = this.activeProfilerStack.pop();
            if (frame) {
                const duration = event.timestamp - frame.startTime;
                this.profilerData[frame.key].cumtime += duration;
                this.profilerData[frame.key].tottime += (duration - frame.childrenTime);
                if (this.activeProfilerStack.length > 0) {
                    const parent = this.activeProfilerStack[this.activeProfilerStack.length - 1];
                    parent.childrenTime += duration;
                }
            }
        }
        
        // Add to timeline (skip line events)
        if (event.type !== 'line') {
            this.timelinePanel.addEvent(event);
        }
    });

    // Update Stack Viz to match current state
    const stack = this.trace.getStackAt(this.currentTime);
    this.stackViz.updateToMatch(stack);
    
    // Update stats on the visual stack frames
    this.activeProfilerStack.forEach((frameData, index) => {
        const frame = this.stackViz.getFrame(index);
        if (frame) {
            const currentDuration = this.currentTime - frameData.startTime;
            const key = frameData.key;
            const baseStats = this.profilerData[key];
            const liveCumTime = baseStats.cumtime + currentDuration;
            const liveTotTime = baseStats.tottime + (currentDuration - frameData.childrenTime);
            frame.updateStats(baseStats.ncalls, liveTotTime, liveCumTime);
        }
    });

    // Highlight current line
    if (stack.length > 0) {
      this.codePanel.highlightLine(stack[stack.length - 1].line);
    }

    this.timelinePanel.updateTimeIndicator(this.currentTime);
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
