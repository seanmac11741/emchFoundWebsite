// Helper for the storage characterization tests (todos 6-8).
//
// Loads the deployed storage rules fixture into a fresh
// @firebase/rules-unit-testing environment so each test can grab
// authenticated/unauthenticated contexts without re-reading the fixture
// or re-initializing the harness.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const fixturePath = resolve(
  __dirname,
  '..',
  'fixtures',
  'deployed-storage.rules',
);

export async function initDeployedStorageRulesTestEnv(overrides = {}) {
  const rules = readFileSync(fixturePath, 'utf8');
  return initializeTestEnvironment({
    projectId: overrides.projectId || 'emch-deployed-storage-char',
    storage: {
      rules,
      host: 'localhost',
      port: 9199,
    },
  });
}
