// Tests for the rewritten Firestore rules (todo 14-17).
//
// These assert the *desired* behavior after the hardening:
// - Public read on boardMembers, foundBoardMembers, staffscholarship,
//   blogposts, govLink
// - Admin-only writes on those same collections (UID list, no /users lookup)
// - /users collection no longer matched at all — all reads/writes denied
// - Default-deny catch-all for any other path

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertSucceeds,
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

setLogLevel('silent');

const ADMIN_UID_1 = 'CYoiZHjZ2beF0ZWUJHr5n9Qq3rz2';
const ADMIN_UID_2 = 'fKO4Sj1dgShfBmC44z0h7zNZ6Ik1';
const NON_ADMIN_UID = 'random-non-admin-uid';

const PUBLIC_COLLECTIONS = [
  'boardMembers',
  'foundBoardMembers',
  'staffscholarship',
  'blogposts',
  'govLink',
];

const emulatorAvailable = process.env.EMCH_EMULATORS_AVAILABLE === '1';
const itEmu = emulatorAvailable ? it : it.skip;

let testEnv;

beforeAll(async () => {
  if (!emulatorAvailable) return;
  const rules = readFileSync(
    resolve(__dirname, '..', 'firestore.rules'),
    'utf8',
  );
  testEnv = await initializeTestEnvironment({
    projectId: 'emch-new-firestore-rules',
    firestore: { rules },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

describe('todo 15: new firestore rules — per-collection behavior matrix', () => {
  for (const col of PUBLIC_COLLECTIONS) {
    itEmu(
      `${col}: anon read ALLOWED`,
      async () => {
        // Seed a doc with rules disabled so the read has something to fetch.
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          await setDoc(doc(ctx.firestore(), `${col}/seed`), { seed: true });
        });
        const anon = testEnv.unauthenticatedContext();
        await assertSucceeds(getDoc(doc(anon.firestore(), `${col}/seed`)));
      },
      30000,
    );

    itEmu(
      `${col}: anon write DENIED`,
      async () => {
        const anon = testEnv.unauthenticatedContext();
        await assertFails(
          setDoc(doc(anon.firestore(), `${col}/anon`), { x: 1 }),
        );
      },
      30000,
    );

    itEmu(
      `${col}: signed-in non-admin write DENIED`,
      async () => {
        const nonAdmin = testEnv.authenticatedContext(NON_ADMIN_UID);
        await assertFails(
          setDoc(doc(nonAdmin.firestore(), `${col}/nonadmin`), { x: 1 }),
        );
      },
      30000,
    );

    itEmu(
      `${col}: admin (UID in list) write ALLOWED`,
      async () => {
        const admin = testEnv.authenticatedContext(ADMIN_UID_1);
        await assertSucceeds(
          setDoc(doc(admin.firestore(), `${col}/admin1`), { x: 1 }),
        );
      },
      30000,
    );

    itEmu(
      `${col}: second admin UID write ALLOWED`,
      async () => {
        const admin = testEnv.authenticatedContext(ADMIN_UID_2);
        await assertSucceeds(
          setDoc(doc(admin.firestore(), `${col}/admin2`), { x: 1 }),
        );
      },
      30000,
    );
  }
});

describe('todo 16: default-deny catch-all for unmatched collections', () => {
  itEmu(
    'write to randomCollection is DENIED for anon',
    async () => {
      const anon = testEnv.unauthenticatedContext();
      await assertFails(
        setDoc(doc(anon.firestore(), 'randomCollection/x'), { x: 1 }),
      );
    },
    30000,
  );

  itEmu(
    'write to randomCollection is DENIED for non-admin',
    async () => {
      const nonAdmin = testEnv.authenticatedContext(NON_ADMIN_UID);
      await assertFails(
        setDoc(doc(nonAdmin.firestore(), 'randomCollection/x'), { x: 1 }),
      );
    },
    30000,
  );

  itEmu(
    'write to randomCollection is DENIED even for admin',
    async () => {
      const admin = testEnv.authenticatedContext(ADMIN_UID_1);
      await assertFails(
        setDoc(doc(admin.firestore(), 'randomCollection/x'), { x: 1 }),
      );
    },
    30000,
  );

  itEmu(
    'read of randomCollection is DENIED even for admin',
    async () => {
      // Seed with rules disabled first
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'randomCollection/seed'), { x: 1 });
      });
      const admin = testEnv.authenticatedContext(ADMIN_UID_1);
      await assertFails(
        getDoc(doc(admin.firestore(), 'randomCollection/seed')),
      );
    },
    30000,
  );
});

describe('todo 17: /users collection no longer matched', () => {
  itEmu(
    'owner read of /users/{uid} is DENIED (no /users match block exists)',
    async () => {
      // Seed a doc with rules disabled so we can test a read that exists.
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `users/${ADMIN_UID_1}`), {
          role: 'admin',
        });
      });
      // Even the owner can't read it — the rule is gone entirely.
      const owner = testEnv.authenticatedContext(ADMIN_UID_1);
      await assertFails(
        getDoc(doc(owner.firestore(), `users/${ADMIN_UID_1}`)),
      );
    },
    30000,
  );

  itEmu(
    'anon read of /users/{uid} is DENIED',
    async () => {
      const anon = testEnv.unauthenticatedContext();
      await assertFails(
        getDoc(doc(anon.firestore(), 'users/some-uid')),
      );
    },
    30000,
  );

  itEmu(
    'write of {role: "admin"} to /users/{uid} is DENIED even for admin',
    async () => {
      const admin = testEnv.authenticatedContext(ADMIN_UID_1);
      await assertFails(
        setDoc(doc(admin.firestore(), `users/${ADMIN_UID_1}`), {
          role: 'admin',
        }),
      );
    },
    30000,
  );
});
