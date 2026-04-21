import { describe, it, expect } from 'vitest';
import { cardsPerRow } from '../src/cardsPerRow.js';

describe('cardsPerRow helper (desktop, max=4)', () => {
  const cases = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 4],
    [5, 3],
    [6, 4],
    [7, 4],
    [8, 4],
    [9, 3],
    [10, 4],
    [13, 1],
  ];

  for (const [count, expected] of cases) {
    it(`returns ${expected} for count ${count}`, () => {
      expect(cardsPerRow(count)).toBe(expected);
    });
  }

  it('never returns a value that leaves a remainder of 1 when count >= 3', () => {
    for (let c = 3; c <= 30; c++) {
      const n = cardsPerRow(c);
      expect(c % n, `count=${c} returned N=${n}`).not.toBe(1);
    }
  });
});

describe('cardsPerRow helper (tablet, max=2)', () => {
  const cases = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 1],
    [4, 2],
    [5, 1],
    [6, 2],
    [7, 1],
    [8, 2],
    [13, 1],
  ];

  for (const [count, expected] of cases) {
    it(`returns ${expected} for count ${count} (max=2)`, () => {
      expect(cardsPerRow(count, 2)).toBe(expected);
    });
  }
});
