import { describe, it, expect, beforeEach } from 'vitest';
import { applyCardsPerRow } from '../src/cardsPerRow.js';

describe('applyCardsPerRow', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="c"></div>';
    container = document.getElementById('c');
  });

  it('sets --cards-per-row on the container matching helper output for count=5', () => {
    applyCardsPerRow(container, 5);
    expect(container.style.getPropertyValue('--cards-per-row')).toBe('3');
  });

  it('sets --cards-per-row=4 for count=7', () => {
    applyCardsPerRow(container, 7);
    expect(container.style.getPropertyValue('--cards-per-row')).toBe('4');
  });

  it('sets --cards-per-row=3 for count=9', () => {
    applyCardsPerRow(container, 9);
    expect(container.style.getPropertyValue('--cards-per-row')).toBe('3');
  });

  it('is a no-op safe when container is null', () => {
    expect(() => applyCardsPerRow(null, 5)).not.toThrow();
  });

  it('sets --cards-per-row-tablet=1 for odd count (5) to stack at tablet', () => {
    applyCardsPerRow(container, 5);
    expect(container.style.getPropertyValue('--cards-per-row-tablet')).toBe('1');
  });

  it('sets --cards-per-row-tablet=2 for even count (6)', () => {
    applyCardsPerRow(container, 6);
    expect(container.style.getPropertyValue('--cards-per-row-tablet')).toBe('2');
  });
});
