// Characterization tests for the deployed Firestore rules.
//
// These tests document the *current* allow/deny behavior of the rules that
// are live in production, so we have a baseline before rewriting them in
// later steps of the security plan. The deployed rules are stored verbatim
// in tests/fixtures/deployed-firestore.rules and loaded into the emulator.

import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';
import { initDeployedRulesTestEnv } from './helpers/deployed-rules-env.js';

// Silence the noisy permission-denied logs that the SDK prints when
// assertFails triggers an expected denial.
setLogLevel('silent');

const repoRoot = resolve(__dirname, '..');
const fixturePath = resolve(repoRoot, 'tests/fixtures/deployed-firestore.rules');
const diffPath = resolve(repoRoot, 'tests/fixtures/deployed-vs-repo-firestore.md');

const emulatorAvailable = process.env.EMCH_EMULATORS_AVAILABLE === '1';
const itEmu = emulatorAvailable ? it : it.skip;

let sharedTestEnv;
afterAll(async () => {
  if (sharedTestEnv) await sharedTestEnv.cleanup();
});

describe('todo 14: deployed firestore rules audit + diff', () => {
  it('saves the deployed firestore rules as a fixture file', () => {
    expect(existsSync(fixturePath)).toBe(true);
    const text = readFileSync(fixturePath, 'utf8');
    // Sanity-check that the fixture contains the collections we know are
    // declared in the deployed rules (per copy-paste from Firebase Console).
    expect(text).toMatch(/rules_version\s*=\s*'2'/);
    expect(text).toMatch(/service cloud\.firestore/);
    expect(text).toMatch(/match \/users\/\{uid\}/);
    expect(text).toMatch(/match \/boardMembers\/\{uid\}/);
    expect(text).toMatch(/match \/foundBoardMembers\/\{uid\}/);
    expect(text).toMatch(/match \/staffscholarship\/\{uid\}/);
    expect(text).toMatch(/match \/blogposts\/\{uid\}/);
    expect(text).toMatch(/match \/govLink\/\{uid\}/);
  });

  it('documents the diff between deployed rules and repo firestore.rules', () => {
    expect(existsSync(diffPath)).toBe(true);
    const diff = readFileSync(diffPath, 'utf8');
    // The diff doc must call out collections that exist in the deployed
    // rules but are missing from the repo file. The repo file currently
    // only has /users and /blog, so all five real collections should be
    // listed as "deployed-only".
    expect(diff).toMatch(/boardMembers/);
    expect(diff).toMatch(/foundBoardMembers/);
    expect(diff).toMatch(/staffscholarship/);
    expect(diff).toMatch(/blogposts/);
    expect(diff).toMatch(/govLink/);
    // The repo file's broken /blog rule should also be flagged.
    expect(diff).toMatch(/\/blog\b/);
  });
});

describe('todo 15: load deployed rules into the firestore emulator', () => {
  itEmu(
    'initializes a test environment with the deployed rules fixture',
    async () => {
      sharedTestEnv = await initDeployedRulesTestEnv();
      expect(sharedTestEnv).toBeDefined();
      // The helper must expose the standard rules-unit-testing surface so
      // later tests (16-20) can grab auth/unauth contexts from it.
      expect(typeof sharedTestEnv.unauthenticatedContext).toBe('function');
      expect(typeof sharedTestEnv.authenticatedContext).toBe('function');
      expect(typeof sharedTestEnv.cleanup).toBe('function');
    },
    30000,
  );
});

// Helper: lazily initialize and reuse a single test env across the
// behavior tests below so we don't pay startup cost for each one.
async function getEnv() {
  if (!sharedTestEnv) sharedTestEnv = await initDeployedRulesTestEnv();
  return sharedTestEnv;
}

describe('todo 16-20: deployed rules characterization (behavior)', () => {
  itEmu(
    'todo 16: anonymous read of boardMembers — ALLOWED by deployed rules',
    async () => {
      const env = await getEnv();
      // Seed a doc with security disabled so the read has something to fetch.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'boardMembers/seed'), {
          name: 'Seed Member',
        });
      });
      const anon = env.unauthenticatedContext();
      await assertSucceeds(getDoc(doc(anon.firestore(), 'boardMembers/seed')));
    },
    30000,
  );

  itEmu(
    'todo 17: anonymous write to boardMembers — DENIED by deployed rules',
    async () => {
      const env = await getEnv();
      const anon = env.unauthenticatedContext();
      await assertFails(
        setDoc(doc(anon.firestore(), 'boardMembers/anon-write'), {
          name: 'Should Not Persist',
        }),
      );
    },
    30000,
  );

  itEmu(
    'todo 18: signed-in non-admin write to blogposts — DENIED by deployed rules',
    async () => {
      const env = await getEnv();
      // The user is authenticated but has no /users/{uid} doc at all, so the
      // exists() check in the deployed rule short-circuits to false.
      const nonAdmin = env.authenticatedContext('non-admin-uid');
      await assertFails(
        setDoc(doc(nonAdmin.firestore(), 'blogposts/post-1'), {
          title: 'Unauthorized Post',
        }),
      );
    },
    30000,
  );

  itEmu(
    'todo 19: signed-in user writing {role:"admin"} to own /users/{uid} — DENIED by deployed rules',
    async () => {
      const env = await getEnv();
      // The deployed /users rule only declares `allow read`. Writes default
      // to deny, which closes the privilege-escalation vector. (The repo
      // file currently has `allow read, write` here — see the diff doc.)
      const user = env.authenticatedContext('escalator-uid');
      await assertFails(
        setDoc(doc(user.firestore(), 'users/escalator-uid'), {
          role: 'admin',
        }),
      );
    },
    30000,
  );
});
