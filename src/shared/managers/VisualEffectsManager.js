import { TIMINGS } from '../config.js';
import { anim } from '../utils/DOMAnimationUtils.js';

export class VisualEffectsManager {
  constructor(container) {
    this.container = container;
    this.flyingAnimationInProgress = false;
    
    // Create flash overlay
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.className = 'flash-overlay';
    this.container.appendChild(this.flashOverlay);
  }

  isAnimating() {
    return this.flyingAnimationInProgress;
  }

  triggerSamplingEffect(stackViz, samplingPanel, currentTime, trace) {
    if (this.flyingAnimationInProgress) return;

    const stack = trace.getStackAt(currentTime);

    if (stack.length === 0) {
      samplingPanel.addSample(stack);
      return;
    }

    this.flyingAnimationInProgress = true;
    stackViz.flashAll();

    // Create the clone for animation
    const clone = stackViz.createStackClone(document.body);
    const targetPosition = samplingPanel.getTargetPosition();

    // Animate the flash overlay
    this._animateFlash();

    // Animate the flying stack
    this._animateFlyingStack(clone, targetPosition, () => {
        samplingPanel.showImpactEffect(targetPosition);
        clone.remove();

        // Add sample after animation lands
        const currentStack = trace.getStackAt(currentTime);
        samplingPanel.addSample(currentStack);
        this.flyingAnimationInProgress = false;
    });
  }

  _animateFlash() {
     anim.to(this.flashOverlay, { opacity: 0.1 }, 0).onfinish = () => {
         anim.to(this.flashOverlay, { opacity: 0 }, 150, 'easeOutQuad');
     };
  }

  _animateFlyingStack(clone, targetPosition, onComplete) {
    const rect = clone.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    // Use WAAPI via AnimationManager
    // We want to translate from 0,0 (current fixed pos) to the delta
    const deltaX = targetPosition.x - startX;
    const deltaY = targetPosition.y - startY;

    // We can use the anim.to helper which handles transforms nicely
    // Initial state is already set by CSS, but let's be explicit if needed
    // logic from original main.js:
    /*
     clone.animate([
       { transform: 'translate(0, 0) scale(1)', opacity: 1 },
       { transform: `translate(${targetPosition.x - startX}px, ${targetPosition.y - startY}px) scale(0.3)`, opacity: 0.6 }
     ]...)
    */

    anim.to(clone, {
        x: deltaX,
        y: deltaY,
        scale: 0.3,
        opacity: 0.6
    }, TIMINGS.sampleToFlame, 'easeOutCubic', onComplete);
  }
}
