# Profiler Visualization Implementation Plan

This document outlines the plan to build an interactive visualization demonstrating the differences between sampling and tracing profilers using PixiJS.

## Phase 1: Prototype (The "Truth" Engine)
**Goal:** Build the core simulation engine and render the "Truth" timeline (the actual program execution).

1.  **Initialize PixiJS Application**
    -   Set up `src/main.js` with a full-screen PixiJS `Application`.
    -   Create a responsive canvas that handles window resizing.

2.  **Create `ProgramSimulator` Class**
    -   Design a data model representing a "Call Stack" over time.
    -   Implement a generator that produces a deterministic pattern of function calls (e.g., `main` -> `loop` -> `heavy_calc` / `quick_task`).
    -   Ensure `quick_task` is short enough to be easily missed by a sampler.

3.  **Implement `TimelineView`**
    -   Create a Pixi `Container` to render the simulation data.
    -   Draw "Flame Chart" rectangles: X-axis = Time, Y-axis = Stack Depth.
    -   Assign distinct colors to unique function names.

4.  **Implement Playback Logic**
    -   Create a "Playhead" (vertical line) fixed at the center of the screen.
    -   Animate the `TimelineView` scrolling from right to left to simulate time passing.

## Phase 2: Sampling Profiler
**Goal:** Visualize the periodic "snapshot" mechanism and the resulting statistical approximation using a Flame Graph.

1.  **Implement `Sampler` Logic**
    -   Create a `Sampler` class with a configurable `interval` (ticks).
    -   On every interval, record the function currently under the Playhead.
    -   Store samples in a tree structure similar to CPython's `FlamegraphCollector`.

2.  **Visualize the Sampling Pulse**
    -   Add a visual "Laser" or "Camera Flash" animation at the Playhead when a sample occurs.
    -   Draw vertical markers on the timeline where samples landed, persisting as they scroll away.

3.  **Build `ProfileStatsView` (Flame Graph)**
    -   Create a UI overlay showing the "Reconstructed Profile" as a **Flame Graph** (Icicle Chart).
    -   **Reference:** Mimic the visual style of CPython's `Lib/profiling/sampling/_flamegraph_assets/flamegraph.js`.
    -   **Logic:**
        -   Root node at the top, children below.
        -   Width of each bar = Number of Samples * Interval.
        -   Color coding by function name/module.
    -   **Real-time Update:** The Flame Graph should grow dynamically as new samples are collected.
    -   **Comparison:** Display the "Estimated %" (from samples) vs. "Actual %" (from Truth) on hover.

4.  **Add Interactivity**
    -   Add a slider to control **Sampling Frequency**.
    -   Demonstrate that low frequency results in a distorted Flame Graph (missing small functions).

## Phase 3: Tracing Profiler
**Goal:** Visualize the event-driven mechanism and the "Observer Effect" (overhead).

1.  **Implement `Tracer` Logic**
    -   Create a `Tracer` class that hooks into function Entry/Exit events in the `ProgramSimulator`.
    -   Record exact timestamps for every call and return.

2.  **Visualize Triggers & Overhead**
    -   Draw "Trigger Points" (dots) at the start and end of every function block.
    -   **Crucial:** Implement a "stutter" or slowdown effect on the timeline movement whenever a trigger is hit, representing `sys.setprofile` overhead.

3.  **Update `ProfileStatsView`**
    -   Add a mode to display Tracing stats (Exact Count, Exact Duration).
    -   Highlight that while counts are perfect, the *total execution time* is longer than in the Sampling view.

4.  **Comparison Mode**
    -   Add a toggle to switch between "Sampling" and "Tracing" modes.
    -   Reset the simulation when switching to show the difference clearly.

## Further Considerations
1.  **Performance:** Use PixiJS `Graphics` for rendering shapes.
2.  **Educational Text:** Add a text box explaining *why* the short function was missed (Sampling) or why the timeline slowed down (Tracing).
3.  **CPython Specifics:** Label the overhead visualization as "Python Interpreter Overhead" vs "Profiler Overhead".
