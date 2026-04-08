// Vitest globalSetup hook for the Firestore + Storage rules tests.
//
// The Firebase emulators are launched externally via:
//   firebase emulators:exec "bun run test"
//
// That command sets FIRESTORE_EMULATOR_HOST and FIREBASE_STORAGE_EMULATOR_HOST
// before invoking the test runner. This setup file simply detects those env
// vars and exposes a flag the rules tests use to skip themselves when no
// emulator is reachable, so a plain `bun run test` (no emulator) still passes.

export async function setup() {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;

  if (!firestoreHost) {
    // eslint-disable-next-line no-console
    console.warn(
      '[emulator-setup] Firestore emulator env vars not set — ' +
        'rules tests will be skipped. Run `bun run test:emulator` to include them.',
    );
    process.env.EMCH_EMULATORS_AVAILABLE = '0';
    return;
  }

  process.env.EMCH_EMULATORS_AVAILABLE = '1';
}

export async function teardown() {
  // No-op: emulators are managed by firebase emulators:exec.
}
