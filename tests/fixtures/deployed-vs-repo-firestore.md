# Deployed vs. repo `firestore.rules` — diff (audit, todo 14)

Source of truth for this audit:

- **Deployed** — copy-pasted from Firebase Console > Firestore Database > Rules
  on 2026-04-08, saved verbatim at `tests/fixtures/deployed-firestore.rules`.
- **Repo** — `firestore.rules` at the root of this repository.

## Summary

The repo file is **drastically out of sync** with what is actually deployed.
The repo file declares only two collections (`/users` and `/blog`), and the
`/blog` rule is broken (the app uses `blogposts`). Every collection that the
admin page actually writes to is governed by the deployed rules, **not** by
anything in the repo. Re-deploying the repo file as-is would immediately break
production.

## Collections in deployed rules but missing from repo

| Collection           | Deployed read | Deployed write                      | In repo? |
| -------------------- | ------------- | ----------------------------------- | -------- |
| `boardMembers`       | public        | signed-in + `/users/{uid}.role==admin` | no   |
| `foundBoardMembers`  | public        | signed-in + `/users/{uid}.role==admin` | no   |
| `staffscholarship`   | public        | signed-in + `/users/{uid}.role==admin` | no   |
| `blogposts`          | public        | signed-in + `/users/{uid}.role==admin` | no   |
| `govLink`            | public        | signed-in + `/users/{uid}.role==admin` | no   |

## Collections in repo but not in deployed rules

| Collection | Repo behavior                                     | Notes |
| ---------- | ------------------------------------------------- | ----- |
| `/blog`    | public read, admin write (via `/users/{uid}.role`) | **Typo / dead rule.** The app writes to `blogposts`, not `blog`. This rule has never matched anything. Flagged for removal in step 26. |

## `/users` collection differences

- **Deployed:** `allow read: if request.auth != null && request.auth.uid == uid;`
  (read-only by the owner, no write rule → writes default-deny).
- **Repo:** `allow read, write: if request.auth != null && request.auth.uid == uid;`
  (owner can both read **and write** their own doc, including `role`).

The repo version is the privilege-escalation vector called out in the security
plan: a signed-in user could write `{role: "admin"}` to their own
`/users/{uid}` document and then satisfy the admin-write predicate on every
content collection. The deployed rules avoid this only because they omit the
write rule for `/users` entirely.

The plan (step 28) removes the `/users` collection from rules altogether and
moves the admin check to a hardcoded UID list, which closes this gap on both
sides.

## Default-deny coverage

Neither the deployed rules nor the repo file contains an explicit default-deny
catch-all. Firestore's implicit default is deny, so unmatched paths are
already locked, but adding an explicit `match /{document=**}` block (step 29)
makes the intent obvious to future readers.

## Action items rolled into later todos

- Steps 22-29: rewrite `firestore.rules` from scratch covering all five real
  collections, with `isAdmin()` UID-list check and explicit default-deny.
- Step 30: wire `firestore.rules` into `firebase.json` so the repo file is
  what gets deployed and this drift cannot recur.
