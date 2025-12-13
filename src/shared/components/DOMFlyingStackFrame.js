import { createBezierPath, approximatePath } from '../utils/DOMAnimationUtils.js';

export class DOMFlyingStackFrame {
  constructor(sourceFrame) {
    this.functionName = sourceFrame.functionName;
    this.lineno = sourceFrame.lineno;
    this.color = sourceFrame.color;

    // Create DOM element
    this.element = document.createElement('div');
    this.element.className = 'stack-frame flying';
    this.element.dataset.function = this.functionName;

    // Background
    const bg = document.createElement('div');
    bg.className = 'stack-frame-bg';
    bg.style.backgroundColor = this.color;
    this.element.appendChild(bg);

    // Text
    const textElement = document.createElement('span');
    textElement.className = 'stack-frame-text';
    textElement.textContent = `${this.functionName}:${this.lineno}`;
    this.element.appendChild(textElement);

    // Set dimensions to match source
    const sourceRect = sourceFrame.element.getBoundingClientRect();
    this.element.style.width = `${sourceRect.width}px`;
    this.element.style.height = `${sourceRect.height}px`;

    // Immediately make visible
    this.element.classList.add('visible');
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  animateAlongPath(path, duration, onComplete) {
    const [start, control, end] = path;
    const width = parseFloat(this.element.style.width);
    const height = parseFloat(this.element.style.height);

    // Offset to animate from center
    const offsetX = -width / 2;
    const offsetY = -height / 2;

    const adjustedPath = [
      { x: start.x + offsetX, y: start.y + offsetY },
      { x: control.x + offsetX, y: control.y + offsetY },
      { x: end.x + offsetX, y: end.y + offsetY }
    ];

    const supportsOffsetPath = CSS.supports('offset-path', 'path("M0,0")');

    if (supportsOffsetPath) {
      const svgPath = createBezierPath(adjustedPath[0], adjustedPath[1], adjustedPath[2]);

      this.element.style.transform = 'none';
      this.element.style.offsetPath = `path('${svgPath}')`;
      this.element.style.offsetRotate = '0deg';

      const animation = this.element.animate([
        { offsetDistance: '0%', opacity: 1 },
        { offsetDistance: '100%', opacity: 0.5 }
      ], {
        duration,
        easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        fill: 'forwards'
      });

      if (onComplete) {
        animation.onfinish = onComplete;
      }

      return animation;
    } else {
      const keyframes = approximatePath(adjustedPath[0], adjustedPath[1], adjustedPath[2], 20);

      const positionKeyframes = keyframes.map((point, index) => {
        const progress = index / (keyframes.length - 1);
        return {
          transform: `translate(${point.x}px, ${point.y}px)`,
          opacity: 1 - progress * 0.5,
          offset: progress
        };
      });

      const animation = this.element.animate(positionKeyframes, {
        duration,
        easing: 'linear',
        fill: 'forwards'
      });

      if (onComplete) {
        animation.onfinish = onComplete;
      }

      return animation;
    }
  }

  setPosition(x, y) {
    this.element.style.transform = `translate(${x}px, ${y}px)`;
  }

  getPosition() {
    const transform = getComputedStyle(this.element).transform;
    if (transform === 'none') return { x: 0, y: 0 };

    const matrix = new DOMMatrix(transform);
    return { x: matrix.m41, y: matrix.m42 };
  }
}
