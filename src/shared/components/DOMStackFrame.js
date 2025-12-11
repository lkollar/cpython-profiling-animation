import { LAYOUT } from '../config.js';
import { Tween } from '../utils/DOMAnimationUtils.js';
import { getFunctionColor } from '../utils/ColorUtils.js';

export class DOMStackFrame {
  constructor(functionName, filename, lineno, args = null) {
    this.functionName = functionName;
    this.filename = filename;
    this.lineno = lineno;
    this.args = args;
    this.isActive = false;

    // Determine color based on function name
    this.color = getFunctionColor(functionName);

    // Create DOM element
    this.element = document.createElement('div');
    this.element.className = 'stack-frame';
    this.element.dataset.function = functionName;

    // Background
    const bg = document.createElement('div');
    bg.className = 'stack-frame-bg';
    bg.style.backgroundColor = this.color;
    this.element.appendChild(bg);

    // Text
    this.textElement = document.createElement('span');
    this.textElement.className = 'stack-frame-text';
    this.textElement.textContent = `${functionName}:${lineno}`;
    this.element.appendChild(this.textElement);

    // Flash overlay
    this.flashElement = document.createElement('div');
    this.flashElement.className = 'stack-frame-flash';
    this.element.appendChild(this.flashElement);

    // Set dimensions
    this.element.style.width = `${LAYOUT.frameWidth}px`;
    this.element.style.height = `${LAYOUT.frameHeight}px`;

    // Add event listeners
    this.element.addEventListener('pointerover', this._onHover.bind(this));
    this.element.addEventListener('pointerout', this._onHoverOut.bind(this));
    this.element.addEventListener('click', this._onClick.bind(this));
  }

  destroy() {
    Tween.killTweensOf(this.element);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  // Update the line number displayed
  updateLine(lineno) {
    this.lineno = lineno;
    this.textElement.textContent = `${this.functionName}:${lineno}`;
  }

  setActive(isActive) {
    if (this.isActive === isActive) return;
    this.isActive = isActive;

    const bg = this.element.querySelector('.stack-frame-bg');
    if (isActive) {
      bg.style.opacity = '1.0';
    } else {
      bg.style.opacity = '0.9';
    }
  }

  _onHover() {
    const bg = this.element.querySelector('.stack-frame-bg');
    bg.style.opacity = '0.8';
  }

  _onHoverOut() {
    const bg = this.element.querySelector('.stack-frame-bg');
    bg.style.opacity = this.isActive ? '1.0' : '0.9';
  }

  _onClick() {
    // Emit custom event for parent components to handle
    this.element.dispatchEvent(new CustomEvent('stackframe-click', {
      bubbles: true,
      detail: {
        functionName: this.functionName,
        filename: this.filename,
        lineno: this.lineno,
        args: this.args
      }
    }));
  }

  animateIn(targetY, duration = 500) {
    // Start from +50px below target, faded out
    this.element.style.transform = `translate(0px, ${targetY + 50}px)`;
    this.element.style.opacity = '0';

    // Animate to target position and fade in
    Tween.to(this.element, {
      position: { y: targetY },
      alpha: 1
    }, duration, 'easeOutCubic');
  }

  animateOut(duration = 200, onComplete = null) {
    // Animate to +30px below current position and fade out
    const currentTransform = getComputedStyle(this.element).transform;
    const matrix = new DOMMatrix(currentTransform);

    Tween.to(this.element, {
      position: { y: matrix.m42 + 30 },
      alpha: 0
    }, duration, 'easeInQuad', () => {
      this.destroy();
      if (onComplete) onComplete();
    });
  }

  // Flash effect for sampling profiler
  flash(duration = 150) {
    this.flashElement.style.opacity = '1';
    Tween.to(this.flashElement, { alpha: 0 }, duration, 'easeOutQuad');
  }

  // Set position directly (no animation)
  setPosition(x, y) {
    this.element.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Get current position
  getPosition() {
    const transform = getComputedStyle(this.element).transform;
    if (transform === 'none') return { x: 0, y: 0 };

    const matrix = new DOMMatrix(transform);
    return { x: matrix.m41, y: matrix.m42 };
  }
}