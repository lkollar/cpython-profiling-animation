import { getFunctionColor } from '../utils/ColorUtils.js';

export class DOMStackFrame {
  constructor(functionName, filename, lineno, args = null) {
    this.functionName = functionName;
    this.filename = filename;
    this.lineno = lineno;
    this.args = args;
    this.isActive = false;

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

    // Add event listeners
    this.element.addEventListener('pointerover', this._onHover.bind(this));
    this.element.addEventListener('pointerout', this._onHoverOut.bind(this));
    this.element.addEventListener('click', this._onClick.bind(this));
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

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

  flash(duration = 150) {
    this.flashElement.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration,
      easing: 'ease-out'
    });
  }

  getPosition() {
    const rect = this.element.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }
}
