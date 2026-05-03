/**
 * Layout engine for QAOA Simulated Annealing visualization.
 * Builds serpentine flow layout for desktop view (2-column grid with arrows).
 */

import type { TraceCard } from './visual-model';

export interface QaoaSALayoutRow {
  row: number;
  left: { card: TraceCard; index: number } | null;
  right: { card: TraceCard; index: number } | null;
}

export type HorizontalDirection = 'lr' | 'rl';

export interface QaoaSALayoutConnector {
  kind: 'horizontal' | 'vertical' | 'final';
  row: number;
  direction: HorizontalDirection | 'down';
  column: 0 | 1;
}

export interface QaoaSALayoutModel {
  rows: QaoaSALayoutRow[];
  connectors: QaoaSALayoutConnector[];
  lastCol: 0 | 1;
}

export function buildSerpentineFlowLayout(traceCards: TraceCard[]): QaoaSALayoutModel {
  if (traceCards.length === 0) {
    return { rows: [], connectors: [], lastCol: 0 };
  }

  // Build node positions: 2-column serpentine
  const nodes = traceCards.map((card, index) => {
    if (index === 0) return { card, index, row: 0, col: 0 as 0 | 1 };
    if (index === 1) return { card, index, row: 0, col: 1 as 0 | 1 };

    const j = index - 2;
    const row = 1 + Math.floor(j / 2);
    const slot = j % 2;
    const leftToRight = row % 2 === 0;
    const col = (leftToRight ? slot : 1 - slot) as 0 | 1;
    return { card, index, row, col };
  });

  const maxRow = nodes.reduce((acc, node) => Math.max(acc, node.row), 0);

  const rows: QaoaSALayoutRow[] = Array.from({ length: maxRow + 1 }, (_, row) => {
    const left = nodes.find((node) => node.row === row && node.col === 0) || null;
    const right = nodes.find((node) => node.row === row && node.col === 1) || null;
    return {
      row,
      left: left ? { card: left.card, index: left.index } : null,
      right: right ? { card: right.card, index: right.index } : null,
    };
  });

  const connectors: QaoaSALayoutConnector[] = [];

  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    if (a.row === b.row && a.col !== b.col) {
      connectors.push({
        kind: 'horizontal',
        row: a.row,
        direction: a.col < b.col ? 'lr' : 'rl',
        column: a.col,
      });
    } else if (b.row === a.row + 1 && a.col === b.col) {
      connectors.push({
        kind: 'vertical',
        row: a.row,
        direction: 'down',
        column: a.col,
      });
    }
  }

  const last = nodes[nodes.length - 1];

  // Final connector to summary
  connectors.push({
    kind: 'final',
    row: maxRow,
    direction: last.col === 0 ? 'lr' : 'rl',
    column: last.col,
  });

  return {
    rows,
    connectors,
    lastCol: last.col,
  };
}
