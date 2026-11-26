// Safe preview mode: open any page with ?preview to try the whole website with
// practice data kept only in this browser. Nothing is read from or written to
// the real Firebase project, and no real Google login is needed.
// Leave preview with ?preview=off (or the "Exit preview" link in the banner).
import { DEFAULT_CENTRE, STARTER_STORES } from './seed.js?v=3';
import { sortStores, sortItems, isOwnerOf, ownerFields } from './util.js?v=3';
import { KIM_SENG_MENU } from './menu-kimseng.js?v=3';

const FLAG = 'kimseng-preview';
const KEY = 'kimseng-preview-data-v3';
const USER_KEY = 'kimseng-preview-user';
const MANAGER = 'manager@preview.test';
// Stall 2 has two owners to show that a stall can have several logins.
const OWNERS = { 'drinks@preview.test': [1], 'rice@preview.test': [2], 'family@preview.test': [2] };
const PASSWORD = 'preview';

// Called by api.js before anything else loads.
export function isPreview() {
  const value = new URLSearchParams(location.search).get('preview');
  try {
    if (value === 'off') sessionStorage.removeItem(FLAG);
    else if (value !== null) sessionStorage.setItem(FLAG, '1');
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return value !== null && value !== 'off';
  }
}

const clean = (o) => JSON.parse(JSON.stringify(o ?? null));
const lower = (s) => String(s || '').trim().toLowerCase();
const newId = () => Math.random().toString(36).slice(2, 10);

function seed() {
  const data = { centre: clean(DEFAULT_CENTRE), admins: [MANAGER], stores: {}, items: {}, reviews: {}, accounts: {} };
  for (const s of STARTER_STORES) {
    const id = `s${s.number}`;
    data.stores[id] = clean(s);
    data.items[id] = {};
    // The real Kim Seng menu, so preview looks like the live site after import.
    (KIM_SENG_MENU[s.number]?.items || []).forEach((it, i) => { data.items[id][`i${s.number}-${i}`] = { ...it, available: true, createdAt: i }; });
    data.reviews[id] = {};
  }
  data.stores.s2.mixedRice = { note: '', prices: KIM_SENG_MENU[2].prices };
  const owners = {};
  for (const [email, numbers] of Object.entries(OWNERS)) {
    const uid = `owner-${email.split('@')[0]}`;
    data.accounts[email] = { password: PASSWORD, uid, verified: true };
    for (const n of numbers) (owners[n] ??= []).push({ email, uid });
  }
  for (const [n, list] of Object.entries(owners)) Object.assign(data.stores[`s${n}`], ownerFields(list));
  data.reviews.s7.demo = { rating: 5, text: 'Chicken is very smooth!', name: 'Ali', createdAt: Date.now() - 86400000 };
  return data;
}

function showBanner() {
  const make = () => {
    if (document.getElementById('preview-banner')) return;
    const bar = document.createElement('div');
    bar.id = 'preview-banner';
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:sticky;top:0;z-index:1000;background:#fbebb5;color:#4f3a00;border-bottom:2px solid #e2c56b;'
      + 'padding:8px 14px;font:600 14px/1.4 system-ui,sans-serif;text-align:center';
    const exit = new URL(location.href);
    exit.searchParams.set('preview', 'off');
    bar.innerHTML = `<style>@media (max-width: 700px) { #preview-banner .logins { display: none; } }</style>
      PREVIEW 预览 — practice data, not the real shop
      <span class="logins">· Manager: Google → ${MANAGER} · Stall owner: rice@preview.test / ${PASSWORD}</span>
      · <a href="${exit.href}" style="color:#a8261b">Exit preview</a>`;
    document.body.prepend(bar);
  };
  if (document.body) make(); else document.addEventListener('DOMContentLoaded', make);
}

export function previewApi() {
  showBanner();
  const listeners = new Set();
  const authListeners = new Set();
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  let db = read() || seed();
  let user = null;
  try { user = JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { /* ignore */ }

  const emit = () => listeners.forEach((fn) => fn());
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { throw new Error('Preview storage is full — remove some photos.'); }
    emit();
  }
  window.addEventListener('storage', (e) => { if (e.key === KEY) { db = read() || seed(); emit(); } });
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
  const isAdmin = () => !!user && db.admins?.includes(user.email);
  const owns = (id) => isOwnerOf(db.stores[id], user);
  const mustAdmin = () => { if (!isAdmin()) throw fail('permission-denied', 'Missing or insufficient permissions.'); };
  const mustOwn = (id) => { if (!isAdmin() && !owns(id)) throw fail('permission-denied', 'Missing or insufficient permissions.'); };
  const storeList = () => sortStores(Object.entries(db.stores).map(([id, s]) => ({ id, ...s })));

  return {
    mode: 'preview',
    onAuth(cb) { authListeners.add(cb); setTimeout(() => cb(user), 0); return () => authListeners.delete(cb); },
    async signInGoogle() {
      const email = window.prompt('Preview: type any Gmail to pretend to sign in with Google.\nManager account: ' + MANAGER, MANAGER);
      if (!email) return;
      setUser({ uid: `g-${lower(email)}`, email: lower(email), name: email.split('@')[0], verified: true, provider: 'google.com' });
    },
    async signInEmail(email, pw) {
      const acc = db.accounts[lower(email)];
      if (!acc || acc.password !== pw) throw fail('auth/invalid-credential', 'Wrong email or password');
      setUser({ uid: acc.uid, email: lower(email), name: '', verified: !!acc.verified, provider: 'password' });
    },
    async signOut() { setUser(null); },
    async resetPassword() { /* no email in preview */ },
    async changePassword(pw) {
      const acc = Object.values(db.accounts).find((a) => a.uid === user?.uid);
      if (acc) { acc.password = pw; persist(); }
    },
    async sendVerification() { const acc = db.accounts[user?.email]; if (acc) { acc.verified = true; persist(); } },
    async refreshUser() {
      const acc = db.accounts[user?.email];
      if (acc) setUser({ ...user, verified: !!acc.verified });
      return user;
    },
    async createOwnerAccount(email) {
      mustAdmin();
      if (db.accounts[lower(email)]) return null; // same as the real site: login already exists
      const id = `u-${newId()}`;
      db.accounts[lower(email)] = { password: PASSWORD, uid: id, verified: true };
      persist();
      return id;
    },

    watchCentre: (cb) => watch(() => db.centre, cb),
    async updateCentre(patch) { mustAdmin(); db.centre = { ...db.centre, ...clean(patch) }; persist(); },
    async getAdmins() { return db.admins ? [...db.admins] : null; },
    async claimAdmin(email) { if (db.admins?.length) throw fail('permission-denied', 'Admin already exists'); db.admins = [lower(email)]; persist(); },
    async setAdmins(emails) { mustAdmin(); db.admins = emails.map(lower); persist(); },

    watchStores: (cb) => watch(storeList, cb),
    watchStore: (id, cb) => watch(() => (db.stores[id] ? { id, ...db.stores[id] } : null), cb),
    watchOwnedStores: (u, cb) => watch(() => storeList().filter((s) => isOwnerOf(s, u)), cb),
    async createStore(data) {
      mustAdmin();
      const id = `s-${newId()}`;
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
    async applyKimSengLayout(migration) {
      mustAdmin();
      db.centre.floor = clean(migration.floor);
      for (const [id, p] of Object.entries(migration.patches)) db.stores[id] = { ...db.stores[id], ...clean(p) };
      db.stores[`s-${newId()}`] = clean(migration.newStore);
      persist();
    },
    async deleteStore(id) { mustAdmin(); delete db.stores[id]; delete db.items[id]; delete db.reviews[id]; persist(); },

    watchItems: (storeId, cb) => watch(() => sortItems(Object.entries(db.items[storeId] || {}).map(([id, it]) => ({ id, ...it }))), cb),
    async addItem(storeId, data) {
      mustOwn(storeId);
      (db.items[storeId] ??= {})[`i-${newId()}`] = { createdAt: Date.now(), ...clean(data) };
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
