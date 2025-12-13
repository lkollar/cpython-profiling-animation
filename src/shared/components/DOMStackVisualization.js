import { DOMStackFrame } from './DOMStackFrame.js';
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

  createStackClone(container) {
    const clone = this.element.cloneNode(true);
    clone.className = 'stack-visualization flying-clone';

    const rect = this.element.getBoundingClientRect();
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '1000';

    container.appendChild(clone);
    return clone;
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
