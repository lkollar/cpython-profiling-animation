# Python Profiler Visualization

A unified visualization that combines tracing and sampling profilers with animated flying stack frames.

## Overview

This single-page application visualizes Python code execution with:
- **Live stack visualization** - Shows function call stack in real-time
- **Source code highlighting** - Tracks current execution line
- **Sampling profiler** - Collects and displays sampling statistics
- **Flying frame animations** - Animated frames fly from stack to sampling panel

## Architecture

### Core Components

- **SamplingVisualization** (`src/main.js`) - Main orchestrator
- **DOMStackVisualization** (`src/shared/components/DOMStackVisualization.js`) - Manages stack frames
- **DOMSamplingPanel** (`src/shared/components/DOMSamplingPanel.js`) - Displays sampling results
- **CodePanel** (`src/shared/components/CodePanel.js`) - Shows source code with highlighting
- **ControlPanel** (`src/shared/components/ControlPanel.js`) - Playback controls

### Animation System

- **AnimationManager** (`src/shared/utils/DOMAnimationUtils.js`) - Coordinates all animations
- **DOMStackFrame** (`src/shared/components/DOMStackFrame.js`) - Shared base for all frames

### Configuration

- **Main Config** (`src/shared/config.js`) - Colors, timings, layout
- **Animation Config** (`src/shared/config/animation.js`) - Animation-specific settings

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### View the Visualization

Open http://localhost:5173/ in your browser

## Features

### Playback Controls
- Play/Pause execution
- Adjustable playback speed (0.1x to 5x)
- Step through execution
- Seek to any point in time

### Sampling Configuration
- Adjustable sampling interval (10ms to 500ms)
- Real-time sampling statistics
- Visual feedback with flying frames

### Visual Effects
- Smooth stack frame animations
- Flying frames follow curved paths
- Impact effects at sampling panel
- Flash effects during sampling

## Data Model

- **ExecutionTrace** (`src/shared/models/ExecutionTrace.js`) - Manages execution data
- **Demo Data** (`src/shared/data/demoData.js`) - Sample execution traces

## Performance Considerations

- Custom animation system optimized for performance
- Efficient cleanup prevents memory leaks
- Queued sampling prevents dropped samples during animations
- Configurable animation parameters for different devices

## Browser Compatibility

- Modern browsers with ES6+ support
- WebGL acceleration for optimal performance (via PIXI.js)

## License

Internal project for Python profiler visualization.
