// DOM-based control panel for playback controls

import { TIMINGS } from '../config.js';

export class ControlPanel {
  constructor(container, onPlay, onPause, onReset, onSpeedChange, onSeek) {
    this.container = container;
    this.onPlay = onPlay;
    this.onPause = onPause;
    this.onReset = onReset;
    this.onSpeedChange = onSpeedChange;
    this.onSeek = onSeek;

    this.isPlaying = false;
    this.speed = TIMINGS.defaultSpeed;

    this._createControls();
  }

  _createControls() {
    // Create control panel HTML
    const panel = document.createElement('div');
    panel.id = 'control-panel';
    panel.innerHTML = `
      <div class="control-group">
        <button id="play-pause-btn" class="control-btn">▶ Play</button>
        <button id="reset-btn" class="control-btn">↻ Reset</button>
        <button id="step-btn" class="control-btn">→ Step</button>
      </div>

      <div class="control-group">
        <label>Speed:</label>
        <select id="speed-select">
          ${TIMINGS.speeds.map(s => `<option value="${s}" ${s === TIMINGS.defaultSpeed ? 'selected' : ''}>${s}x</option>`).join('')}
        </select>
      </div>

      <div class="control-group timeline-scrubber">
        <input type="range" id="timeline-scrubber" min="0" max="100" value="0" step="0.1">
        <span id="time-display">0ms</span>
      </div>
    `;

    this.container.appendChild(panel);

    // Wire up events
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.stepBtn = document.getElementById('step-btn');
    this.speedSelect = document.getElementById('speed-select');
    this.scrubber = document.getElementById('timeline-scrubber');
    this.timeDisplay = document.getElementById('time-display');

    this.playPauseBtn.addEventListener('click', () => this._togglePlayPause());
    this.resetBtn.addEventListener('click', () => this._handleReset());
    this.stepBtn.addEventListener('click', () => this._handleStep());
    this.speedSelect.addEventListener('change', (e) => this._handleSpeedChange(e));
    this.scrubber.addEventListener('input', (e) => this._handleSeek(e));
  }

  _togglePlayPause() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.playPauseBtn.textContent = '⏸ Pause';
      this.playPauseBtn.classList.add('active');
      this.onPlay();
    } else {
      this.playPauseBtn.textContent = '▶ Play';
      this.playPauseBtn.classList.remove('active');
      this.onPause();
    }
  }

  _handleReset() {
    this.isPlaying = false;
    this.playPauseBtn.textContent = '▶ Play';
    this.playPauseBtn.classList.remove('active');
    this.scrubber.value = 0;
    this.timeDisplay.textContent = '0ms';
    this.onReset();
  }

  _handleStep() {
    // Step forward by 10ms
    const currentValue = parseFloat(this.scrubber.value);
    const newValue = Math.min(100, currentValue + 1);
    this.scrubber.value = newValue;
    this._handleSeek({ target: { value: newValue } });
  }

  _handleSpeedChange(e) {
    this.speed = parseFloat(e.target.value);
    this.onSpeedChange(this.speed);
  }

  _handleSeek(e) {
    const percentage = parseFloat(e.target.value);
    this.onSeek(percentage / 100);
  }

  updateTimeDisplay(currentTime, totalTime) {
    this.timeDisplay.textContent = `${Math.floor(currentTime)}ms / ${Math.floor(totalTime)}ms`;

    // Update scrubber position
    const percentage = (currentTime / totalTime) * 100;
    this.scrubber.value = percentage;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  pause() {
    if (this.isPlaying) {
      this._togglePlayPause();
    }
  }

  destroy() {
    const panel = document.getElementById('control-panel');
    if (panel) {
      panel.remove();
    }
  }
}
