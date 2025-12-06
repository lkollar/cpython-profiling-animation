import * as PIXI from 'pixi.js';
import { COLORS, TIMINGS } from '../shared/config.js';
import { Tween } from '../shared/utils/AnimationUtils.js';

export class ProfilerGate extends PIXI.Container {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
    this.overheadTotal = 0;

    // --- Visual Structure: The Tollbooth ---
    
    // 1. The Booth (Left side)
    this.booth = new PIXI.Graphics();
    this.booth.roundRect(10, height/2 - 40, 40, 80, 4);
    this.booth.fill({ color: COLORS.textSecondary });
    this.addChild(this.booth);

    // 2. The Barrier Arm (Pivot at booth)
    this.barrier = new PIXI.Graphics();
    // Draw arm: long red/white striped bar
    this.barrier.rect(0, -5, width - 60, 10);
    this.barrier.fill({ color: COLORS.overheadHigh });
    this.barrier.position.set(50, height/2); // Pivot point
    this.barrier.rotation = 0; // Horizontal (Closed)
    this.addChild(this.barrier);

    // 3. Status Light (On the booth)
    this.light = new PIXI.Graphics();
    this.light.circle(30, height/2 - 20, 8);
    this.light.fill({ color: COLORS.error }); // Red initially
    this.addChild(this.light);

    // 4. Overhead Counter (Floating above)
    this.overheadLabel = new PIXI.Text({
      text: '+0ms',
      style: {
        fontFamily: 'Monaco, Consolas, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: COLORS.overheadHigh,
        align: 'center',
      }
    });
    this.overheadLabel.anchor.set(0.5);
    this.overheadLabel.position.set(width/2, height/2 - 40);
    this.overheadLabel.alpha = 0;
    this.addChild(this.overheadLabel);

    // 5. Total Overhead (At bottom)
    this.totalLabel = new PIXI.Text({
      text: 'Total Overhead: 0ms',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fill: COLORS.textSecondary,
        align: 'center',
      }
    });
    this.totalLabel.anchor.set(0.5, 0);
    this.totalLabel.position.set(width/2, height - 30);
    this.addChild(this.totalLabel);
  }

  // Blocking Animation Sequence
  // Returns a Promise that resolves when the gate opens
  async blockAndPass(type) {
    // 1. STOP! (Red light, Barrier Down)
    this.light.fill({ color: COLORS.error });
    this.barrier.rotation = 0; // Ensure closed
    
    // Show overhead popup
    this.overheadLabel.text = `+${TIMINGS.hookDelay}ms`;
    this.overheadLabel.alpha = 1;
    this.overheadLabel.position.y = this.height/2 - 40;
    
    // Float up
    Tween.to(this.overheadLabel.position, { y: this.height/2 - 80 }, 600);
    Tween.to(this.overheadLabel, { alpha: 0 }, 600);

    // Update total
    this.overheadTotal += TIMINGS.hookDelay;
    this.totalLabel.text = `Total Overhead: ${this.overheadTotal.toFixed(0)}ms`;

    // Wait for "Processing" (The Lag)
    await new Promise(r => setTimeout(r, 400)); // Artificial delay for visibility

    // 2. OPEN! (Green light, Barrier Up)
    this.light.fill({ color: COLORS.success });
    
    // Animate barrier opening
    await new Promise(resolve => {
        Tween.to(this.barrier, { rotation: -Math.PI / 2 }, 200, 'easeOutBack', resolve);
    });

    // 3. Pass through (Wait a bit)
    await new Promise(r => setTimeout(r, 100));

    // 4. CLOSE! (Reset)
    Tween.to(this.barrier, { rotation: 0 }, 200, 'easeOutBounce');
    this.light.fill({ color: COLORS.error });
  }

  reset() {
    this.overheadTotal = 0;
    this.totalLabel.text = 'Total Overhead: 0ms';
    this.barrier.rotation = 0;
    this.light.fill({ color: COLORS.error });
  }
}
