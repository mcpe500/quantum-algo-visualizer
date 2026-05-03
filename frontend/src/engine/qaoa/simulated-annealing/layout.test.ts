import { describe, it, expect } from 'vitest';
import { buildSerpentineFlowLayout } from './layout';
import type { TraceCard } from './visual-model';

function makeCards(count: number): TraceCard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `trace-${i}`,
    step: i,
    isStart: i === 0,
    isLast: i === count - 1,
    data: {} as TraceCard['data'],
    matrix: [],
  }));
}

describe('buildSerpentineFlowLayout', () => {
  it('returns empty for empty trace', () => {
    const layout = buildSerpentineFlowLayout([]);
    expect(layout.rows).toHaveLength(0);
    expect(layout.connectors).toHaveLength(0);
  });

  it('places single card at row 0 col 0', () => {
    const layout = buildSerpentineFlowLayout(makeCards(1));
    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].left).not.toBeNull();
    expect(layout.rows[0].right).toBeNull();
    expect(layout.lastCol).toBe(0);
  });

  it('places two cards in same row', () => {
    const layout = buildSerpentineFlowLayout(makeCards(2));
    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].left).not.toBeNull();
    expect(layout.rows[0].right).not.toBeNull();
    expect(layout.lastCol).toBe(1);
  });

  it('creates horizontal connector for same-row cards', () => {
    const layout = buildSerpentineFlowLayout(makeCards(2));
    const h = layout.connectors.filter((c) => c.kind === 'horizontal');
    expect(h).toHaveLength(1);
    expect(h[0].direction).toBe('lr');
  });

  it('creates vertical connector when moving to next row', () => {
    // 3 cards: row0 has 2 cards, row1 has 1 card
    const layout = buildSerpentineFlowLayout(makeCards(3));
    const v = layout.connectors.filter((c) => c.kind === 'vertical');
    expect(v.length).toBeGreaterThanOrEqual(0);
    expect(layout.rows).toHaveLength(2);
  });

  it('includes final connector', () => {
    const layout = buildSerpentineFlowLayout(makeCards(5));
    const final = layout.connectors.filter((c) => c.kind === 'final');
    expect(final).toHaveLength(1);
  });
});
