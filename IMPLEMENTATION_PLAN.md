# CPython Profiling Visualizations - Implementation Plan

## Project Overview

Educational PixiJS visualizations explaining how CPython sampling and tracing profilers work.

**4 Progressive Visualizations:**
1. **Code Execution** - Basic stack frame execution (no profiling)
2. **Tracing Profiler** - Same execution with instrumentation overhead
3. **Sampling Profiler** - Same execution with periodic sampling
4. **Flame Graph** - Interactive flame graph construction

---

## Implementation Status

### ✅ Phase 1: Shared Foundation (COMPLETED)

**Files Created:**
- `src/shared/config.js` - Colors, timings, layout constants
- `src/shared/data/demoData.js` - Synthetic Fibonacci execution trace
- `src/shared/utils/AnimationUtils.js` - Custom tweening system
- `src/shared/models/ExecutionTrace.js` - Trace data model
- `src/shared/components/StackFrame.js` - Individual stack frame
- `src/shared/components/StackVisualization.js` - Stack container
- `src/shared/components/CodePanel.js` - Code display (HTML overlay)
- `src/shared/components/TimelinePanel.js` - Event timeline
- `src/shared/components/ControlPanel.js` - Playback controls (DOM-based)

**Key Decisions:**
- Custom tweening (no GSAP dependency)
- Synthetic demo data (hand-crafted for clarity)
- Light theme (CPython docs style)
- HTML overlay for code panel (crisp text rendering)

---

### ✅ Phase 2: Visualization 1 - Code Execution (COMPLETED)

**Files:**
- `public/1-execution.html` - Entry point
- `src/execution/main.js` - Main visualization logic
- `src/style.css` - Updated with code panel styles

**Features Implemented:**
- 3-panel layout: Code (30%) | Stack (40%) | Timeline (30%)
- Animated stack push/pop operations
- Code line highlighting with auto-scroll
- Timeline event markers (call/return)
- Playback controls (play, pause, reset, speed, scrubber)

**Visual Improvements Applied:**
- ✅ Light theme (`#FAFAFA` background)
- ✅ 10x slower execution (125ms → 1250ms)
- ✅ HTML code panel overlay (crisp text)
- ✅ High-resolution PixiJS text (`resolution: 2`)
- ✅ Stack frame borders and shadows
- ✅ Muted professional colors

**Demo Data:**
- Fibonacci(5) called 3 times
- 96 call/return events (0-1250ms)
- 13 samples at 100ms intervals

---

### 🔄 Phase 3: Visualization 2 - Tracing Profiler (PENDING)

**Files to Create:**
- `public/2-tracing.html`
- `src/tracing/main.js`
- `src/tracing/TracingManager.js`

**Features to Implement:**
1. Reuse Viz 1 base layout
2. Add CALL/RETURN LED indicators (flash on each event)
3. Frame metadata overlays:
   - Entry timestamp badge
   - Call count badge
4. Timing accumulation display:
   - Inline time vs total time
   - Parent/child timing relationships
5. Simulated overhead:
   - Add 5ms delay per hook event
   - Visible slowdown compared to Viz 1
6. Event monitor panel (shows hook activity)

**Color Scheme:**
- Tracing accent: `0xF8E71C` (yellow)
- LED call: `0x7ED321` (green)
- LED return: `0xE94B3C` (red)

---

### 🔄 Phase 4: Visualization 3 - Sampling Profiler (PENDING)

**Files to Create:**
- `public/3-sampling.html`
- `src/sampling/main.js`
- `src/sampling/SamplingManager.js`

**Features to Implement:**
1. Reuse Viz 1 base layout
2. Timer interrupt indicator:
   - Pulsing clock icon at 100ms interval
   - Visual "tick" on each sample
3. Flash effect when sample captured:
   - Brief white flash on all stack frames
   - "Freeze frame" visual
4. Sample collection display:
   - Shows captured stack snapshots
   - Highlights which calls were caught/missed
5. Minimal overhead:
   - Runs at same speed as Viz 1
   - No per-event delays
6. Sample accuracy visualization:
   - Compare sampled data to actual execution

**Color Scheme:**
- Sampling accent: `0x50E3C2` (teal)
- Flash effect: white overlay (0.4 alpha)

---

### 🔄 Phase 5: Visualization 4 - Flame Graph (PENDING)

**Files to Create:**
- `public/4-flamegraph.html`
- `src/flamegraph/main.js`
- `src/shared/components/FlameGraph.js`
- `src/shared/components/FlameNode.js`

**Features to Implement:**
1. Interactive flame graph visualization
2. Incremental construction animator:
   - Process samples one-by-one
   - Show tree building dynamically
3. Bottom-up tree layout:
   - Root at y=0
   - Width = sample count (time spent)
   - Depth = call stack depth
4. Zoom/pan interactions:
   - Click to zoom into subtree
   - Mouse wheel zoom
   - Drag to pan
5. Hover tooltips:
   - Function name
   - Sample count
   - Percentage of total time
6. Sample inspector panel:
   - Shows raw stack snapshots
   - Highlights current sample being added

**Algorithm:**
```javascript
// Bottom-up layout
function layoutNode(node, depth, x, width, totalSamples) {
  const nodeWidth = (node.samples / totalSamples) * width;
  const y = depth * 30;

  // Place node
  createGraphic(node, x, y, nodeWidth, 30);

  // Layout children left-to-right
  let childX = x;
  for (child of node.children) {
    layoutNode(child, depth + 1, childX, width, totalSamples);
    childX += (child.samples / totalSamples) * width;
  }
}
```

---

## Technical Specifications

### Color Palette (Light Theme)

```javascript
// Background & UI
background: 0xFAFAFA      // Light gray
panelBg: 0xFFFFFF         // White
borderLight: 0xE1E4E8     // Subtle gray border

// Text
textPrimary: 0x24292E     // Dark text (GitHub style)
textSecondary: 0x6A737D   // Muted gray
textDim: 0x959DA5         // Lighter gray

// Function colors
funcMain: 0x3776AB        // Python blue
funcFibonacci: 0x6A9955   // Muted green

// State indicators
active: 0xFFF3CD          // Soft yellow highlight
activeText: 0x856404      // Dark yellow text
```

### Animation Timings

```javascript
frameSlideIn: 300         // Stack frame entry
frameSlideOut: 200        // Stack frame exit
sampleFlash: 150          // Sample capture flash
sampleInterval: 100       // Sampling period (was 10ms, now 100ms)
hookDelay: 5              // Tracing overhead simulation
eventLightDuration: 100   // LED flash duration
```

### Layout Constants

```javascript
frameWidth: 300
frameHeight: 60
frameSpacing: 10
frameRadius: 8
codePanelWidth: 30%       // of viewport
stackPanelWidth: 40%      // of viewport
timelinePanelWidth: 30%   // of viewport
```

---

## Demo Data Structure

### Execution Trace
- **Duration:** 0-1250ms (10x slower than original)
- **Events:** 96 call/return events
- **Functions:** `main()`, `fibonacci(n)` where n ∈ {0,1,2,3,4,5}
- **Pattern:** Fibonacci(5) called 3 times in loop

### Sample Data
- **Interval:** 100ms (was 10ms, scaled 10x)
- **Count:** 13 samples total
- **Captures:** Mix of different stack depths (1-4 frames)

---

## Files Modified

### Configuration & Data
- ✅ `src/shared/config.js` - Updated to light theme colors
- ✅ `src/shared/data/demoData.js` - Timestamps multiplied by 10

### Components
- ✅ `src/shared/components/CodePanel.js` - Converted to HTML overlay
- ✅ `src/shared/components/StackFrame.js` - Added borders, shadows, high-res text
- ✅ `src/shared/components/TimelinePanel.js` - Added high-res text

### Main Application
- ✅ `src/execution/main.js` - Added resolution/autoDensity settings

### Styles
- ✅ `src/style.css` - Added code panel overlay styles, syntax highlighting

---

## Testing Checklist

### Visualization 1 (Code Execution)
- ✅ Execution takes ~5 seconds at 0.25x speed (watchable)
- ✅ Text is crisp on retina/high-DPI displays
- ✅ Colors are muted and professional (not neon)
- ✅ Stack frames have subtle depth (shadows/borders)
- ✅ Code panel is readable with good contrast
- ✅ Syntax highlighting works (keywords, functions, strings, numbers)
- ✅ Line highlighting and auto-scroll work correctly
- ✅ Playback controls function properly
- ✅ Timeline markers show call/return events

### Visualization 2 (Tracing)
- ⏳ Hook events flash LED indicators
- ⏳ Timing metadata displays correctly
- ⏳ Visible slowdown vs Viz 1
- ⏳ Call counts accumulate properly

### Visualization 3 (Sampling)
- ⏳ Timer interrupt indicator pulses at correct interval
- ⏳ Flash effect triggers on samples
- ⏳ Some calls missed (statistical sampling shown)
- ⏳ Runs at same speed as Viz 1 (minimal overhead)

### Visualization 4 (Flame Graph)
- ⏳ Tree builds incrementally as samples added
- ⏳ Width accurately represents sample count
- ⏳ Hover tooltips show correct info
- ⏳ Zoom/pan interactions smooth
- ⏳ Color scheme distinguishes functions

---

## Next Steps

### Immediate (Viz 2 - Tracing)
1. Create `public/2-tracing.html` entry point
2. Implement `src/tracing/main.js` (extend Viz 1)
3. Create `TracingManager.js`:
   - LED indicator components
   - Timing metadata overlays
   - Hook delay simulation
4. Add control to toggle timing details on/off
5. Test overhead visualization (should be noticeably slower)

### Future Enhancements
- Keyboard shortcuts (space=play/pause, arrows=step)
- Multi-threading visualization (GIL ownership)
- Real CPython trace import (vs synthetic data)
- Export flame graph as SVG
- Dark mode toggle
- Navigation between visualizations (next/prev buttons)

---

## References

### CPython Source
- Sampling profiler: `/Users/lkollar/github/cpython/Lib/profiling/sampling/`
- Tracing profiler: `/Users/lkollar/github/cpython/Modules/_lsprof.c`
- Flame graph algorithm: `stack_collector.py`

### Documentation
- Plan file: `/Users/lkollar/.claude/plans/linked-prancing-abelson.md`
- PixiJS v8.14.3 docs
- Vite 7.2.4 docs

---

**Last Updated:** 2025-12-06
**Status:** Viz 1 complete with visual improvements, ready to start Viz 2
