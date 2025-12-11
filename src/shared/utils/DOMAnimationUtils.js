// DOM-based animation utilities using Web Animations API
// Replaces PixiJS/GSAP tweening system with WAAPI

export class AnimationManager {
  constructor() {
    this.activeAnimations = new Set();
  }

  // Core animation method - replaces Tween.to()
  to(element, props, duration, easing = 'easeOutQuad', onComplete = null) {
    // Kill existing animations on this element
    this.killAnimationsOf(element);

    // Convert easing names to CSS cubic-bezier
    const easingMap = {
      'linear': 'linear',
      'easeInQuad': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
      'easeOutQuad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'easeInOutQuad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      'easeInCubic': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      'easeOutCubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      'easeInOutCubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      'easeOutElastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'easeOutBack': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      'easeOutBounce': 'cubic-bezier(0.68, -0.25, 0.265, 1.25)'
    };

    const cssEasing = easingMap[easing] || easingMap.easeOutQuad;

    // Prepare keyframes
    const keyframes = [];

    // For complex props like transform, build a single transform string
    const transformProps = {};
    const otherProps = {};

    for (const [key, value] of Object.entries(props)) {
      if (key === 'position' || key === 'x' || key === 'y') {
        if (key === 'position') {
          if (typeof value.x === 'number') transformProps.x = value.x;
          if (typeof value.y === 'number') transformProps.y = value.y;
        } else if (key === 'x') {
          transformProps.x = value;
        } else if (key === 'y') {
          transformProps.y = value;
        }
      } else if (key === 'scale') {
        transformProps.scale = value;
      } else if (key === 'alpha' || key === 'opacity') {
        otherProps.opacity = value;
      } else {
        otherProps[key] = value;
      }
    }

    // Get current values for transform
    const computedStyle = getComputedStyle(element);
    const matrix = new DOMMatrix(computedStyle.transform);

    // Set initial transform values if not specified
    if (transformProps.x === undefined) {
      transformProps.x = matrix.m41; // Translation X
    }
    if (transformProps.y === undefined) {
      transformProps.y = matrix.m42; // Translation Y
    }
    if (transformProps.scale === undefined) {
      // Calculate current scale from matrix
      transformProps.scale = Math.sqrt(matrix.m11 * matrix.m11 + matrix.m21 * matrix.m21);
    }

    // Build transform strings
    const initialTransform = this._buildTransformString(
      transformProps.x_start !== undefined ? transformProps.x_start : matrix.m41,
      transformProps.y_start !== undefined ? transformProps.y_start : matrix.m42,
      transformProps.scale_start !== undefined ? transformProps.scale_start :
        Math.sqrt(matrix.m11 * matrix.m11 + matrix.m21 * matrix.m21)
    );

    const finalTransform = this._buildTransformString(
      transformProps.x !== undefined ? transformProps.x : matrix.m41,
      transformProps.y !== undefined ? transformProps.y : matrix.m42,
      transformProps.scale !== undefined ? transformProps.scale :
        Math.sqrt(matrix.m11 * matrix.m11 + matrix.m21 * matrix.m21)
    );

    // Create keyframes
    const initialKeyframe = { transform: initialTransform };
    const finalKeyframe = { transform: finalTransform };

    // Add non-transform properties
    for (const [key, value] of Object.entries(otherProps)) {
      const currentVal = key === 'opacity' ? element.style.opacity || computedStyle.opacity : element.style[key];
      initialKeyframe[key] = currentVal;
      finalKeyframe[key] = value;
    }

    const keyframeArray = [initialKeyframe, finalKeyframe];

    // Create animation
    const animation = element.animate(keyframeArray, {
      duration,
      easing: cssEasing,
      fill: 'forwards'
    });

    // Track animation
    this.activeAnimations.add(animation);
    animation.onfinish = () => {
      this.activeAnimations.delete(animation);
      // Apply final values to style
      element.style.transform = finalTransform;
      for (const [key, value] of Object.entries(finalKeyframe)) {
        if (key !== 'transform') {
          element.style[key] = typeof value === 'number' ? `${value}` : value;
        }
      }
      if (onComplete) onComplete();
    };

    return animation;
  }

  // Kill all animations on an element
  killAnimationsOf(element) {
    // Cancel any existing WAAPI animations
    element.getAnimations().forEach(animation => {
      animation.cancel();
    });

    // Remove from our tracking set
    this.activeAnimations.forEach(animation => {
      if (animation.effect && animation.effect.target === element) {
        animation.cancel();
        this.activeAnimations.delete(animation);
      }
    });
  }

  // Animate element along a quadratic bezier path
  bezierPath(element, path, duration, easing = 'easeOutCubic', onComplete = null) {
    const [start, control, end] = path;

    // Check for offset-path support
    const supportsOffsetPath = CSS.supports('offset-path', 'path("M0,0")');

    if (supportsOffsetPath) {
      // Use modern CSS offset-path for smooth animation
      const svgPath = createBezierPath(start, control, end);

      element.style.offsetPath = `path('${svgPath}')`;
      element.style.offsetRotate = '0deg';

      const animation = element.animate([
        { offsetDistance: '0%' },
        { offsetDistance: '100%' }
      ], {
        duration,
        easing: easing === 'easeOutCubic' ? 'cubic-bezier(0.215, 0.61, 0.355, 1)' : easing,
        fill: 'forwards'
      });

      if (onComplete) {
        animation.onfinish = onComplete;
      }

      this.activeAnimations.add(animation);
      return animation;
    } else {
      // Fallback: use keyframe approximation
      const keyframes = approximatePath(start, control, end, 20);

      // Convert to keyframe format with positions
      const positionKeyframes = keyframes.map((point, index) => {
        const progress = index / (keyframes.length - 1);
        return {
          transform: `translate(${point.x - element.offsetWidth/2}px, ${point.y - element.offsetHeight/2}px)`,
          offset: progress
        };
      });

      const animation = element.animate(positionKeyframes, {
        duration,
        easing: 'linear', // We're manually creating the curve
        fill: 'forwards'
      });

      if (onComplete) {
        animation.onfinish = onComplete;
      }

      this.activeAnimations.add(animation);
      return animation;
    }
  }

  // Helper to build transform string
  _buildTransformString(x, y, scale = 1) {
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }
}

// Helper functions for bezier path generation
export function createBezierPath(start, control, end) {
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

export function approximatePath(start, control, end, steps = 20) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    // Quadratic bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    const x = mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x;
    const y = mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y;
    points.push({ x, y });
  }
  return points;
}

// Global animation manager instance
export const anim = new AnimationManager();

// Legacy compatibility with existing Tween API
export class Tween {
  static to(target, props, duration, easing = 'easeOutQuad', onComplete = null) {
    return anim.to(target, props, duration, easing, onComplete);
  }

  static killTweensOf(target) {
    anim.killAnimationsOf(target);
  }

  static followPath(target, path, duration, easing = 'easeOutCubic', onComplete = null) {
    return anim.bezierPath(target, path, duration, easing, onComplete);
  }

  static bezierPoint(path, t) {
    const [p0, p1, p2] = path;
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
  }

  static updateAll(deltaTime) {
    // No-op for WAAPI - animations run independently
  }

  static killAll() {
    anim.activeAnimations.forEach(animation => animation.cancel());
    anim.activeAnimations.clear();
  }
}