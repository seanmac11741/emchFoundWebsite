# Security Fix Plan — ABANDONED 2026-04-08

> **This plan is no longer the active work.** Steps 1-20 ran successfully and
> the characterization tests they produced are still valuable. But the audit
> in steps 14-20 disproved the plan's core premise.
>
> **What we thought:** the repo's broken `firestore.rules` (privilege
> escalation via `/users.role`, missing collections, typo'd `/blog`) was
> what was running in production, and we needed to fix it urgently.
>
> **What we found:** the broken rules have *never been deployed*. Production
> runs a completely different ruleset that correctly denies anonymous writes,
> non-admin writes, and `/users` writes (the privesc vector simply doesn't
> exist live, because the deployed `/users` rule has no `allow write` clause).
> The repo file and `firebase.json` were never wired together, so deploys
> have always come from manually-edited rules in the Firebase Console.
>
> **The real problem** is config-drift: the repo and console are completely
> out of sync, and one stray `firebase deploy --only firestore:rules` would
> create the very vulnerability this plan was trying to fix. The fix is to
> sync everything from the console into the repo first, then write a fresh
> cleanup plan against an accurate baseline.

## Status

- Steps 1-20: **complete.** Auth characterization tests, rules testing
  infrastructure (vitest + emulator), deployed-rules fixture, and four
  Firestore characterization tests are all in place and passing.
- Steps 21-48: **deleted.** They were written against a wrong premise and
  would have introduced churn without fixing anything that's actually broken.
- Next: sync remaining Firebase Console state into the repo (Storage rules,
  Firestore indexes, anything else live), then draft a new cleanup plan.

---

## Decisions (kept for historical context)

- **Trust model:** hardcoded admin UID list in rules and client JS — no Auth blocking function, no Cloud Functions required. Sufficient for a small, stable admin set.
- **`/users` collection:** dropped entirely. It was only used to store `role`, which is now encoded directly in the rules file. Eliminates the privilege escalation and removes a Firestore read on every admin page load.
- **Client-side gate:** fix the `await` bug and hide admin UI by default to eliminate the flash-of-admin-page. UX only — the rules are the real enforcement.
- **Rules tests:** include vitest tests against the Firebase emulator to catch future regressions.
- **Characterization tests first:** this is a working production repo. Before changing anything, write tests that document the current auth flow behavior. These tests define what "working" means and guard against regressions during the security fixes.

---

## Completed todos (1-20)

Auth flow characterization tests (1-8):
1. [x] Create `tests/auth.test.js` with vitest + jsdom environment
2. [x] Mock the Firebase Auth module (`vi.mock`) so no real Firebase calls are made
3. [x] Test: unauthenticated user visiting admin page → `window.location.href` set to `login` and alert shown
4. [x] Test: authenticated user with non-admin UID visiting admin page → redirected to `index.html`
5. [x] Test: authenticated admin user visiting admin page → `whenSignedIn` section is unhidden, `whenSignedOut` is hidden
6. [x] Test: `onAuthStateChanged` populates `userDetails` with display name when signed in
7. [x] Test: sign-in button click triggers `signInWithPopup` on admin/login pages
8. [x] Test: sign-out button click triggers `signOut` — verify all 8 tests pass against current code before proceeding

Rules testing infrastructure (9-13):
9. [x] Install `@firebase/rules-unit-testing` as a dev dependency
10. [x] Add a vitest global setup file that starts the Firestore and Storage emulators before the rules test suite runs
11. [x] Add `test:emulator` script to `package.json` that runs `firebase emulators:exec "bun run test"`
12. [x] Write a smoke test that initializes a test environment against the emulator and passes — confirm it runs in CI mode
13. [x] Verify `bun run test` executes both jsdom auth tests and emulator rules tests together

Firestore rules audit + characterization (14-20):
14. [x] Run `firebase firestore:rules:get` and save output alongside repo `firestore.rules` — diff the two and document any collections covered in deployed rules but missing from the repo file
15. [x] Load the deployed rules into the Firestore emulator for characterization testing
16. [x] Test: anonymous read of `boardMembers` — record whether currently allowed or denied (ALLOWED)
17. [x] Test: anonymous write to `boardMembers` — record whether currently allowed or denied (DENIED)
18. [x] Test: signed-in non-admin write to `blogposts` — record whether currently allowed or denied (DENIED)
19. [x] Test: signed-in user writing `{role: "admin"}` to own `/users/{uid}` — record whether currently allowed or denied (DENIED in deployed; the repo file would ALLOW — see diff doc)
20. [x] Confirm all characterization tests pass against deployed rules loaded in emulator

---

## Sync from console (in progress — replaces steps 21-48)

- [x] Sync `firestore.rules` from Firebase Console into repo (verbatim copy of deployed rules, 2026-04-08)
- [x] Sync Storage rules from Firebase Console into repo as `storage.rules` (2026-04-08) — **discovered real production vulnerability: any signed-in user can write to any path**
- [x] Sync Firestore indexes via `firebase firestore:indexes` and overwrite `firestore.indexes.json` (2026-04-08) — added one missing `staffscholarship` composite index
- [x] Confirm there's no Realtime Database in use (nothing in `src/` imports `firebase/database`; only stale match is in webpack-bundled `public/app.js`)
- [x] Once everything is synced, draft a fresh cleanup plan against the accurate baseline (see below)

---

# Cleanup Plan v2 — drafted 2026-04-08

## What changed since v1

The v1 plan was written assuming the broken repo `firestore.rules` was live in
production. The audit (todos 14-20) and sync from console (above) proved
otherwise:

- **Firestore in production is fine.** The deployed rules correctly deny
  anonymous writes, non-admin writes, and writes to `/users` (the privesc
  vector simply doesn't exist live). Firestore work is now defense-in-depth,
  not bug-fix.
- **Storage in production is broken.** The deployed Storage rules allow any
  signed-in Google account to write to any path in the bucket. Sign-in is
  unrestricted (any Google account works). This is the real, exploitable
  vulnerability and is now todo #1.
- **`firebase.json` has no `firestore` or `storage` blocks.** Deploys have
  never pushed rules from the repo. Wiring this up is what permanently
  prevents the kind of drift that hid the Storage bug for so long.
- **The empty `firestore.indexes.json` was a latent bug too.** Production has
  one composite index on `staffscholarship` that the empty repo file would
  have wiped on next deploy, breaking the query at `src/app.js:174`. Now
  synced.

## Decisions (carried over from v1, still valid)

- **Trust model:** hardcoded admin UID list, encoded directly in both
  `firestore.rules` and `storage.rules` and the client. No Cloud Functions,
  no Auth blocking function. Sufficient for a small, stable admin set.
- **`/users` collection:** dropped from rules. The role is moved into the
  hardcoded UID list. Eliminates the latent privesc and removes a Firestore
  read on every admin page load.
- **Client-side gate:** UX-only fix. Hide admin forms by default, await the
  admin check, return early after redirect. The rules are the real
  enforcement.
- **Tests gate every change.** Snapshot the current behavior with
  characterization tests before rewriting; assert the new behavior in fresh
  tests; both suites must stay green.
- **Wire `firebase.json` last in each phase, deploy via preview channel
  first.** Wiring the repo into deploys is the riskiest single action. Each
  rules rewrite gets local emulator verification → preview-channel deploy →
  manual smoke test → production deploy.

## Phases

**Phase 1 — Get the keys (blocking, ~5 min of console work).**
We can't write `isAdmin()` rules without the actual admin UIDs.

**Phase 2 — Fix the live Storage vulnerability (urgent).**
Lock writes to admin UIDs only on the three real upload paths. Wire
`storage.rules` into `firebase.json`. Deploy.

**Phase 3 — Harden Firestore rules (defense in depth, not urgent).**
Move the admin check off `/users.role` to the hardcoded UID list. Remove
`/users` from rules. Wire `firestore.rules` and `firestore.indexes.json` into
`firebase.json`. Deploy.

**Phase 4 — Client-side gate fixes.**
Fix the `await` bug, hide admin forms by default, drop the `/users` read,
update the auth tests to drive admin status via UID instead of mocked
`getDoc`.

**Phase 5 — Config cleanup.**
Remove dead `database` block from `firebase.json` emulators. Document the
`staffscholarship` index. Final smoke test of the whole admin flow.

---

## Implementation Todo List

Phase 1 — admin UID list (blocking, 1):
1. [x] Collect Firebase Auth UIDs for every admin user from Firebase Console > Authentication > Users tab and paste them here so they can be hardcoded into rules and client
   - `CYoiZHjZ2beF0ZWUJHr5n9Qq3rz2`
   - `fKO4Sj1dgShfBmC44z0h7zNZ6Ik1`

Phase 2 — Storage rules fix (urgent live vulnerability, 2-12):
2. [x] Snapshot current `storage.rules` to `tests/fixtures/deployed-storage.rules` for characterization baseline (frozen copy of what's live today)
3. [x] Add `storage` to the `--only` list in the `test:emulator` script in `package.json` so the Storage emulator boots alongside Firestore + Auth
4. [x] Update `tests/setup/emulator-setup.js` to also detect `FIREBASE_STORAGE_EMULATOR_HOST` and expose an `EMCH_STORAGE_EMULATOR_AVAILABLE` flag
5. [x] Add a `tests/helpers/deployed-storage-env.js` helper that loads the storage fixture into a `@firebase/rules-unit-testing` environment (mirror of the existing Firestore helper)
6. [x] Test (characterization, current rules): anonymous read of `pdfDownloads/test.pdf` — record current behavior (expect: ALLOWED)
7. [x] Test (characterization, current rules): anonymous write to `images/boardMembers/x.jpg` — record current behavior (expect: DENIED)
8. [x] Test (characterization, current rules): signed-in non-admin write to `images/boardMembers/x.jpg` — record current behavior (expect: ALLOWED — this IS the vulnerability)
9. [x] Rewrite `storage.rules` with `isAdmin()` UID list: public read on everything; admin-only write on `pdfDownloads/`, `images/boardMembers/`, `images/scholars/`; default-deny all other paths
10. [x] Tests against new rules: anon read still allowed on the three known paths; anon write denied; signed-in non-admin write denied (the fix); admin write allowed; write to an unknown path denied even for admin
11. [x] Add `storage` block to `firebase.json` referencing `storage.rules`
12. [x] Deploy storage rules: run `firebase deploy --only storage`, then manually verify both admin accounts can still upload a PDF and a board member image (non-admin denial is already covered by the 11 emulator tests)

Phase 3 — Firestore rules hardening (defense in depth, 13-21):
13. [x] Snapshot current `firestore.rules` to `tests/fixtures/pre-rewrite-firestore.rules` (the deployed-firestore.rules fixture from Phase 1 already serves this purpose; just confirm it still matches `firestore.rules` byte-for-byte and skip if so)
14. [x] Rewrite `firestore.rules`: add `isAdmin()` helper using the hardcoded UID list; rules for `boardMembers`, `foundBoardMembers`, `staffscholarship`, `blogposts`, `govLink` (public read, `isAdmin()` write); remove `/users` match block entirely; add explicit `match /{document=**}` default-deny catch-all
15. [x] Tests against new rules: for each of the five collections, anon read allowed; anon write denied; signed-in non-admin write denied; admin (UID in list) write allowed
16. [x] Test: write to an unmatched collection (e.g. `randomCollection`) denied for everyone including admin (catches default-deny)
17. [x] Test: read of `/users/{uid}` denied for everyone including the owner (the `/users` collection no longer exists in rules at all)
18. [x] Run the existing characterization tests (todos 16-19) and confirm they still pass against the **frozen fixture** — they're a snapshot of the old deployed rules and should be unaffected by the rewrite
19. [x] Add `firestore` block to `firebase.json` referencing `firestore.rules` and `firestore.indexes.json`
20. [x] Run `bun run test:emulator` end-to-end and confirm all suites green
21. [x] Deploy firestore rules + indexes to a preview/staging channel, manually verify: admin can edit a board member, non-admin sees the existing public site unchanged, the `staffscholarship` query at `src/app.js:174` still returns results, then promote to production

Phase 4 — client-side gate fixes (22-28):
22. [x] Add `hidden` attribute to all admin form wrapper `<div>` sections in `admin.html` so nothing is visible on page load
23. [x] Replace `checkAdminAccess()` in `src/app.js` with a direct `user.uid` check against the hardcoded UID list — no Firestore read; export the UID list (or inline it) so it's the single source of truth alongside the rules version
24. [x] Make the `onAuthStateChanged` callback `async` and `await checkAdminAccess(user)` before unhiding any UI; add `return` immediately after the non-admin redirect so form binding code never runs
25. [x] Move all admin form submit handler binding (currently around `src/app.js:1023`) inside the admin-access-confirmed branch
26. [x] Remove all `doc(db, 'users', ...)` and `collection(db, 'users')` references from `src/app.js`
27. [x] Update `tests/auth.test.js`: replace the `getDoc` mocks that drive admin/non-admin status with `user.uid` values that are/aren't in the hardcoded list; verify all 8 auth tests still pass (the *behavior* — redirect vs. unhide UI — is what's locked down, the input mechanism legitimately changes with the implementation)
28. [x] Run `bun run build` and manually verify: admin user → forms appear with no flash, non-admin → clean redirect with no form flash, signed-out → clean redirect (build verified; browser smoke-test is for the user to run at end of branch)

Phase 5 — config cleanup (29-31):
29. [x] Remove the dead `database` block from `firebase.json` emulators (Realtime Database is not used by this project)
30. [x] Add a one-line comment in `firestore.indexes.json` (or a short note in CLAUDE.md) explaining that the `staffscholarship` composite index backs the query at `src/app.js:174`, so future contributors know not to drop it (added inline comment above the query in `src/app.js` — JSON doesn't support comments and this location is more discoverable)
31. [ ] Final end-to-end smoke: deploy everything to preview channel, walk through the admin page (add/edit/delete a board member, upload a PDF, add a scholar), then promote to production and re-run the smoke on prod

---

## Notes / things considered but not in scope

- **Restricting Google sign-in to specific email domains.** The current setup
  lets any Google account sign in. Once Storage and Firestore writes are
  locked to the admin UID list, this is no longer load-bearing for security
  — a non-admin signed-in user can't do anything destructive. Worth doing
  later as a UX improvement (don't let strangers see the "Hello stranger,
  click here for admin" UI), but not required for this cleanup.
- **App Check.** Not enabled today, would defend against scripted abuse of
  the API surface from outside the official client. Out of scope; the rules
  are the right place for the trust boundary.
- **Cloud Functions / Auth blocking function.** Decision in v1 was to skip
  these and use a hardcoded UID list, which is still the right call for an
  admin set this small.
- **Cleaning up `public/app.js`.** This is a stale webpack build artifact in
  the repo. Not touched here; it's only flagged because it's the source of
  the false positive `firebase/database` grep match earlier.
