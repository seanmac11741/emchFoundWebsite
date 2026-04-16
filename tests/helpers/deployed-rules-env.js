// Helper for the firestore characterization tests (todos 15-20).
//
// Loads the deployed rules fixture into a fresh @firebase/rules-unit-testing
// environment so each test can grab authenticated/unauthenticated contexts
// without re-reading the fixture or re-initializing the harness.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const fixturePath = resolve(
  __dirname,
  '..',
  'fixtures',
  'deployed-firestore.rules',
);

export async function initDeployedRulesTestEnv(overrides = {}) {
  const rules = readFileSync(fixturePath, 'utf8');
  return initializeTestEnvironment({
    projectId: overrides.projectId || 'emch-deployed-rules-char',
    firestore: { rules },
  });
}
