import { DOMStackFrame } from './DOMStackFrame.js';
import { DOMFlyingStackFrame } from './DOMFlyingStackFrame.js';
import { LAYOUT, TIMINGS } from '../config.js';
import { Tween } from '../utils/DOMAnimationUtils.js';

export class DOMStackVisualization {
  constructor() {
    this.frames = [];  // Array of DOMStackFrame objects
    this.frameSpacing = LAYOUT.frameSpacing;

    // Create container element
    this.element = document.createElement('div');
    this.element.className = 'stack-visualization';

    // Set initial styles
    this.element.style.position = 'absolute';
    this.element.style.width = `${LAYOUT.frameWidth}px`;
    this.element.style.height = '0px'; // Will grow as needed
  }

  // Process execution events to maintain stack state
  processEvent(event) {
    if (event.type === 'call') {
      this.pushFrame(event.functionName, event.filename, event.lineno, event.args);
    } else if (event.type === 'return') {
      this.popFrame();
    } else if (event.type === 'line') {
      this.updateTopFrameLine(event.lineno);
    }
  }

  // Update the line number of the top frame
  updateTopFrameLine(lineno) {
    if (this.frames.length > 0) {
      const topFrame = this.frames[this.frames.length - 1];
      topFrame.updateLine(lineno);
    }
  }

  // Push a new frame onto the stack
  pushFrame(functionName, filename, lineno, args = null) {
    // Deactivate current top frame
    if (this.frames.length > 0) {
      this.frames[this.frames.length - 1].setActive(false);
    }

    const frame = new DOMStackFrame(functionName, filename, lineno, args);
    frame.setActive(true); // New frame is active

    // Calculate position (stack grows upward, but we render bottom-to-top)
    const targetY = this.frames.length * (LAYOUT.frameHeight + this.frameSpacing);

    // Add to container and array
    this.element.appendChild(frame.element);
    this.frames.push(frame);

    // Animate in
    frame.animateIn(targetY, TIMINGS.frameSlideIn);

    // Adjust container height
    this._adjustContainerPosition();
  }

  // Pop the top frame from the stack
  popFrame() {
    if (this.frames.length === 0) return;

    const frame = this.frames.pop();
    frame.animateOut(TIMINGS.frameSlideOut, () => {
      this._repositionFrames();
    });

    // Activate the new top frame
    if (this.frames.length > 0) {
      this.frames[this.frames.length - 1].setActive(true);
    }
  }

  // Clear all frames
  clear() {
    // Remove all frame elements
    this.frames.forEach(frame => {
      frame.destroy();
    });
    this.frames = [];

    // Clear container
    this.element.innerHTML = '';
  }

  // Get current stack height
  getStackHeight() {
    return this.frames.length;
  }

  // Get frame at index (0 = bottom of stack)
  getFrame(index) {
    return this.frames[index];
  }

  // Highlight all frames (for sampling flash effect)
  flashAll() {
    this.frames.forEach(frame => frame.flash());
  }

  // Create flying frame duplicates for animation
  // Returns array of DOMFlyingStackFrame instances
  createFlyingFrames(container) {
    const flyingFrames = [];

    // Get container position
    const containerRect = container.getBoundingClientRect();

    this.frames.forEach(frame => {
      // Create flying duplicate
      const flying = new DOMFlyingStackFrame(frame);

      // Use frame's actual bounding rect for precise positioning
      const frameRect = frame.element.getBoundingClientRect();
      const offsetX = frameRect.left - containerRect.left;
      const offsetY = frameRect.top - containerRect.top;

      flying.setPosition(offsetX, offsetY);

      // Add to provided container
      container.appendChild(flying.element);
      flyingFrames.push(flying);
    });

    return flyingFrames;
  }

  // Update stack to match a given state
  updateToMatch(targetStack) {
    // Simple approach: compare stacks and adjust
    // More sophisticated approach would minimize changes

    // For now, rebuild entire stack
    this.clear();

    targetStack.forEach(({ func, file, line, args }, index) => {
      const frame = new DOMStackFrame(func, file, line, args);
      const y = this.frames.length * (LAYOUT.frameHeight + this.frameSpacing);
      frame.setPosition(0, y);

      // Set active state for the top frame
      if (index === targetStack.length - 1) {
        frame.setActive(true);
      }

      this.element.appendChild(frame.element);
      this.frames.push(frame);
    });

    this._adjustContainerPosition();
  }

  // Adjust container position to keep stack centered/visible
  _adjustContainerPosition() {
    // Update container height based on number of frames
    const totalHeight = this.frames.length * (LAYOUT.frameHeight + this.frameSpacing);
    this.element.style.height = `${totalHeight}px`;

    // If stack is tall, we might want to scroll or adjust position
    // For now, keep it simple - stack grows from bottom
  }

  // Reposition all frames (useful after pop)
  _repositionFrames() {
    this.frames.forEach((frame, index) => {
      const targetY = index * (LAYOUT.frameHeight + this.frameSpacing);

      const currentPos = frame.getPosition();
      if (Math.abs(currentPos.y - targetY) > 0.5) {
        Tween.to(frame.element, {
          position: { y: targetY }
        }, 200, 'easeOutQuad');
      }
    });

    this._adjustContainerPosition();
  }
}