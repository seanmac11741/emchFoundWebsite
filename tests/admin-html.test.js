// Tests for public/admin.html structural changes (todo 22).
//
// The admin forms must be hidden by default so non-admin users don't see
// a flash-of-admin-UI before the auth check redirects them.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

const adminHtml = readFileSync(
  resolve(__dirname, '..', 'public', 'admin.html'),
  'utf8',
);

describe('todo 22: admin.html hides admin UI by default', () => {
  it('wraps admin-only content in a single wrapper with hidden by default', () => {
    const dom = new JSDOM(adminHtml);
    const wrapper = dom.window.document.getElementById('adminOnly');
    expect(wrapper).not.toBeNull();
    expect(wrapper.hasAttribute('hidden')).toBe(true);
  });

  it('the admin wrapper contains the board-member, scholar, and blog forms', () => {
    const dom = new JSDOM(adminHtml);
    const wrapper = dom.window.document.getElementById('adminOnly');
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector('#boardMemberForm')).not.toBeNull();
    expect(wrapper.querySelector('#foundBoardMemberForm')).not.toBeNull();
    expect(wrapper.querySelector('#addScholarForm')).not.toBeNull();
    expect(wrapper.querySelector('#blogForm')).not.toBeNull();
  });
});
