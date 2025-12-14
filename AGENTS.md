# Repository Guidelines

## Project Structure & Module Organization
- `src/main.js`: Main entry point for the visualization.
- `src/shared/`: Shared components, models, and utilities.
  - `components/`: UI DOM components (`DOMStackVisualization`, `CodePanel`, etc.).
  - `models/`: Data models (`ExecutionTrace`).
  - `data/`: Demo data and traces.
  - `utils/`: Helper functions (`DOMAnimationUtils`).
- `public/`: Static assets and HTML entry points.

## Build, Test, and Development Commands
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Coding Style & Naming Conventions
- **JavaScript**: Modern ES6+ modules (`import`/`export`).
- **DOM/CSS**: Use standard DOM API and CSS for all visualization.
- **Animation**: Use Web Animations API (WAAPI) via `DOMAnimationUtils.js`.
- **Naming**: `PascalCase` for classes/components, `camelCase` for instances/functions.

## Architecture Overview
- **Execution Model**: Driven by `ExecutionTrace` which parses a list of events (`call`, `return`, `line`).
- **Visualization**:
  - `DOMStackVisualization`: Renders the call stack using `DOMStackFrame` components.
  - `CodePanel`: DOM-based overlay for crisp text rendering of source code.
  - `DOMSamplingPanel`: Sampling profiler visualization.
- **Animation**: Event-driven WAAPI system (no central tween loop).

## Key Files
- `src/main.js`: Controller for the visualization loop.
- `src/shared/data/demoData.js`: Contains the source code and execution trace data.
- `src/shared/config.js`: Configuration for colors, layout, and timings.
