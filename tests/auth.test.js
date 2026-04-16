import { describe, it, expect, vi, afterEach } from 'vitest';
import * as firebaseAuth from 'firebase/auth';

// --- Firebase mocks: prevent any real network/SDK initialization. ---
let capturedAuthCallback = null;

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));
vi.mock('firebase/performance', () => ({ getPerformance: vi.fn() }));
vi.mock('firebase/analytics', () => ({ getAnalytics: vi.fn() }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(function () {}),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'test', displayName: 'Test' } })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    capturedAuthCallback = cb;
    return () => {};
  }),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ forEach: () => {}, docs: [] })),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  where: vi.fn(),
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.test/x.jpg')),
  deleteObject: vi.fn(() => Promise.resolve()),
  listAll: vi.fn(() => Promise.resolve({ items: [], prefixes: [] })),
}));

// Admin UIDs: kept in sync with the list in src/app.js and the rules files.
const ADMIN_UID = 'CYoiZHjZ2beF0ZWUJHr5n9Qq3rz2';
const NON_ADMIN_UID = 'random-non-admin-uid';

// --- Test helpers --------------------------------------------------------

function setupAdminDom() {
  document.body.innerHTML = `
    <div class="menu-toggle"></div>
    <nav class="navbar"><ul></ul></nav>
    <div id="adminOnly" hidden>
      <button id="submitNewBoardMember"></button>
      <button id="submitNewScholar"></button>
      <button id="submitNewFoundBoardMember"></button>
      <div id="boardMemCards"></div>
      <div id="FoundboardMemCards"></div>
      <div id="blogPostContainer"></div>
      <div id="govContactLink"></div>
      <div id="pdfFilesdiv"></div>
      <div id="staffScholarshipCards"></div>
      <div id="nonStaffScholarshipCards"></div>
    </div>
    <div id="singleBlogPost"></div>
    <div id="whenSignedIn" hidden></div>
    <div id="whenSignedOut"></div>
    <button id="signInBtn"></button>
    <button id="signOutBtn"></button>
    <div id="userDetails"></div>
  `;
}

function setupLoginDom() {
  document.body.innerHTML = `
    <div class="menu-toggle"></div>
    <nav class="navbar"><ul></ul></nav>
    <div id="whenSignedIn" hidden></div>
    <div id="whenSignedOut"></div>
    <button id="signInBtn"></button>
    <button id="signOutBtn"></button>
    <div id="userDetails"></div>
  `;
}

function fakeLocation(pathname) {
  delete window.location;
  window.location = {
    pathname,
    href: pathname,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  };
}

async function loadAppOnPath(pathname, domSetup) {
  capturedAuthCallback = null;
  domSetup();
  fakeLocation(pathname);
  window.alert = vi.fn();
  vi.resetModules();
  await import('../src/app.js');
}

async function flush() {
  // Yield a few times so any async work in onAuthStateChanged can settle.
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

afterEach(() => {
  vi.clearAllMocks();
  capturedAuthCallback = null;
  document.body.innerHTML = '';
});

describe('auth.test.js scaffold', () => {
  it('runs in a jsdom environment with document and window globals', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
    expect(document.createElement('div')).toBeInstanceOf(window.HTMLElement);
  });

  it('mocks firebase/auth so getAuth and onAuthStateChanged are vi spies', () => {
    expect(vi.isMockFunction(firebaseAuth.getAuth)).toBe(true);
    expect(vi.isMockFunction(firebaseAuth.onAuthStateChanged)).toBe(true);
    expect(vi.isMockFunction(firebaseAuth.signInWithPopup)).toBe(true);
    expect(vi.isMockFunction(firebaseAuth.signOut)).toBe(true);
  });
});

describe('auth flow on the admin page', () => {
  it('redirects unauthenticated visitors to the login page with an alert', async () => {
    await loadAppOnPath('/admin.html', setupAdminDom);
    expect(typeof capturedAuthCallback).toBe('function');

    await capturedAuthCallback(null);

    expect(window.alert).toHaveBeenCalledWith('Access Denied! You are not an admin.');
    expect(window.location.href).toBe('login');
  });

  it('redirects authenticated non-admin users to index.html and keeps adminOnly hidden', async () => {
    await loadAppOnPath('/admin.html', setupAdminDom);
    await capturedAuthCallback({ uid: NON_ADMIN_UID, displayName: 'Nobody' });
    await flush();

    expect(window.alert).toHaveBeenCalledWith('Access Denied! You are not an admin.');
    expect(window.location.href).toBe('index.html');
    // No flash of admin UI
    expect(document.getElementById('adminOnly').hidden).toBe(true);
  });

  it('shows adminOnly and signed-in UI for admin users (UID in list)', async () => {
    await loadAppOnPath('/admin.html', setupAdminDom);
    await capturedAuthCallback({ uid: ADMIN_UID, displayName: 'Admin' });
    await flush();

    const whenSignedIn = document.getElementById('whenSignedIn');
    const whenSignedOut = document.getElementById('whenSignedOut');
    const adminOnly = document.getElementById('adminOnly');
    expect(whenSignedIn.hidden).toBe(false);
    expect(whenSignedOut.hidden).toBe(true);
    expect(adminOnly.hidden).toBe(false);
  });

  it('does not call firestore doc(db, "users", uid) — admin check is UID-only, no /users read', async () => {
    const firestore = await import('firebase/firestore');
    await loadAppOnPath('/admin.html', setupAdminDom);
    await capturedAuthCallback({ uid: ADMIN_UID, displayName: 'Admin' });
    await flush();

    // The admin check must not touch the /users collection. Verify no call
    // to doc() was made with 'users' as the collection string.
    const usersCalls = firestore.doc.mock.calls.filter((args) =>
      args.some((arg) => arg === 'users'),
    );
    expect(usersCalls.length).toBe(0);
  });
});

describe('userDetails rendering', () => {
  it('populates userDetails with the display name when a user signs in', async () => {
    await loadAppOnPath('/login.html', setupLoginDom);
    await capturedAuthCallback({ uid: 'u1', displayName: 'Jane Doe' });

    const userDetails = document.getElementById('userDetails');
    expect(userDetails.innerHTML).toContain('Hello Jane Doe!');
    expect(userDetails.innerHTML).toContain('admin.html');
  });
});

describe('non-admin pages without sign-in UI (e.g. /district)', () => {
  function setupPublicPageDom() {
    // A public page like district.html has no whenSignedIn/whenSignedOut/userDetails
    // elements at all — only the navbar. The auth callback must not crash here.
    document.body.innerHTML = `
      <div class="menu-toggle"></div>
      <nav class="navbar"><ul></ul></nav>
      <div id="boardMemCards"></div>
    `;
  }

  it('does not throw when a signed-in user visits a page missing sign-in UI elements', async () => {
    await loadAppOnPath('/district', setupPublicPageDom);
    // Should not throw "Cannot set properties of null (setting 'hidden')".
    await expect(
      capturedAuthCallback({ uid: ADMIN_UID, displayName: 'Admin' }),
    ).resolves.not.toThrow();
    await flush();
  });

  it('does not throw when a signed-out user visits a page missing sign-in UI elements', async () => {
    await loadAppOnPath('/district', setupPublicPageDom);
    await expect(capturedAuthCallback(null)).resolves.not.toThrow();
    await flush();
  });
});

describe('sign-in / sign-out button wiring', () => {
  it('clicking signInBtn on the login page calls signInWithPopup', async () => {
    await loadAppOnPath('/login.html', setupLoginDom);
    document.getElementById('signInBtn').click();

    expect(firebaseAuth.signInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('clicking signOutBtn on the login page calls signOut', async () => {
    await loadAppOnPath('/login.html', setupLoginDom);
    document.getElementById('signOutBtn').click();

    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
  });
});
