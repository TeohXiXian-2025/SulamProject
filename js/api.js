// Data layer. Every page talks to the backend only through these functions.
//
//   - Firebase mode (js/config.js has a config): free Firestore database +
//     Firebase Authentication, live updates for everyone.
//   - Demo mode (no config): same functions, data kept in this browser's
//     localStorage, so the site can be tried without any setup.
import { firebaseConfig } from './config.js';
import { DEFAULT_CENTRE, STARTER_STORES } from './seed.js';
import { uid, sortStores, sortItems } from './util.js';

const FIREBASE_VERSION = '10.12.2';

let apiPromise;
export function getApi() {
  // A local preview can use seeded browser data without contacting the live Firebase project.
  const localDemo = ['localhost', '127.0.0.1'].includes(location.hostname)
    && new URLSearchParams(location.search).get('demo') === '1';
  apiPromise ??= firebaseConfig && !localDemo ? firebaseApi(firebaseConfig) : Promise.resolve(demoApi());
  return apiPromise;
}

const clean = (o) => JSON.parse(JSON.stringify(o ?? null));

// Early versions saved the shop as "金成小贩中心 / Kim Seng Hawker Centre".
// Show the real name instead; the manager page saves the correction.
export const OLD_NAMES = { nameZh: '金成小贩中心', name: 'Kim Seng Hawker Centre' };
function fixOldName(c) {
  const out = { ...c, needsNameFix: false };
  for (const k of ['nameZh', 'name']) {
    if (out[k] === OLD_NAMES[k]) { out[k] = DEFAULT_CENTRE[k]; out.needsNameFix = true; }
  }
  return out;
}
const lower = (s) => String(s || '').trim().toLowerCase();

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------
async function firebaseApi(config) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [appMod, A, F] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);
  const app = appMod.initializeApp(config);
  const auth = A.getAuth(app);
  let db;
  try {
    // Caches data on the phone so repeat visits download less.
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch {
    db = F.getFirestore(app);
  }

  const storesCol = F.collection(db, 'stores');
  const centreRef = F.doc(db, 'config', 'centre');
  const adminsRef = F.doc(db, 'config', 'admins');
  const withId = (d) => ({ id: d.id, ...d.data() });
  const millis = (v) => (v?.toMillis ? v.toMillis() : v || Date.now());
  const mapUser = (u) => u && {
    uid: u.uid, email: lower(u.email), name: u.displayName || '', verified: u.emailVerified,
    provider: u.providerData[0]?.providerId,
  };
  const randomPassword = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, '0')).join('');
  const onErr = (e) => console.error(e);

  return {
    mode: 'firebase',

    onAuth: (cb) => A.onAuthStateChanged(auth, (u) => cb(mapUser(u))),
    signInGoogle: () => A.signInWithPopup(auth, new A.GoogleAuthProvider()),
    signInEmail: (email, pw) => A.signInWithEmailAndPassword(auth, email, pw),
    signOut: () => A.signOut(auth),
    resetPassword: (email) => A.sendPasswordResetEmail(auth, email),
    changePassword: (pw) => A.updatePassword(auth.currentUser, pw),
    sendVerification: () => A.sendEmailVerification(auth.currentUser),
    refreshUser: async () => {
      await auth.currentUser?.reload();
      return mapUser(auth.currentUser);
    },
    // Creates an auth account for a stall owner with a temporary random password,
    // then emails them a password-reset link so they choose their own password.
    async createOwnerAccount(email) {
      const cred = await A.createUserWithEmailAndPassword(auth, email, randomPassword());
      await A.sendPasswordResetEmail(auth, email);
      return cred.user.uid;
    },

    watchCentre: (cb) => F.onSnapshot(centreRef, (snap) => cb(fixOldName(snap.data() || DEFAULT_CENTRE)), onErr),
    updateCentre: (patch) => F.setDoc(centreRef, clean(patch), { merge: true }),
    getAdmins: async () => (await F.getDoc(adminsRef)).data()?.emails || null,
    claimAdmin: (email) => F.setDoc(adminsRef, { emails: [lower(email)] }),
    setAdmins: (emails) => F.setDoc(adminsRef, { emails: emails.map(lower) }),

    watchStores: (cb) => F.onSnapshot(storesCol, (snap) => cb(sortStores(snap.docs.map(withId))), onErr),
    watchStore: (id, cb) => F.onSnapshot(F.doc(db, 'stores', id), (snap) => cb(snap.exists() ? withId(snap) : null), onErr),
    watchOwnedStores: (u, cb) => {
      let byUid = [];
      let byEmail = [];
      const emit = () => {
        const seen = new Set();
        const merged = [...byUid, ...byEmail].filter((s) => !seen.has(s.id) && seen.add(s.id));
        cb(sortStores(merged));
      };
      const un1 = F.onSnapshot(F.query(storesCol, F.where('ownerUid', '==', u.uid)), (snap) => {
        byUid = snap.docs.map(withId); emit();
      }, onErr);
      const un2 = u.verified && u.email ? F.onSnapshot(F.query(storesCol, F.where('ownerEmail', '==', u.email)), (snap) => {
        byEmail = snap.docs.map(withId); emit();
      }, onErr) : () => {};
      return () => { un1(); un2(); };
    },
    createStore: async (data) => (await F.addDoc(storesCol, clean(data))).id,
    updateStore: (id, patch) => F.updateDoc(F.doc(db, 'stores', id), clean(patch)),
    updateStores: (patches) => {
      const batch = F.writeBatch(db);
      for (const [id, patch] of Object.entries(patches)) batch.update(F.doc(db, 'stores', id), clean(patch));
      return batch.commit();
    },
    deleteStore: (id) => F.deleteDoc(F.doc(db, 'stores', id)),

    watchItems: (storeId, cb) => F.onSnapshot(F.collection(db, 'stores', storeId, 'items'),
      (snap) => cb(sortItems(snap.docs.map(withId))), onErr),
    addItem: (storeId, data) => F.addDoc(F.collection(db, 'stores', storeId, 'items'), {
      ...clean(data), createdAt: F.serverTimestamp(),
    }),
    updateItem: (storeId, itemId, patch) => F.updateDoc(F.doc(db, 'stores', storeId, 'items', itemId), clean(patch)),
    deleteItem: (storeId, itemId) => F.deleteDoc(F.doc(db, 'stores', storeId, 'items', itemId)),

    watchReviews: (storeId, cb) => F.onSnapshot(
      F.query(F.collection(db, 'stores', storeId, 'reviews'), F.orderBy('createdAt', 'desc')),
      (snap) => cb(snap.docs.map((d) => ({
        id: d.id, ...d.data(), createdAt: millis(d.data().createdAt),
      }))),
      onErr,
    ),
    saveReview: (storeId, user, { rating, text }) => F.setDoc(F.doc(db, 'stores', storeId, 'reviews', user.uid), {
      rating, text, name: (user.name || 'Customer').slice(0, 60), createdAt: F.serverTimestamp(),
    }),
    deleteReview: (storeId, reviewUid) => F.deleteDoc(F.doc(db, 'stores', storeId, 'reviews', reviewUid)),
  };
}

// ---------------------------------------------------------------------------
// Demo (browser only)
// ---------------------------------------------------------------------------
function demoApi() {
  const KEY = 'kimseng-demo-pure-v5';
  const USER_KEY = 'kimseng-demo-user';
  const listeners = new Set();
  const authListeners = new Set();

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  };
  let db = read() || seed();
  let user = null;
  try { user = JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { /* ignore */ }

  function seed() {
    const data = { centre: clean(DEFAULT_CENTRE), admins: null, stores: {}, items: {}, reviews: {}, accounts: {} };
    for (const s of STARTER_STORES) {
      const id = `s${s.number}`;
      const stall = clean(s);
      stall.ownerUid = '';
      stall.ownerEmail = '';
      data.stores[id] = stall;
      data.items[id] = {};
    }
    return data;
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      throw new Error('Demo storage is full — remove some photos.');
    }
    emit();
  }
  const emit = () => listeners.forEach((fn) => fn());
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { db = read() || seed(); emit(); }
  });
  function watch(getter, cb) {
    const fn = () => cb(clean(getter()));
    listeners.add(fn);
    setTimeout(fn, 0);
    return () => listeners.delete(fn);
  }
  function setUser(u) {
    user = u;
    try { sessionStorage.setItem(USER_KEY, JSON.stringify(u)); } catch { /* ignore */ }
    authListeners.forEach((fn) => fn(u));
  }
  const fail = (code, message) => Object.assign(new Error(message), { code });
  const isAdmin = () => user && db.admins?.includes(user.email);
  const ownsStore = (id) => user && (db.stores[id]?.ownerUid === user.uid
    || (user.verified && !!db.stores[id]?.ownerEmail && db.stores[id].ownerEmail === user.email));
  const mustAdmin = () => { if (!isAdmin()) throw fail('permission-denied', 'Missing or insufficient permissions.'); };
  const mustOwn = (id) => { if (!isAdmin() && !ownsStore(id)) throw fail('permission-denied', 'Missing or insufficient permissions.'); };
  const storeList = () => sortStores(Object.entries(db.stores).map(([id, s]) => ({ id, ...s })));

  return {
    mode: 'demo',
    resetDemo() { localStorage.removeItem(KEY); db = seed(); persist(); },

    onAuth(cb) {
      authListeners.add(cb);
      setTimeout(() => cb(user), 0);
      return () => authListeners.delete(cb);
    },
    async signInGoogle() {
      const email = window.prompt('Demo mode: enter any Gmail address to sign in with Google:');
      if (!email) return;
      const cleanEmail = lower(email.trim());
      let acc = db.accounts[cleanEmail];
      if (!acc) {
        acc = { password: '', uid: `g-${cleanEmail}`, verified: true };
        db.accounts[cleanEmail] = acc;
        persist();
      }
      setUser({ uid: acc.uid, email: cleanEmail, name: cleanEmail.split('@')[0], provider: 'google.com', verified: true });
    },
    async signInEmail(email, pw) {
      const cleanEmail = lower(email?.trim());
      if (!cleanEmail || !pw) throw fail('auth/invalid-credential', 'Please enter email and password');
      let acc = db.accounts[cleanEmail];
      if (!acc) {
        // Self-registration in demo mode: auto-create account for entered credentials
        acc = { password: pw, uid: `u-${uid()}`, verified: true };
        db.accounts[cleanEmail] = acc;
        persist();
      } else if (acc.password !== pw) {
        throw fail('auth/invalid-credential', 'Wrong email or password');
      }
      setUser({ uid: acc.uid, email: cleanEmail, name: '', provider: 'password', verified: !!acc.verified });
    },
    async signOut() { setUser(null); },
    async resetPassword() { /* nothing to send in demo mode */ },
    async changePassword(pw) {
      const acc = Object.values(db.accounts).find((a) => a.uid === user?.uid);
      if (acc) { acc.password = pw; persist(); }
    },
    sendVerification: async () => {
      const acc = db.accounts[user?.email];
      if (acc) { acc.verified = true; persist(); }
    },
    refreshUser: async () => {
      const acc = db.accounts[user?.email];
      if (acc) setUser({ ...user, verified: !!acc.verified });
      return user;
    },
    async createOwnerAccount(email) {
      mustAdmin();
      const cleanEmail = lower(email?.trim());
      const acc = db.accounts[cleanEmail];
      if (acc) return null;
      const id = `u-${uid()}`;
      db.accounts[cleanEmail] = { password: 'password123', uid: id, verified: true };
      persist();
      return id;
    },

    watchCentre: (cb) => watch(() => db.centre, cb),
    async updateCentre(patch) { mustAdmin(); db.centre = { ...db.centre, ...clean(patch) }; persist(); },
    async getAdmins() { return db.admins ? [...db.admins] : null; },
    async claimAdmin(email) {
      if (db.admins) throw fail('permission-denied', 'Admin already exists');
      db.admins = [lower(email)]; persist();
    },
    async setAdmins(emails) { mustAdmin(); db.admins = emails.map(lower); persist(); },

    watchStores: (cb) => watch(storeList, cb),
    watchStore: (id, cb) => watch(() => (db.stores[id] ? { id, ...db.stores[id] } : null), cb),
    watchOwnedStores: (u, cb) => watch(() => storeList().filter((s) => s.ownerUid === u.uid
      || (u.verified && s.ownerEmail && s.ownerEmail === u.email)), cb),
    async createStore(data) {
      mustAdmin();
      const id = `s-${uid()}`;
      db.stores[id] = clean(data); db.items[id] = {}; db.reviews[id] = {};
      persist();
      return id;
    },
    async updateStore(id, patch) { mustOwn(id); db.stores[id] = { ...db.stores[id], ...clean(patch) }; persist(); },
    async updateStores(patches) {
      mustAdmin();
      for (const [id, p] of Object.entries(patches)) db.stores[id] = { ...db.stores[id], ...clean(p) };
      persist();
    },
    async deleteStore(id) {
      mustAdmin();
      delete db.stores[id]; delete db.items[id]; delete db.reviews[id];
      persist();
    },

    watchItems: (storeId, cb) => watch(() => sortItems(Object.entries(db.items[storeId] || {}).map(([id, it]) => ({ id, ...it }))), cb),
    async addItem(storeId, data) {
      mustOwn(storeId);
      (db.items[storeId] ??= {})[`i-${uid()}`] = { ...clean(data), createdAt: Date.now() };
      persist();
    },
    async updateItem(storeId, itemId, patch) {
      mustOwn(storeId);
      db.items[storeId][itemId] = { ...db.items[storeId][itemId], ...clean(patch) };
      persist();
    },
    async deleteItem(storeId, itemId) { mustOwn(storeId); delete db.items[storeId][itemId]; persist(); },

    watchReviews: (storeId, cb) => watch(() => Object.entries(db.reviews[storeId] || {})
      .map(([id, r]) => ({ id, ...r })).sort((a, b) => b.createdAt - a.createdAt), cb),
    async saveReview(storeId, u, { rating, text }) {
      if (!user || user.uid !== u.uid) throw fail('permission-denied', 'Please sign in');
      (db.reviews[storeId] ??= {})[u.uid] = { rating, text, name: u.name || 'Customer', createdAt: Date.now() };
      persist();
    },
    async deleteReview(storeId, reviewUid) {
      if (!user || (user.uid !== reviewUid && !isAdmin())) throw fail('permission-denied', 'Not allowed');
      delete db.reviews[storeId]?.[reviewUid];
      persist();
    },
  };
}

// Friendly error text for common Firebase errors.
export function errorText(e) {
  const code = e?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Wrong email or password';
  if (code.includes('email-already-in-use')) return 'This email already has a login.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters';
  if (code.includes('invalid-email')) return 'Invalid email address';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment.';
  if (code.includes('permission-denied')) return 'You do not have permission to do this';
  if (code.includes('network')) return 'No internet connection';
  if (code.includes('unauthorized-domain')) return 'This website address is not authorised in Firebase (Authentication → Settings → Authorized domains).';
  return e?.message || 'Something went wrong';
}
