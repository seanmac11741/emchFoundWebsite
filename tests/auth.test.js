import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as firebaseAuth from 'firebase/auth';

// --- Firebase mocks: prevent any real network/SDK initialization. ---
// Tests capture the onAuthStateChanged callback so they can drive the auth
// flow synchronously.
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

// --- Test helpers --------------------------------------------------------

function setupAdminDom() {
  document.body.innerHTML = `
    <div class="menu-toggle"></div>
    <nav class="navbar"><ul></ul></nav>
    <div id="whenSignedIn" hidden></div>
    <div id="whenSignedOut"></div>
    <button id="signInBtn"></button>
    <button id="signOutBtn"></button>
    <div id="userDetails"></div>
    <div id="boardMemCards"></div>
    <div id="FoundboardMemCards"></div>
    <div id="blogPostContainer"></div>
    <div id="singleBlogPost"></div>
    <div id="govContactLink"></div>
    <div id="pdfFilesdiv"></div>
    <div id="staffScholarshipCards"></div>
    <div id="nonStaffScholarshipCards"></div>
    <button id="submitNewBoardMember"></button>
    <button id="submitNewScholar"></button>
    <button id="submitNewFoundBoardMember"></button>
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
  // jsdom's window.location is normally read-only; replace it wholesale.
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

  it('redirects authenticated non-admin users to index.html', async () => {
    // getDoc returns a doc that does not exist → checkAdminAccess fails.
    const firestore = await import('firebase/firestore');
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) });

    await loadAppOnPath('/admin.html', setupAdminDom);
    await capturedAuthCallback({ uid: 'non-admin-uid', displayName: 'Nobody' });
    // Yield once so the async checkAdminAccess() inside the callback can settle.
    await new Promise((r) => setTimeout(r, 0));

    expect(window.alert).toHaveBeenCalledWith('Access Denied! You are not an admin.');
    expect(window.location.href).toBe('index.html');
  });

  it('shows whenSignedIn and hides whenSignedOut for admin users', async () => {
    const firestore = await import('firebase/firestore');
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    });

    await loadAppOnPath('/admin.html', setupAdminDom);
    await capturedAuthCallback({ uid: 'admin-uid', displayName: 'Admin' });
    await new Promise((r) => setTimeout(r, 0));

    const whenSignedIn = document.getElementById('whenSignedIn');
    const whenSignedOut = document.getElementById('whenSignedOut');
    expect(whenSignedIn.hidden).toBe(false);
    expect(whenSignedOut.hidden).toBe(true);
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
