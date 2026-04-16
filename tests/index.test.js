import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '..');
const indexHtml = readFileSync(resolve(repoRoot, 'public/index.html'), 'utf8');
const stylesCss = readFileSync(resolve(repoRoot, 'public/styles.css'), 'utf8');

describe('index.html structure', () => {
  beforeAll(() => {
    document.documentElement.innerHTML = indexHtml;
  });

  it('has the foundation title in an h1', () => {
    const h1 = document.querySelector('.titleSection h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toContain('East Morgan County Hospital Foundation');
  });

  it('navbar contains links to all top-level pages', () => {
    const hrefs = Array.from(document.querySelectorAll('.navbar ul li a')).map(
      (a) => a.getAttribute('href')
    );
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '#',
        'events.html',
        'district.html',
        'auxiliary.html',
        'scholarships.html',
      ])
    );
  });

  it('hero section has a Donate button linking to the Square donation URL', () => {
    const donateLink = document.querySelector('.heroSection a[href*="square.link"]');
    expect(donateLink).not.toBeNull();
    expect(donateLink.getAttribute('href')).toBe('https://square.link/u/jaG4W2Uo');
    expect(donateLink.querySelector('button')).not.toBeNull();
  });

  it('footer exposes contact phone and email links', () => {
    const tel = document.querySelector('footer a[href^="tel:"]');
    const mail = document.querySelector('footer a[href^="mailto:"]');
    expect(tel).not.toBeNull();
    expect(tel.getAttribute('href')).toBe('tel:+19708424899');
    expect(mail).not.toBeNull();
  });
});

describe('styles.css theme', () => {
  it('defines core CSS color variables in :root', () => {
    expect(stylesCss).toMatch(/:root\s*\{[\s\S]*--color-primary:/);
    expect(stylesCss).toMatch(/--color-secondary:/);
    expect(stylesCss).toMatch(/--color-tertiary:/);
    expect(stylesCss).toMatch(/--color-accent:/);
  });
});
