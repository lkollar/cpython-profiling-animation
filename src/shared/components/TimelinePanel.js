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
    this.bg.beginFill(COLORS.panelBg);
    this.bg.drawRect(0, 0, width, height);
    this.bg.endFill();
    this.addChild(this.bg);

    // Title
    const title = new PIXI.Text('Timeline', {
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize: 14,
      fill: COLORS.textSecondary,
      fontWeight: 'bold',
      resolution: 2,
    });
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

  _drawAxis() {
    const axisY = this.height - 60;
    const axisWidth = this.width - 40;

    // Horizontal line
    const axis = new PIXI.Graphics();
    axis.lineStyle(2, COLORS.borderLight);
    axis.moveTo(0, axisY);
    axis.lineTo(axisWidth, axisY);
    this.timelineContainer.addChild(axis);

    // Time labels
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
      const x = (i / numLabels) * axisWidth;
      const time = (i / numLabels) * this.duration;

      // Tick mark
      axis.moveTo(x, axisY - 5);
      axis.lineTo(x, axisY + 5);

      // Label
      const label = new PIXI.Text(`${time.toFixed(0)}ms`, {
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 10,
        fill: COLORS.textDim,
        resolution: 2,
      });
      label.anchor.set(0.5, 0);
      label.position.set(x, axisY + 8);
      this.timelineContainer.addChild(label);
    }
  }

  addEvent(event) {
    const axisY = this.height - 60;
    const axisWidth = this.width - 40;
    const x = (event.timestamp / this.duration) * axisWidth;

    // Event marker
    const marker = new PIXI.Graphics();

    if (event.type === 'call') {
      // Upward tick for calls
      marker.lineStyle(2, COLORS.success);
      marker.moveTo(x, axisY);
      marker.lineTo(x, axisY - 15);
    } else {
      // Downward tick for returns
      marker.lineStyle(2, COLORS.info);
      marker.moveTo(x, axisY);
      marker.lineTo(x, axisY + 15);
    }

    this.timelineContainer.addChild(marker);
    this.events.push({ event, marker });
  }

  updateTimeIndicator(currentTime) {
    const axisY = this.height - 60;
    const axisWidth = this.width - 40;
    const x = (currentTime / this.duration) * axisWidth;

    this.timeIndicator.clear();
    this.timeIndicator.lineStyle(2, COLORS.active);
    this.timeIndicator.moveTo(x, 0);
    this.timeIndicator.lineTo(x, axisY);

    // Time label
    if (this.timeLabel) this.timeLabel.destroy();
    this.timeLabel = new PIXI.Text(`${currentTime.toFixed(0)}ms`, {
      fontFamily: 'Monaco, Consolas, monospace',
      fontSize: 11,
      fill: COLORS.active,
      fontWeight: 'bold',
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
