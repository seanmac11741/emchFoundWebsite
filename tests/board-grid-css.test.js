import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '..', 'public/styles.css'), 'utf8');

describe('board grid CSS', () => {
  it('defines a --cards-per-row custom property default on both board containers', () => {
    const foundBlock = css.match(/\.FoundboardMemCards\s*\{[^}]*\}/);
    const boardBlock = css.match(/\.boardMemCards\s*\{[^}]*\}/);
    expect(foundBlock?.[0]).toMatch(/--cards-per-row\s*:/);
    expect(boardBlock?.[0]).toMatch(/--cards-per-row\s*:/);
  });

  it('uses grid-template-columns driven by --cards-per-row for both boards', () => {
    const foundBlock = css.match(/\.FoundboardMemCards\s*\{[^}]*\}/);
    const boardBlock = css.match(/\.boardMemCards\s*\{[^}]*\}/);
    expect(foundBlock?.[0]).toMatch(/grid-template-columns[^;]*var\(--cards-per-row/);
    expect(boardBlock?.[0]).toMatch(/grid-template-columns[^;]*var\(--cards-per-row/);
  });

  it('tablet breakpoint uses --cards-per-row-tablet with default 2 for both boards', () => {
    const tabletMatch = css.match(
      /@media[^{]*\(max-width:\s*750px\)[^{]*\{[\s\S]*?\n\}/g
    );
    expect(tabletMatch).not.toBeNull();
    const tabletCss = tabletMatch.join('\n');
    expect(tabletCss).toMatch(/\.FoundboardMemCards/);
    expect(tabletCss).toMatch(/\.boardMemCards/);
    expect(tabletCss).toMatch(/var\(--cards-per-row-tablet,\s*2\)/);
  });

  it('mobile breakpoint stacks to 1 column for both boards', () => {
    const mobileMatch = css.match(
      /@media[^{]*\(max-width:\s*480px\)[^{]*\{[\s\S]*?\n\}/g
    );
    expect(mobileMatch).not.toBeNull();
    const mobileCss = mobileMatch.join('\n');
    expect(mobileCss).toMatch(/\.FoundboardMemCards/);
    expect(mobileCss).toMatch(/\.boardMemCards/);
    expect(mobileCss).toMatch(/1fr|repeat\(\s*1\s*,/);
  });
});
