import { LAYOUT } from '../config.js';
import { Tween, createBezierPath, approximatePath } from '../utils/DOMAnimationUtils.js';
import { getFunctionColor } from '../utils/ColorUtils.js';

export class DOMFlyingStackFrame {
  constructor(sourceFrame) {
    // Clone the appearance from source frame
    this.functionName = sourceFrame.functionName;
    this.lineno = sourceFrame.lineno;
    this.color = sourceFrame.color;

    // Create DOM element (simpler, no interactivity)
    this.element = document.createElement('div');
    this.element.className = 'stack-frame flying-frame';
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

    // Set dimensions
    this.element.style.width = `${LAYOUT.frameWidth}px`;
    this.element.style.height = `${LAYOUT.frameHeight}px`;

    // Set initial position to match source
    const sourcePos = sourceFrame.getPosition();
    this.setPosition(sourcePos.x, sourcePos.y);

    // Add flying class for styling
    this.element.classList.add('flying');
  }

  destroy() {
    Tween.killTweensOf(this.element);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  // Animate along a bezier path
  animateAlongPath(path, duration, onComplete) {
    const [start, control, end] = path;

    // Adjust for element center (offset from top-left)
    const offsetX = -LAYOUT.frameWidth / 2;
    const offsetY = -LAYOUT.frameHeight / 2;

    const adjustedPath = [
      { x: start.x + offsetX, y: start.y + offsetY },
      { x: control.x + offsetX, y: control.y + offsetY },
      { x: end.x + offsetX, y: end.y + offsetY }
    ];

    // Check for offset-path support
    const supportsOffsetPath = CSS.supports('offset-path', 'path("M0,0")');

    if (supportsOffsetPath) {
      // Use modern CSS offset-path for smooth animation
      const svgPath = createBezierPath(adjustedPath[0], adjustedPath[1], adjustedPath[2]);

      // IMPORTANT: Clear transform - offset-path positions absolutely,
      // and transform would be applied ON TOP of offset-path position
      this.element.style.transform = 'none';
      this.element.style.offsetPath = `path('${svgPath}')`;
      this.element.style.offsetRotate = '0deg';

      const animation = this.element.animate([
        { offsetDistance: '0%' },
        { offsetDistance: '100%' }
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
      // Fallback: use keyframe approximation
      const keyframes = approximatePath(adjustedPath[0], adjustedPath[1], adjustedPath[2], 20);

      // Convert to keyframe format with positions
      const positionKeyframes = keyframes.map((point, index) => {
        const progress = index / (keyframes.length - 1);
        return {
          transform: `translate(${point.x}px, ${point.y}px)`,
          offset: progress
        };
      });

      const animation = this.element.animate(positionKeyframes, {
        duration,
        easing: 'linear', // We're manually creating the curve
        fill: 'forwards'
      });

      if (onComplete) {
        animation.onfinish = onComplete;
      }

      return animation;
    }
  }

  // Legacy method for compatibility with existing code
  animateAlongPathLegacy(path, duration, onComplete) {
    return this.animateAlongPath(path, duration, onComplete);
  }

  // Set position directly
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