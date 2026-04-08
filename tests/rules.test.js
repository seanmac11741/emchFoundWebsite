import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const vitestConfig = readFileSync(resolve(repoRoot, 'vitest.config.js'), 'utf8');

describe('rules testing infrastructure', () => {
  it('declares @firebase/rules-unit-testing as a dev dependency', () => {
    expect(pkg.devDependencies).toBeDefined();
    expect(pkg.devDependencies['@firebase/rules-unit-testing']).toBeDefined();
  });

  it('can import @firebase/rules-unit-testing', async () => {
    const mod = await import('@firebase/rules-unit-testing');
    expect(typeof mod.initializeTestEnvironment).toBe('function');
  });

  it('has a vitest global setup file at tests/setup/emulator-setup.js', async () => {
    const setupPath = resolve(repoRoot, 'tests/setup/emulator-setup.js');
    expect(existsSync(setupPath)).toBe(true);

    const setupSpecifier = './setup/emulator-setup.js';
    const mod = await import(/* @vite-ignore */ setupSpecifier);
    expect(typeof mod.setup).toBe('function');
    expect(typeof mod.teardown).toBe('function');
  });

  it('wires the emulator-setup file into vitest.config.js as globalSetup', () => {
    expect(vitestConfig).toMatch(/globalSetup/);
    expect(vitestConfig).toMatch(/tests\/setup\/emulator-setup\.js/);
  });

  it.skipIf(process.env.EMCH_EMULATORS_AVAILABLE !== '1')(
    'smoke test: can initialize a rules test environment against the emulator',
    async () => {
      const { initializeTestEnvironment } = await import('@firebase/rules-unit-testing');
      const testEnv = await initializeTestEnvironment({
        projectId: 'emch-rules-smoke',
        firestore: {
          // Allow-all rules — smoke test only verifies the harness boots.
          rules: `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}`,
        },
      });
      try {
        const ctx = testEnv.unauthenticatedContext();
        expect(ctx).toBeDefined();
        expect(typeof ctx.firestore).toBe('function');
      } finally {
        await testEnv.cleanup();
      }
    },
    30000,
  );

  it('exposes a test:emulator script that runs vitest under firebase emulators:exec', () => {
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts['test:emulator']).toBeDefined();
    expect(pkg.scripts['test:emulator']).toMatch(/firebase\s+emulators:exec/);
    expect(pkg.scripts['test:emulator']).toMatch(/bun run test|vitest/);
  });
});
