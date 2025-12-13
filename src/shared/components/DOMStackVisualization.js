import { DOMStackFrame } from './DOMStackFrame.js';
import { DOMFlyingStackFrame } from './DOMFlyingStackFrame.js';
import { LAYOUT, TIMINGS } from '../config.js';

export class DOMStackVisualization {
  constructor() {
    this.frames = [];
    this.frameSpacing = LAYOUT.frameSpacing;

    // Create container element
    this.element = document.createElement('div');
    this.element.className = 'stack-visualization';
  }

  processEvent(event) {
    if (event.type === 'call') {
      this.pushFrame(event.functionName, event.filename, event.lineno, event.args);
    } else if (event.type === 'return') {
      this.popFrame();
    } else if (event.type === 'line') {
      this.updateTopFrameLine(event.lineno);
    }
  }

  updateTopFrameLine(lineno) {
    if (this.frames.length > 0) {
      const topFrame = this.frames[this.frames.length - 1];
      topFrame.updateLine(lineno);
    }
  }

  pushFrame(functionName, filename, lineno, args = null) {
    // Deactivate current top frame
    if (this.frames.length > 0) {
      this.frames[this.frames.length - 1].setActive(false);
    }

    const frame = new DOMStackFrame(functionName, filename, lineno, args);
    frame.setActive(true);

    // Add to container and array
    this.element.appendChild(frame.element);
    this.frames.push(frame);

    // Trigger animation
    requestAnimationFrame(() => {
      frame.element.classList.add('visible');
    });
  }

  popFrame() {
    if (this.frames.length === 0) return;

    const frame = this.frames.pop();
    frame.element.classList.remove('visible');

    setTimeout(() => {
      frame.destroy();
    }, 300);

    // Activate the new top frame
    if (this.frames.length > 0) {
      this.frames[this.frames.length - 1].setActive(true);
    }
  }

  clear() {
    this.frames.forEach(frame => {
      frame.destroy();
    });
    this.frames = [];
    this.element.innerHTML = '';
  }

  getStackHeight() {
    return this.frames.length;
  }

  getFrame(index) {
    return this.frames[index];
  }

  flashAll() {
    this.frames.forEach(frame => frame.flash());
  }

  createFlyingFrames(container) {
    const flyingFrames = [];

    this.frames.forEach(frame => {
      const flying = new DOMFlyingStackFrame(frame);

      // Get frame's actual screen position (center of frame)
      const frameRect = frame.element.getBoundingClientRect();
      const centerX = frameRect.left + frameRect.width / 2 - 90; // 90 = half of flying frame width
      const centerY = frameRect.top;
      flying.setPosition(centerX, centerY);

      container.appendChild(flying.element);
      flyingFrames.push(flying);
    });

    return flyingFrames;
  }

  updateToMatch(targetStack) {
    this.clear();

    targetStack.forEach(({ func, file, line, args }, index) => {
      const frame = new DOMStackFrame(func, file, line, args);

      if (index === targetStack.length - 1) {
        frame.setActive(true);
      }

      this.element.appendChild(frame.element);
      this.frames.push(frame);

      // Make visible immediately when rebuilding
      frame.element.classList.add('visible');
    });
  }
}
