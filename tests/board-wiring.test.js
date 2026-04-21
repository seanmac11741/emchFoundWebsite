import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const appJs = readFileSync(resolve(__dirname, '..', 'src/app.js'), 'utf8');

describe('board render wiring', () => {
  it('Foundation Board render applies cards-per-row to FoundboardMemCards', () => {
    expect(appJs).toMatch(/applyCardsPerRow\([^)]*FoundboardMemCards/);
  });

  it('District Board render applies cards-per-row to boardMemCards', () => {
    expect(appJs).toMatch(/applyCardsPerRow\([^)]*['"]boardMemCards['"]/);
  });
});
