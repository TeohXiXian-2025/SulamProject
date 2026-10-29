// Data layer. Every page uses the configured Firebase project for
// Firestore data and authentication.
import { firebaseConfig } from './config.js?v=3';
import { DEFAULT_CENTRE } from './seed.js?v=3';
import { sortStores, sortItems } from './util.js?v=3';
import { isPreview, previewApi } from './preview.js?v=3';

const FIREBASE_VERSION = '10.12.2';

let apiPromise;
export function getApi() {
  // ?preview uses practice data in this browser instead of the real project.
  apiPromise ??= isPreview() ? Promise.resolve(previewApi()) : firebaseApi(firebaseConfig);
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
    onAuth: (cb) => A.onAuthStateChanged(auth, (u) => cb(mapUser(u))),
    // Always show the Google account chooser so a shared computer can switch
    // accounts. Falls back to a full-page sign-in if the popup is blocked.
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
    sendVerification: () => A.sendEmailVerification(auth.currentUser),
    refreshUser: async () => {
      await auth.currentUser?.reload();
      // New token so the database sees a just-verified email straight away.
      await auth.currentUser?.getIdToken(true);
      return mapUser(auth.currentUser);
    },
    // Creates a login for a non-Gmail stall owner and emails them a link to
    // choose their own password. Uses a temporary second Firebase app so the
    // manager stays signed in. Returns the new account id, or null if the email
    // already had a login (a set-password email is still sent).
    async createOwnerAccount(email) {
      const tmp = appMod.initializeApp(config, `tmp-${Date.now()}`);
      let uidOut = null;
      try {
        const tmpAuth = A.initializeAuth(tmp, { persistence: A.inMemoryPersistence });
        const cred = await A.createUserWithEmailAndPassword(tmpAuth, email.trim(), randomPassword());
        uidOut = cred.user.uid;
        await A.signOut(tmpAuth);
      } catch (e) {
        if (e.code !== 'auth/email-already-in-use') throw e;
      } finally {
        await appMod.deleteApp(tmp).catch(() => {});
      }
      await A.sendPasswordResetEmail(auth, email.trim());
      return uidOut;
    },

    watchCentre: (cb) => F.onSnapshot(centreRef, (snap) => cb(fixOldName({ ...DEFAULT_CENTRE, ...snap.data() })), onErr),
    updateCentre: (patch) => F.setDoc(centreRef, clean(patch), { merge: true }),
    getAdmins: async () => (await F.getDoc(adminsRef)).data()?.emails || null,
    claimAdmin: (email) => F.setDoc(adminsRef, { emails: [lower(email)] }),
    setAdmins: (emails) => F.setDoc(adminsRef, { emails: emails.map(lower) }),

    watchStores: (cb) => F.onSnapshot(storesCol, (snap) => cb(sortStores(snap.docs.map(withId))), onErr),
    watchStore: (id, cb) => F.onSnapshot(F.doc(db, 'stores', id), (snap) => cb(snap.exists() ? withId(snap) : null), onErr),
    watchOwnedStores: (u, cb) => {
      // Wait for both lookups so an owner never briefly sees "no stall".
      let byUid = null;
      let byEmail = u.verified && u.email ? null : [];
      const emit = () => {
        if (!byUid || !byEmail) return;
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
    applyKimSengLayout: (migration) => {
      const batch = F.writeBatch(db);
      batch.set(centreRef, { floor: clean(migration.floor) }, { merge: true });
      for (const [id, patch] of Object.entries(migration.patches)) {
        batch.update(F.doc(db, 'stores', id), clean(patch));
      }
      batch.set(F.doc(storesCol), clean(migration.newStore));
      return batch.commit();
    },
    // Removes the stall's menu and reviews too, so nothing is left behind.
    async deleteStore(id) {
      for (const sub of ['items', 'reviews']) {
        const snap = await F.getDocs(F.collection(db, 'stores', id, sub));
        await Promise.all(snap.docs.map((d) => F.deleteDoc(d.ref)));
      }
      await F.deleteDoc(F.doc(db, 'stores', id));
    },

    watchItems: (storeId, cb) => F.onSnapshot(F.collection(db, 'stores', storeId, 'items'),
      (snap) => cb(sortItems(snap.docs.map((d) => ({ ...withId(d), createdAt: millis(d.data().createdAt) })))), onErr),
    // createdAt is a plain number so dishes keep the order they were added in.
    addItem: (storeId, data) => F.addDoc(F.collection(db, 'stores', storeId, 'items'), clean({ ...data, createdAt: Date.now() })),
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
