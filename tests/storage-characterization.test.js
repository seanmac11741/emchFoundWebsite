// @vitest-environment node
//
// Storage rules tests — characterization (deployed/vulnerable rules) AND
// new-rules (the security fix).
//
// The Storage emulator has a single global ruleset, so both suites live in
// one file to guarantee sequential execution: characterization loads the
// frozen fixture first, then the new-rules suite loads the rewritten rules.

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  assertSucceeds,
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, getBytes, uploadString } from 'firebase/storage';
import { initDeployedStorageRulesTestEnv } from './helpers/deployed-storage-env.js';

const repoRoot = resolve(__dirname, '..');
const fixturePath = resolve(repoRoot, 'tests/fixtures/deployed-storage.rules');

const ADMIN_UID_1 = 'CYoiZHjZ2beF0ZWUJHr5n9Qq3rz2';
const ADMIN_UID_2 = 'fKO4Sj1dgShfBmC44z0h7zNZ6Ik1';
const NON_ADMIN_UID = 'random-non-admin-uid';

const storageEmulatorAvailable =
  process.env.EMCH_STORAGE_EMULATOR_AVAILABLE === '1';
const itEmu = storageEmulatorAvailable ? it : it.skip;

// ─── Characterization tests (deployed/vulnerable rules) ─────────────

describe('todo 2: snapshot deployed storage rules', () => {
  it('saves the deployed storage rules as a fixture file', () => {
    expect(existsSync(fixturePath)).toBe(true);
    const text = readFileSync(fixturePath, 'utf8');
    expect(text).toMatch(/rules_version\s*=\s*'2'/);
    expect(text).toMatch(/service firebase\.storage/);
    expect(text).toMatch(/request\.auth\s*!=\s*null/);
  });
});

describe('todo 6-8: deployed storage rules characterization (behavior)', () => {
  let charEnv;

  beforeAll(async () => {
    if (!storageEmulatorAvailable) return;
    charEnv = await initDeployedStorageRulesTestEnv();
  });
  afterAll(async () => {
    if (charEnv) await charEnv.cleanup();
  });

  itEmu(
    'todo 6: anonymous read of pdfDownloads/test.pdf — ALLOWED by deployed rules',
    async () => {
      const authed = charEnv.authenticatedContext('seeder-uid');
      await uploadString(ref(authed.storage(), 'pdfDownloads/test.pdf'), 'test-content');
      const anon = charEnv.unauthenticatedContext();
      await assertSucceeds(getBytes(ref(anon.storage(), 'pdfDownloads/test.pdf')));
    },
    30000,
  );

  itEmu(
    'todo 7: anonymous write to images/boardMembers/x.jpg — DENIED by deployed rules',
    async () => {
      const anon = charEnv.unauthenticatedContext();
      await assertFails(
        uploadString(ref(anon.storage(), 'images/boardMembers/x.jpg'), 'malicious-content'),
      );
    },
    30000,
  );

  itEmu(
    'todo 8: signed-in non-admin write to images/boardMembers/x.jpg — ALLOWED by deployed rules (THE VULNERABILITY)',
    async () => {
      const nonAdmin = charEnv.authenticatedContext(NON_ADMIN_UID);
      await assertSucceeds(
        uploadString(ref(nonAdmin.storage(), 'images/boardMembers/x.jpg'), 'overwrite-content'),
      );
    },
    30000,
  );
});

// ─── New rules tests (the security fix) ─────────────────────────────

describe('todo 10: new storage rules behavior', () => {
  let newEnv;

  beforeAll(async () => {
    if (!storageEmulatorAvailable) return;
    const rules = readFileSync(resolve(repoRoot, 'storage.rules'), 'utf8');
    newEnv = await initializeTestEnvironment({
      projectId: 'emch-new-storage-rules',
      storage: { rules, host: 'localhost', port: 9199 },
    });
  });
  afterAll(async () => {
    if (newEnv) await newEnv.cleanup();
  });

  // --- Reads: should remain public ---

  itEmu(
    'anonymous read of pdfDownloads/test.pdf — ALLOWED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_1);
      await uploadString(ref(admin.storage(), 'pdfDownloads/read-test.pdf'), 'content');
      const anon = newEnv.unauthenticatedContext();
      await assertSucceeds(getBytes(ref(anon.storage(), 'pdfDownloads/read-test.pdf')));
    },
    30000,
  );

  itEmu(
    'anonymous read of images/boardMembers/photo.jpg — ALLOWED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_1);
      await uploadString(ref(admin.storage(), 'images/boardMembers/read-test.jpg'), 'content');
      const anon = newEnv.unauthenticatedContext();
      await assertSucceeds(getBytes(ref(anon.storage(), 'images/boardMembers/read-test.jpg')));
    },
    30000,
  );

  itEmu(
    'anonymous read of images/scholars/photo.jpg — ALLOWED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_1);
      await uploadString(ref(admin.storage(), 'images/scholars/read-test.jpg'), 'content');
      const anon = newEnv.unauthenticatedContext();
      await assertSucceeds(getBytes(ref(anon.storage(), 'images/scholars/read-test.jpg')));
    },
    30000,
  );

  // --- Anonymous writes: DENIED ---

  itEmu(
    'anonymous write to images/boardMembers/x.jpg — DENIED',
    async () => {
      const anon = newEnv.unauthenticatedContext();
      await assertFails(
        uploadString(ref(anon.storage(), 'images/boardMembers/anon.jpg'), 'bad'),
      );
    },
    30000,
  );

  // --- Signed-in non-admin writes: DENIED (the fix!) ---

  itEmu(
    'signed-in non-admin write to images/boardMembers/x.jpg — DENIED (the fix)',
    async () => {
      const nonAdmin = newEnv.authenticatedContext(NON_ADMIN_UID);
      await assertFails(
        uploadString(ref(nonAdmin.storage(), 'images/boardMembers/nonadmin.jpg'), 'bad'),
      );
    },
    30000,
  );

  itEmu(
    'signed-in non-admin write to pdfDownloads/x.pdf — DENIED',
    async () => {
      const nonAdmin = newEnv.authenticatedContext(NON_ADMIN_UID);
      await assertFails(
        uploadString(ref(nonAdmin.storage(), 'pdfDownloads/nonadmin.pdf'), 'bad'),
      );
    },
    30000,
  );

  itEmu(
    'signed-in non-admin write to images/scholars/x.jpg — DENIED',
    async () => {
      const nonAdmin = newEnv.authenticatedContext(NON_ADMIN_UID);
      await assertFails(
        uploadString(ref(nonAdmin.storage(), 'images/scholars/nonadmin.jpg'), 'bad'),
      );
    },
    30000,
  );

  // --- Admin writes: ALLOWED on the three known paths ---

  itEmu(
    'admin write to pdfDownloads/admin-upload.pdf — ALLOWED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_1);
      await assertSucceeds(
        uploadString(ref(admin.storage(), 'pdfDownloads/admin-upload.pdf'), 'pdf-content'),
      );
    },
    30000,
  );

  itEmu(
    'admin write to images/boardMembers/admin-upload.jpg — ALLOWED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_2);
      await assertSucceeds(
        uploadString(ref(admin.storage(), 'images/boardMembers/admin-upload.jpg'), 'img-content'),
      );
    },
    30000,
  );

  itEmu(
    'admin write to images/scholars/admin-upload.jpg — ALLOWED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_1);
      await assertSucceeds(
        uploadString(ref(admin.storage(), 'images/scholars/admin-upload.jpg'), 'img-content'),
      );
    },
    30000,
  );

  // --- Default deny: unknown paths denied even for admin ---

  itEmu(
    'admin write to an unknown path (secret/evil.txt) — DENIED',
    async () => {
      const admin = newEnv.authenticatedContext(ADMIN_UID_1);
      await assertFails(
        uploadString(ref(admin.storage(), 'secret/evil.txt'), 'bad'),
      );
    },
    30000,
  );
});
