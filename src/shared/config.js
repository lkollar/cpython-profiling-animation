// Shared configuration for all visualizations

export const COLORS = {
  // Background & UI (Light theme - CPython docs style)
  background: 0xFAFAFA,    // Light gray background
  panelBg: 0xFFFFFF,       // White panels
  borderLight: 0xE1E4E8,   // Subtle gray border
  borderHighlight: 0x3776AB,

  // Text (Dark on light)
  textPrimary: 0x24292E,   // Dark text (GitHub style)
  textSecondary: 0x6A737D, // Muted gray
  textDim: 0x959DA5,       // Lighter gray

  // Function colors (muted, professional)
  funcMain: 0x3776AB,      // Python blue (official)
  funcFibonacci: 0x6A9955, // Muted green

  // State indicators
  active: 0xFFF3CD,        // Soft yellow highlight
  activeText: 0x856404,    // Dark yellow text for highlighted code
  success: 0x6A9955,       // Muted green
  warning: 0xE36209,       // Orange
  error: 0xD73A49,         // Red
  info: 0x3776AB,          // Blue

  // Profiler-specific
  samplingAccent: 0x50E3C2,    // Teal
  tracingAccent: 0xF8E71C,     // Yellow

  // Overhead zones
  overheadLow: 0x7ED321,       // < 5% green
  overheadMedium: 0xF5A623,    // 5-20% orange
  overheadHigh: 0xE94B3C,      // > 20% red
};

export const TIMINGS = {
  frameSlideIn: 500,        // ms
  frameSlideOut: 300,       // ms
  frameFadeOut: 200,        // ms

  // Sampling profiler
  sampleFlash: 200,         // ms
  sampleIntervalMin: 10,    // ms
  sampleIntervalMax: 500,   // ms
  sampleIntervalDefault: 100, // ms
  sampleToFlame: 600,       // particle travel time
  flameGrowth: 300,         // rect width expansion

  // Tracing profiler
  hookDelay: 10,            // simulated instrumentation cost
  eventLightDuration: 150,  // LED flash time

  // Playback speeds
  speeds: [0.1, 0.25, 0.5, 1, 2, 5],
  defaultSpeed: 0.1,
};

export const LAYOUT = {
  // Stack frame dimensions
  frameWidth: 200,
  frameHeight: 40,
  frameSpacing: 6,
  frameRadius: 4,

  // Code panel
  codePanelWidth: 0.3,    // 30% of viewport

  // Stack visualization
  stackPanelWidth: 0.4,   // 40% of viewport

  // Timeline
  timelinePanelWidth: 0.3, // 30% of viewport

  // Flame graph
  flameNodeHeight: 30,
  flameMaxDepth: 20,
};

export function calculateLayout(screenWidth, screenHeight) {
  // Leave space for controls at bottom
  const contentHeight = screenHeight - 100;

  // Calculate column widths
  const codePanelWidth = Math.min(screenWidth * 0.35, 400);
  const centerColumnWidth = 450;
  const centerColumnStart = codePanelWidth;

  // Calculate section heights
  const stackHeight = contentHeight * 0.45;
  const samplingHeight = contentHeight * 0.55;

  return {
    contentHeight,
    codePanel: {
      width: codePanelWidth,
      height: contentHeight,
      x: 0,
      y: 0
    },
    stack: {
      width: LAYOUT.frameWidth,
      height: stackHeight,
      x: centerColumnStart + (centerColumnWidth - LAYOUT.frameWidth) / 2,
      y: 50
    },
    sampling: {
      width: centerColumnWidth - 40,
      height: samplingHeight,
      x: centerColumnStart + 20,
      y: stackHeight + 50
    }
  };
}
