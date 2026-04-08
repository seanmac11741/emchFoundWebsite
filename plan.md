# Security Fix Plan

## Decisions

- **Trust model:** hardcoded admin UID list in rules and client JS — no Auth blocking function, no Cloud Functions required. Sufficient for a small, stable admin set.
- **`/users` collection:** dropped entirely. It was only used to store `role`, which is now encoded directly in the rules file. Eliminates the privilege escalation and removes a Firestore read on every admin page load.
- **Client-side gate:** fix the `await` bug and hide admin UI by default to eliminate the flash-of-admin-page. UX only — the rules are the real enforcement.
- **Rules tests:** include vitest tests against the Firebase emulator to catch future regressions.
- **Characterization tests first:** this is a working production repo. Before changing anything, write tests that document the current auth flow behavior. These tests define what "working" means and guard against regressions during the security fixes.

## What will be done

### 1. Characterization tests — auth flow (before any changes)
- Write vitest tests covering the current auth flow behavior in `src/app.js`: `onAuthStateChanged` redirects unauthenticated users away from admin, shows signed-in state correctly, and wires up sign-in/sign-out buttons.
- Tests run against jsdom (no emulator needed at this stage) using mocked Firebase Auth.
- These pass against the current code and must continue to pass after the security changes.

### 2. Rules testing infrastructure
- Add `@firebase/rules-unit-testing` as a dev dependency.
- Configure vitest to run rules tests against the Firebase emulator.
- Integrate with `bun run test` so all tests (auth + rules) run together.
- This must be in place before any rules characterization or TDD work in steps 3 and 4.

### 3. Firestore rules
- **Audit first:** manually pull the deployed rules from the Firebase Console (`firebase firestore:rules:get`) and compare against the repo's `firestore.rules` before making any changes. The deployed rules are currently working in production — do not overwrite until the diff is understood and any gaps are captured.
- Write characterization tests against the deployed rules loaded in the emulator to document current allow/deny behavior as a baseline.
- Rewrite `firestore.rules` from scratch with an `isAdmin()` helper that checks a hardcoded UID list.
- Add explicit rules for every collection the admin page uses: `boardMembers`, `foundBoardMembers`, `staffscholarship`, `blogposts`, `govLink` — public read, admin write.
- Fix existing typo: deployed rules reference `/blog` but the app uses `blogposts`.
- Remove the `/users` collection rules entirely.
- Default-deny all other collections.
- Add `firestore.rules` reference to `firebase.json` so deploys are always in sync with the repo.

### 4. Storage rules
- **Audit first:** pull the deployed Storage rules from the Firebase Console and write characterization tests against them in the emulator to document current baseline behavior.
- Create `storage.rules` in the repo (currently absent).
- Apply the same `isAdmin()` UID pattern: public read, admin write on `pdfDownloads/`, `images/boardMembers/`, and `images/scholars/`. Default-deny everything else.
- Add `storage.rules` reference to `firebase.json`.

### 5. Client-side gate (`src/app.js` + `admin.html`)
- Replace the Firestore-based `checkAdminAccess()` with a direct UID check against the same hardcoded list.
- `await` the admin check before unhiding any UI.
- Return early after redirect so form handlers are never bound for non-admins.
- Hide all admin form sections by default in `admin.html`; reveal only after access is confirmed.
- Remove all references to the `/users` Firestore collection.

---

## Implementation Todo List

Auth flow characterization tests (1-8):
1. [] Create `tests/auth.test.js` with vitest + jsdom environment
2. [] Mock the Firebase Auth module (`vi.mock`) so no real Firebase calls are made
3. [] Test: unauthenticated user visiting admin page → `window.location.href` set to `login` and alert shown
4. [] Test: authenticated user with non-admin UID visiting admin page → redirected to `index.html`
5. [] Test: authenticated admin user visiting admin page → `whenSignedIn` section is unhidden, `whenSignedOut` is hidden
6. [] Test: `onAuthStateChanged` populates `userDetails` with display name when signed in
7. [] Test: sign-in button click triggers `signInWithPopup` on admin/login pages
8. [] Test: sign-out button click triggers `signOut` — verify all 8 tests pass against current code before proceeding

Rules testing infrastructure (9-13):
9. [] Install `@firebase/rules-unit-testing` as a dev dependency
10. [] Add a vitest global setup file that starts the Firestore and Storage emulators before the rules test suite runs
11. [] Add `test:emulator` script to `package.json` that runs `firebase emulators:exec "bun run test"`
12. [] Write a smoke test that initializes a test environment against the emulator and passes — confirm it runs in CI mode
13. [] Verify `bun run test` executes both jsdom auth tests and emulator rules tests together

Firestore rules audit + characterization (14-20):
14. [] Run `firebase firestore:rules:get` and save output alongside repo `firestore.rules` — diff the two and document any collections covered in deployed rules but missing from the repo file
15. [] Load the deployed rules into the Firestore emulator for characterization testing
16. [] Test: anonymous read of `boardMembers` — record whether currently allowed or denied
17. [] Test: anonymous write to `boardMembers` — record whether currently allowed or denied
18. [] Test: signed-in non-admin write to `blogposts` — record whether currently allowed or denied
19. [] Test: signed-in user writing `{role: "admin"}` to own `/users/{uid}` — record whether currently allowed or denied
20. [] Confirm all characterization tests pass against deployed rules loaded in emulator

Firestore rules rewrite (21-30):
21. [] Collect the Firebase Auth UID for each admin user from Firebase Console > Authentication > Users tab
22. [] Rewrite `firestore.rules` with an `isAdmin()` function checking the hardcoded UID list
23. [] Add `boardMembers`: public read, admin write
24. [] Add `foundBoardMembers`: public read, admin write
25. [] Add `staffscholarship`: public read, admin write
26. [] Add `blogposts`: public read, admin write (replaces the broken `/blog` rule)
27. [] Add `govLink`: public read, admin write
28. [] Remove `/users` match block entirely
29. [] Add default-deny catch-all for all other paths
30. [] Add `firestore` block to `firebase.json` referencing `firestore.rules` and `firestore.indexes.json` — verify `bun run test` passes with new rules

Storage rules audit + rewrite (31-39):
31. [] Copy deployed Storage rules from Firebase Console > Storage > Rules tab into a new `storage.rules` file
32. [] Load deployed Storage rules into the Storage emulator
33. [] Test: anonymous read from `pdfDownloads/` — record current behavior
34. [] Test: anonymous read from `images/boardMembers/` — record current behavior
35. [] Test: signed-in non-admin write to `images/boardMembers/` — record current behavior
36. [] Confirm all storage characterization tests pass against deployed rules
37. [] Rewrite `storage.rules` with same `isAdmin()` UID list: public read, admin write on `pdfDownloads/`, `images/boardMembers/`, `images/scholars/`; default-deny all other paths
38. [] Add `storage` block to `firebase.json` referencing `storage.rules`
39. [] Update test expectations to match new rules — verify all tests pass

Client-side gate (40-48):
40. [] Add `hidden` attribute to all admin form wrapper `<div>` sections in `admin.html` so nothing is visible on page load
41. [] Rewrite `checkAdminAccess()` in `src/app.js` to check `user.uid` against the hardcoded UID list — no Firestore read
42. [] Make `onAuthStateChanged` callback async and `await checkAdminAccess(user)` before unhiding any UI
43. [] Add `return` immediately after the redirect in the non-admin branch so form binding code never runs
44. [] Move all admin form submit handler binding (currently at line 1023+) inside the admin-access-confirmed branch
45. [] Remove all `doc(db, 'users', ...)` and `collection(db, 'users')` references from `src/app.js`
46. [] Run `bun run build` and manually verify: admin user → forms appear, non-admin → clean redirect with no form flash
47. [] Re-run auth characterization tests — verify all 8 still pass with the rewritten gate
48. [] Deploy to Firebase staging/preview channel and do a final end-to-end check before pushing to production
