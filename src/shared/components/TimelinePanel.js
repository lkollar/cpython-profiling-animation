import * as PIXI from 'pixi.js';
import { COLORS } from '../config.js';

export class TimelinePanel extends PIXI.Container {
  constructor(width, height, duration) {
    super();

    this.width = width;
    this.height = height;
    this.duration = duration;  // Total duration in ms
    this.events = [];

    // Background
    this.bg = new PIXI.Graphics();
    this.bg.rect(0, 0, width, height);
    this.bg.fill(COLORS.panelBg);
    this.addChild(this.bg);

    // Title
    const title = new PIXI.Text({
      text: 'Timeline',
      style: {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 14,
        fill: COLORS.textSecondary,
        fontWeight: 'bold',
      }
    });
    title.resolution = 2;
    title.position.set(12, 8);
    this.addChild(title);

    // Timeline container
    this.timelineContainer = new PIXI.Container();
    this.timelineContainer.position.set(20, 40);
    this.addChild(this.timelineContainer);

    // Draw timeline axis
    this._drawAxis();

    // Current time indicator
    this.timeIndicator = new PIXI.Graphics();
    this.timelineContainer.addChild(this.timeIndicator);
  }

  setDuration(duration) {
    this.duration = duration;
    this.timelineContainer.removeChildren();
    this._drawAxis();
    this.timeIndicator = new PIXI.Graphics();
    this.timelineContainer.addChild(this.timeIndicator);
    this.reset();
  }

  _drawAxis() {
    const axisY = this.height - 60;
    const axisWidth = this.width - 40;

    // Horizontal line
    const axis = new PIXI.Graphics();
    axis.moveTo(0, axisY);
    axis.lineTo(axisWidth, axisY);
    axis.stroke({ width: 2, color: COLORS.borderLight });
    this.timelineContainer.addChild(axis);

    // Time labels
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
      const x = (i / numLabels) * axisWidth;
      const time = (i / numLabels) * this.duration;

      // Tick mark
      axis.moveTo(x, axisY - 5);
      axis.lineTo(x, axisY + 5);
      axis.stroke({ width: 2, color: COLORS.borderLight });

      // Label
      const label = new PIXI.Text({
        text: `${time.toFixed(0)}ms`,
        style: {
          fontFamily: 'SF Mono, Monaco, Consolas, monospace',
          fontSize: 10,
          fill: COLORS.textDim,
        }
      });
      label.resolution = 2;
      label.anchor.set(0.5, 0);
      label.position.set(x, axisY + 8);
      this.timelineContainer.addChild(label);
    }
    // Apply stroke to all paths drawn so far
    // Wait, if I call stroke() multiple times?
    // In v8, `stroke()` strokes the *current* path.
    // So I should probably move `axis.stroke` to after drawing all lines?
    // Or call it after each segment?
    // Let's try calling it once at the end of drawing lines.
  }

  addEvent(event) {
    const axisY = this.height - 60;
    const axisWidth = this.width - 40;
    const x = (event.timestamp / this.duration) * axisWidth;

    // Event marker
    const marker = new PIXI.Graphics();

    if (event.type === 'call') {
      // Upward tick for calls
      marker.moveTo(x, axisY);
      marker.lineTo(x, axisY - 15);
      marker.stroke({ width: 2, color: COLORS.success });
    } else {
      // Downward tick for returns
      marker.moveTo(x, axisY);
      marker.lineTo(x, axisY + 15);
      marker.stroke({ width: 2, color: COLORS.info });
    }

    this.timelineContainer.addChild(marker);
    this.events.push({ event, marker });
  }

  updateTimeIndicator(currentTime) {
    const axisY = this.height - 60;
    const axisWidth = this.width - 40;
    const x = (currentTime / this.duration) * axisWidth;

    this.timeIndicator.clear();
    this.timeIndicator.moveTo(x, 0);
    this.timeIndicator.lineTo(x, axisY);
    this.timeIndicator.stroke({ width: 2, color: COLORS.active });

    // Time label
    if (this.timeLabel) this.timeLabel.destroy();
    this.timeLabel = new PIXI.Text({
      text: `${currentTime.toFixed(0)}ms`,
      style: {
        fontFamily: 'Monaco, Consolas, monospace',
        fontSize: 11,
        fill: COLORS.active,
        fontWeight: 'bold',
      }
    });
    this.timeLabel.anchor.set(0.5, 1);
    this.timeLabel.position.set(x, -5);
    this.timelineContainer.addChild(this.timeLabel);
  }

  reset() {
    this.events.forEach(({ marker }) => marker.destroy());
    this.events = [];
    this.timeIndicator.clear();
    if (this.timeLabel) {
      this.timeLabel.destroy();
      this.timeLabel = null;
    }
  }
}
