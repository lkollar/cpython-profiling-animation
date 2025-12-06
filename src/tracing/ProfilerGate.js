import * as PIXI from 'pixi.js';
import { COLORS, TIMINGS } from '../shared/config.js';
import { Tween } from '../shared/utils/AnimationUtils.js';

export class ProfilerGate extends PIXI.Container {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
    this.overheadTotal = 0;

    // Background (The "Gate" structure)
    this.bg = new PIXI.Graphics();
    // Vertical pillar
    this.bg.roundRect(width/2 - 4, 20, 8, height - 40, 4);
    this.bg.fill({ color: COLORS.borderLight });
    this.addChild(this.bg);

    // The "Checkpoint" Box (Central Hub)
    this.checkpoint = new PIXI.Container();
    this.checkpoint.position.set(width/2, 100);
    this.addChild(this.checkpoint);

    // Checkpoint visual
    this.checkpointBg = new PIXI.Graphics();
    this.checkpointBg.circle(0, 0, 30);
    this.checkpointBg.fill({ color: 0xFFFFFF });
    this.checkpointBg.stroke({ width: 3, color: COLORS.tracingAccent });
    this.checkpoint.addChild(this.checkpointBg);

    // Icon/Text inside checkpoint
    this.statusText = new PIXI.Text({
      text: 'HOOK',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: COLORS.textSecondary,
        align: 'center',
      }
    });
    this.statusText.anchor.set(0.5);
    this.checkpoint.addChild(this.statusText);

    // Overhead Counter (Floating above)
    this.overheadLabel = new PIXI.Text({
      text: '+0ms',
      style: {
        fontFamily: 'Monaco, Consolas, monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: COLORS.overheadHigh,
        align: 'center',
      }
    });
    this.overheadLabel.anchor.set(0.5);
    this.overheadLabel.position.set(width/2, 50);
    this.overheadLabel.alpha = 0; // Hidden initially
    this.addChild(this.overheadLabel);

    // Total Overhead (At bottom)
    this.totalLabel = new PIXI.Text({
      text: 'Total Overhead\n0ms',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        fill: COLORS.textSecondary,
        align: 'center',
      }
    });
    this.totalLabel.anchor.set(0.5, 0);
    this.totalLabel.position.set(width/2, height - 60);
    this.addChild(this.totalLabel);
  }

  activate(type) {
    // Clear existing reset timer
    if (this.resetTimer) clearTimeout(this.resetTimer);

    // 1. Visual "Stop" - Checkpoint turns active
    const color = type === 'call' ? COLORS.success : COLORS.info;
    
    this.checkpointBg.stroke({ width: 4, color: color });
    this.statusText.text = type.toUpperCase();
    this.statusText.style.fill = color;

    // Pulse animation
    this.checkpoint.scale.set(1.2);
    Tween.to(this.checkpoint.scale, { x: 1, y: 1, duration: 300 });

    // 2. Show Overhead Popup
    this.overheadLabel.text = `+${TIMINGS.hookDelay}ms`;
    this.overheadLabel.alpha = 1;
    this.overheadLabel.position.y = 50;
    
    // Float up and fade
    Tween.to(this.overheadLabel, { alpha: 0, duration: 800 });
    Tween.to(this.overheadLabel.position, { y: 20, duration: 800 });

    // Reset visual after delay
    this.resetTimer = setTimeout(() => {
        this.checkpointBg.stroke({ width: 3, color: COLORS.tracingAccent });
        this.statusText.text = 'HOOK';
        this.statusText.style.fill = COLORS.textSecondary;
        this.resetTimer = null;
    }, 1000);
  }

  addOverhead(ms) {
    this.overheadTotal += ms;
    this.totalLabel.text = `Total Overhead\n${this.overheadTotal.toFixed(0)}ms`;
    
    // Flash total label
    this.totalLabel.style.fill = COLORS.overheadHigh;
    setTimeout(() => {
        this.totalLabel.style.fill = COLORS.textSecondary;
    }, 200);
  }

  reset() {
    if (this.resetTimer) {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
    }
    this.overheadTotal = 0;
    this.totalLabel.text = 'Total Overhead\n0ms';
    this.statusText.text = 'HOOK';
    this.statusText.style.fill = COLORS.textSecondary;
    this.checkpointBg.stroke({ width: 3, color: COLORS.tracingAccent });
  }
}
