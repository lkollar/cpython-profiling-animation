import { DOMStackFrame } from './DOMStackFrame.js';
import { LAYOUT } from '../config.js';

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
    // Shallow clone of container to keep classes/styles but discard children (including dying frames)
    const clone = this.element.cloneNode(false);
    clone.className = 'stack-visualization flying-clone';

    const rect = this.element.getBoundingClientRect();
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '1000';

    // Clone only active frames and force their visibility
    this.frames.forEach(frame => {
        const frameClone = frame.element.cloneNode(true);
        
        // Force visible state to avoid race conditions with entry animations
        frameClone.classList.add('visible');
        frameClone.style.opacity = '1';
        frameClone.style.transform = 'translateY(0)';
        frameClone.style.transition = 'none';
        
        clone.appendChild(frameClone);
    });

    container.appendChild(clone);
    return clone;
  }

  updateToMatch(targetStack) {
    // 1. Remove excess frames
    while (this.frames.length > targetStack.length) {
      this.popFrame();
    }

    // 2. Update existing and add new
    targetStack.forEach(({ func, file, line, args }, index) => {
      if (index < this.frames.length) {
        // Update existing frame if needed
        const frame = this.frames[index];
        if (frame.functionName !== func || frame.filename !== file) {
             frame.updateLine(line);
        }

        // Ensure active state for top frame
        if (index === targetStack.length - 1) {
          frame.setActive(true);
        } else {
            frame.setActive(false);
        }
      } else {
        // Add new frame
        this.pushFrame(func, file, line, args);
        // pushFrame handles active state
      }
    });

    // Ensure active state if stack became shorter
    if (this.frames.length > 0) {
        this.frames[this.frames.length - 1].setActive(true);
    }
  }
}
