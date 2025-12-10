// Custom tweening utilities (replaces GSAP)

// Easing functions
export const Easing = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  easeOutElastic: (t) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },

  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

// Active tweens
const activeTweens = [];

// Tween class
export class Tween {
  constructor(target, props, duration, easing = 'easeOutQuad', onComplete = null) {
    this.target = target;
    this.props = props;
    this.duration = duration;
    
    // Resolve easing
    if (typeof easing === 'string') {
        this.easing = Easing[easing] || Easing.easeOutQuad;
        if (!Easing[easing]) {
            console.warn(`Easing function '${easing}' not found, defaulting to easeOutQuad`);
        }
    } else {
        this.easing = easing || Easing.easeOutQuad;
    }
    
    this.onComplete = onComplete;

    this.elapsed = 0;
    this.startValues = {};
    this.active = true;

    // Store initial values
    for (const key in props) {
      if (key === 'position' || key === 'scale') {
        // Handle nested objects like position.x
        this.startValues[key] = {};
        for (const subKey in props[key]) {
          this.startValues[key][subKey] = target[key][subKey];
        }
      } else {
        this.startValues[key] = target[key];
      }
    }

    activeTweens.push(this);
  }

  update(deltaTime) {
    if (!this.active) return false;

    // Check if target is destroyed (PixiJS objects)
    if (this.target && this.target.destroyed) {
      this.active = false;
      return false;
    }

    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);

    // Update all properties
    for (const key in this.props) {
      if (key === 'position' || key === 'scale') {
        // Handle nested objects
        if (this.target[key]) {
          for (const subKey in this.props[key]) {
            const start = this.startValues[key][subKey];
            const end = this.props[key][subKey];
            this.target[key][subKey] = start + (end - start) * easedProgress;
          }
        }
      } else {
        const start = this.startValues[key];
        const end = this.props[key];
        this.target[key] = start + (end - start) * easedProgress;
      }
    }

    // Check if complete
    if (progress >= 1) {
      this.active = false;
      if (this.onComplete) {
        this.onComplete();
      }
      return false;
    }

    return true;
  }

  kill() {
    this.active = false;
  }

  // Static method to create and start a tween
  static to(target, props, duration, easing = 'easeOutQuad', onComplete = null) {
    // Kill existing tweens for the same properties on this target?
    // For simplicity, we won't auto-kill, but we provide killTweensOf
    return new Tween(target, props, duration, easing, onComplete);
  }

  // Kill all tweens for a specific target
  static killTweensOf(target) {
    for (const tween of activeTweens) {
      if (tween.target === target) {
        tween.kill();
      }
    }
  }

  // Update all active tweens (call this in your animation loop)
  static updateAll(deltaTime) {
    for (let i = activeTweens.length - 1; i >= 0; i--) {
      const tween = activeTweens[i];
      if (!tween.update(deltaTime)) {
        activeTweens.splice(i, 1);
      }
    }
  }

  // Kill all tweens for a target
  static killTweensOf(target) {
    for (let i = activeTweens.length - 1; i >= 0; i--) {
      if (activeTweens[i].target === target) {
        activeTweens[i].kill();
        activeTweens.splice(i, 1);
      }
    }
  }

  // Kill all tweens
  static killAll() {
    activeTweens.length = 0;
  }

  // Calculate point on quadratic bezier curve
  // path = [start, control, end] where each is {x, y}
  static bezierPoint(path, t) {
    const [p0, p1, p2] = path;
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
  }

  // Animate target along bezier path
  // Returns the tween for chaining/tracking
  static followPath(target, path, duration, easing = 'easeOutCubic', onComplete = null) {
    const tracker = { progress: 0 };

    const tween = Tween.to(tracker, { progress: 1 }, duration, easing, onComplete);

    // Store update function on target for per-frame position updates
    target._pathTracker = tracker;
    target._path = path;
    target._updatePathPosition = function() {
      // Check if object is destroyed (PixiJS sets this flag)
      if (this.destroyed || !this._path || !this._pathTracker) {
        return;
      }
      const pos = Tween.bezierPoint(this._path, this._pathTracker.progress);
      this.position.set(pos.x, pos.y);
    };

    return tween;
  }
}

// Helper function for chaining tweens
export function sequence(tweens) {
  let currentIndex = 0;

  function startNext() {
    if (currentIndex < tweens.length) {
      const { target, props, duration, easing } = tweens[currentIndex];
      currentIndex++;
      Tween.to(target, props, duration, easing, startNext);
    }
  }

  startNext();
}

// Helper function for simultaneous tweens
export function parallel(tweens) {
  tweens.forEach(({ target, props, duration, easing, onComplete }) => {
    Tween.to(target, props, duration, easing, onComplete);
  });
}
