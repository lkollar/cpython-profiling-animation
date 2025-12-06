# Repository Guidelines

## Project Structure & Module Organization
- `src/execution/`: Main entry point for the execution visualization (`main.js`).
- `src/shared/`: Shared components, models, and utilities.
  - `components/`: UI and PixiJS components (`StackVisualization`, `CodePanel`, etc.).
  - `models/`: Data models (`ExecutionTrace`).
  - `data/`: Demo data and traces.
  - `utils/`: Helper functions (`AnimationUtils`).
- `public/`: Static assets and HTML entry points.

## Build, Test, and Development Commands
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Coding Style & Naming Conventions
- **JavaScript**: Modern ES6+ modules (`import`/`export`).
- **PixiJS**: Use v8 API. Prefer `Application` and `Container` classes.
- **Components**: Class-based components extending `PIXI.Container` where appropriate.
- **Styling**: CSS for DOM overlays (`CodePanel`), PixiJS graphics for canvas elements.
- **Naming**: `PascalCase` for classes/components, `camelCase` for instances/functions.

## Architecture Overview
- **Execution Model**: Driven by `ExecutionTrace` which parses a list of events (`call`, `return`, `line`).
- **Visualization**:
  - `StackVisualization`: Renders the call stack using `StackFrame` components.
  - `TimelinePanel`: Shows execution progress over time.
  - `CodePanel`: DOM-based overlay for crisp text rendering of source code.
- **Animation**: Custom `Tween` system in `AnimationUtils.js` (do not use GSAP).

## Key Files
- `src/execution/main.js`: Controller for the visualization loop.
- `src/shared/data/demoData.js`: Contains the source code and execution trace data.
- `src/shared/config.js`: Configuration for colors, layout, and timings.
