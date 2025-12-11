import { COLORS } from '../config.js';

// Convert hex number (0xRRGGBB) to CSS color string (#RRGGBB)
function hexToCSS(hex) {
  return '#' + hex.toString(16).padStart(6, '0').toUpperCase();
}

export function getFunctionColor(funcName) {
  if (funcName === 'main') return hexToCSS(COLORS.funcMain);
  if (funcName === 'fibonacci') return hexToCSS(COLORS.funcFibonacci);
  if (funcName === 'add') return '#E36209';      // Orange
  if (funcName === 'multiply') return '#6F42C1'; // Purple
  if (funcName === 'calculate') return hexToCSS(COLORS.funcFibonacci);
  return hexToCSS(COLORS.info);
}
