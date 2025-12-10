import { COLORS } from '../config.js';

export function getFunctionColor(funcName) {
  if (funcName === 'main') return COLORS.funcMain;
  if (funcName === 'fibonacci') return COLORS.funcFibonacci;
  if (funcName === 'add') return 0xE36209;      // Orange
  if (funcName === 'multiply') return 0x6F42C1; // Purple
  if (funcName === 'calculate') return COLORS.funcFibonacci;
  return COLORS.info;
}
