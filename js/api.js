// Data layer. Every page talks to the backend only through these functions.
//
//   - Firebase mode (js/config.js has a config): free Firestore database +
//     Firebase Authentication, live updates for everyone.
//   - Demo mode (no config): same functions, data kept in this browser's
//     localStorage, so the site can be tried without any setup.
import { firebaseConfig } from './config.js';
import { DEFAULT_CENTRE, STARTER_STORES, DEMO_ITEMS } from './seed.js';
import { uid, sortStores, sortItems } from './util.js';

const FIREBASE_VERSION = '10.12.2';

let apiPromise;
export function getApi() {
  apiPromise ??= firebaseConfig ? firebaseApi(firebaseConfig) : Promise.resolve(demoApi());
  return apiPromise;
}

const clean = (o) => JSON.parse(JSON.stringify(o ?? null));
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
  const mapUser = (u) => u && { uid: u.uid, email: lower(u.email), name: u.displayName || '', provider: u.providerData[0]?.providerId };
  const onErr = (e) => console.error(e);

  return {
    mode: 'firebase',

    onAuth: (cb) => A.onAuthStateChanged(auth, (u) => cb(mapUser(u))),
    async signInGoogle() {
      const p = new A.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      try {
        await A.signInWithPopup(auth, p);
      } catch (e) {
        if (e.code === 'auth/popup-blocked') await A.signInWithRedirect(auth, p);
        else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
      }
    },
    signInEmail: (email, pw) => A.signInWithEmailAndPassword(auth, email.trim(), pw),
    signOut: () => A.signOut(auth),
    resetPassword: (email) => A.sendPasswordResetEmail(auth, email.trim()),
    changePassword: (pw) => A.updatePassword(auth.currentUser, pw),

    // Creates a login for a stall owner without signing the admin out, by
    // using a temporary second Firebase app instance.
    async createOwnerAccount(email, pw) {
      const tmp = appMod.initializeApp(config, `tmp-${Date.now()}`);
      try {
        const tmpAuth = A.initializeAuth(tmp, { persistence: A.inMemoryPersistence });
        const cred = await A.createUserWithEmailAndPassword(tmpAuth, email.trim(), pw);
        await A.signOut(tmpAuth);
        return cred.user.uid;
      } finally {
        await appMod.deleteApp(tmp).catch(() => {});
      }
    },

    watchCentre: (cb) => F.onSnapshot(centreRef, (s) => cb(s.exists() ? { ...DEFAULT_CENTRE, ...s.data() } : clean(DEFAULT_CENTRE)), onErr),
    updateCentre: (patch) => F.setDoc(centreRef, clean(patch), { merge: true }),
    async getAdmins() {
      const s = await F.getDoc(adminsRef);
      return s.exists() ? s.data().emails || [] : null;
    },
    claimAdmin: (email) => F.setDoc(adminsRef, { emails: [lower(email)] }),
    setAdmins: (emails) => F.setDoc(adminsRef, { emails: emails.map(lower) }),

    watchStores: (cb) => F.onSnapshot(storesCol, (s) => cb(sortStores(s.docs.map(withId))), onErr),
    watchStore: (id, cb) => F.onSnapshot(F.doc(db, 'stores', id), (s) => cb(s.exists() ? withId(s) : null), onErr),
    watchOwnedStores: (ownerUid, cb) =>
      F.onSnapshot(F.query(storesCol, F.where('ownerUid', '==', ownerUid)), (s) => cb(sortStores(s.docs.map(withId))), onErr),
    createStore: async (data) => (await F.addDoc(storesCol, clean(data))).id,
    updateStore: (id, patch) => F.updateDoc(F.doc(db, 'stores', id), clean(patch)),
    async updateStores(patches) {
      const batch = F.writeBatch(db);
      for (const [id, patch] of Object.entries(patches)) batch.update(F.doc(db, 'stores', id), clean(patch));
      await batch.commit();
    },
    async deleteStore(id) {
      for (const sub of ['items', 'reviews']) {
        const snap = await F.getDocs(F.collection(db, 'stores', id, sub));
        await Promise.all(snap.docs.map((d) => F.deleteDoc(d.ref)));
      }
      await F.deleteDoc(F.doc(db, 'stores', id));
    },

    watchItems: (storeId, cb) => F.onSnapshot(F.collection(db, 'stores', storeId, 'items'),
      (s) => cb(sortItems(s.docs.map(withId))), onErr),
    addItem: (storeId, data) => F.addDoc(F.collection(db, 'stores', storeId, 'items'), clean({ ...data, createdAt: Date.now() })),
    updateItem: (storeId, itemId, patch) => F.updateDoc(F.doc(db, 'stores', storeId, 'items', itemId), clean(patch)),
    deleteItem: (storeId, itemId) => F.deleteDoc(F.doc(db, 'stores', storeId, 'items', itemId)),

    watchReviews: (storeId, cb) => F.onSnapshot(F.collection(db, 'stores', storeId, 'reviews'),
      (s) => cb(s.docs.map((d) => ({ ...withId(d), createdAt: millis(d.data().createdAt) }))
        .sort((a, b) => b.createdAt - a.createdAt)), onErr),
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
  const KEY = 'kimseng-demo-v1';
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
      data.stores[id] = clean(s);
      data.items[id] = {};
      (DEMO_ITEMS[s.number] || []).forEach((it, i) => {
        data.items[id][`i${s.number}_${i}`] = { available: true, photo: '', section: '', ...it, createdAt: i };
      });
    }
    // Two demo stall-owner logins.
    data.accounts['drinks@demo.com'] = { password: 'demo123', uid: 'owner-drinks' };
    data.accounts['rice@demo.com'] = { password: 'demo123', uid: 'owner-rice' };
    data.stores.s1.ownerUid = 'owner-drinks';
    data.stores.s1.ownerEmail = 'drinks@demo.com';
    data.stores.s2.ownerUid = 'owner-rice';
    data.stores.s2.ownerEmail = 'rice@demo.com';
    data.reviews.s8 = { demo1: { rating: 5, text: 'Chicken is very smooth!', name: 'Ali', createdAt: Date.now() - 86400000 } };
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
  const ownsStore = (id) => user && db.stores[id]?.ownerUid === user.uid;
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
      const email = window.prompt('Demo mode: type any Gmail address to pretend to sign in with Google', 'demo.user@gmail.com');
      if (!email) return;
      setUser({ uid: `g-${lower(email)}`, email: lower(email), name: email.split('@')[0], provider: 'google.com' });
    },
    async signInEmail(email, pw) {
      const acc = db.accounts[lower(email)];
      if (!acc || acc.password !== pw) throw fail('auth/invalid-credential', 'Wrong email or password');
      setUser({ uid: acc.uid, email: lower(email), name: '', provider: 'password' });
    },
    async signOut() { setUser(null); },
    async resetPassword() { /* nothing to send in demo mode */ },
    async changePassword(pw) {
      const acc = Object.values(db.accounts).find((a) => a.uid === user?.uid);
      if (acc) { acc.password = pw; persist(); }
    },
    async createOwnerAccount(email, pw) {
      mustAdmin();
      if (db.accounts[lower(email)]) throw fail('auth/email-already-in-use', 'Email already in use');
      const id = `u-${uid()}`;
      db.accounts[lower(email)] = { password: pw, uid: id };
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
    watchOwnedStores: (ownerUid, cb) => watch(() => storeList().filter((s) => s.ownerUid === ownerUid), cb),
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
  if (code.includes('email-already-in-use')) return 'This email already has a login. Use "Link existing account ID" or another email.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters';
  if (code.includes('invalid-email')) return 'Invalid email address';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment.';
  if (code.includes('permission-denied')) return 'You do not have permission to do this';
  if (code.includes('network')) return 'No internet connection';
  if (code.includes('unauthorized-domain')) return 'This website address is not authorised in Firebase (Authentication → Settings → Authorized domains).';
  return e?.message || 'Something went wrong';
}
