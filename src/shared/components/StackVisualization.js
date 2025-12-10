import * as PIXI from 'pixi.js';
import { StackFrame } from './StackFrame.js';
import { FlyingStackFrame } from './FlyingStackFrame.js';
import { LAYOUT, TIMINGS } from '../config.js';
import { Tween } from '../utils/AnimationUtils.js';

export class StackVisualization extends PIXI.Container {
  constructor() {
    super();

    this.frames = [];  // Array of StackFrame objects
    this.frameSpacing = LAYOUT.frameSpacing;
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

    const frame = new StackFrame(functionName, filename, lineno, args);
    frame.setActive(true); // New frame is active

    // Calculate position (stack grows upward, but we render bottom-to-top)
    const targetY = this.frames.length * (LAYOUT.frameHeight + this.frameSpacing);

    // Add to container and array
    this.addChild(frame);
    this.frames.push(frame);

    // Animate in
    frame.animateIn(targetY, TIMINGS.frameSlideIn);

    // Adjust container position to keep stack visible
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
    // Destroy all children to ensure animating-out frames are also removed
    // This fixes the "ghosting" issue where popped frames that were animating out
    // weren't in this.frames but were still in the container
    this.removeChildren().forEach(child => child.destroy());
    this.frames = [];
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
  // Returns array of FlyingStackFrame instances added to the root stage
  createFlyingFrames(stage) {
    const flyingFrames = [];

    this.frames.forEach(frame => {
      // Get color using same logic as original frame
      const color = frame._getFunctionColor(frame.functionName);

      // Create flying duplicate
      const flying = new FlyingStackFrame(
        `${frame.functionName}:${frame.lineno}`,
        color
      );

      // Position at global coordinates of original frame
      const globalPos = frame.getGlobalPosition();
      flying.position.set(globalPos.x, globalPos.y);

      // Add to stage (not to this container)
      stage.addChild(flying);
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
      const frame = new StackFrame(func, file, line, args);
      const y = this.frames.length * (LAYOUT.frameHeight + this.frameSpacing);
      frame.position.set(0, y);
      
      // Set active state for the top frame
      if (index === targetStack.length - 1) {
        frame.setActive(true);
      }

      this.addChild(frame);
      this.frames.push(frame);
    });

    this._adjustContainerPosition();
  }

  // Adjust container position to keep stack centered/visible
  _adjustContainerPosition() {
    // If stack is tall, we might want to scroll or adjust position
    // For now, keep it simple - stack grows from bottom
  }

  // Reposition all frames (useful after pop)
  _repositionFrames() {
    this.frames.forEach((frame, index) => {
      const targetY = index * (LAYOUT.frameHeight + this.frameSpacing);
      
      if (Math.abs(frame.position.y - targetY) > 0.5) {
        Tween.to(frame, { position: { y: targetY } }, 200, 'easeOutQuad');
      }
    });
    
    this._adjustContainerPosition();
  }
}
