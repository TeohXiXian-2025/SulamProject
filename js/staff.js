// Staff app (staff.html): one login for stall owners and the manager.
// After login the home screen shows big tiles; each tile opens one screen
// with a big Back button. Screens are addressed by the URL hash so the
// phone's own back button works too.
import { getApi, errorText } from './api.js?v=3';
import { t, pick, pickAlt, langSwitcher, bindLangSwitcher } from './i18n.js?v=3';
import { centreStatus, storeStatus, statusBox, nowLocal, overrideActive, todayStr } from './status.js?v=3';
import { $, esc, toast, stars, pic, ICONS, bigIcon, CATEGORIES, categoryColor, fmtPrice } from './util.js?v=3';
import { art, storeArt } from './art.js?v=3';
import { DEFAULT_CENTRE, kimSengLayoutMigration } from './seed.js?v=3';
import {
  saving, statusChoicesHtml, bindStatusChoices, hoursEditorHtml, bindHoursEditor,
  photoPickerHtml, bindPhotoPicker, openItemDialog, itemCardHtml,
} from './forms.js?v=3';

const api = await getApi();
const app = $('#app');

const S = {
  user: undefined, admins: undefined, centre: null, owned: null, all: null,
  items: {}, reviews: {}, qrMode: 'poster', tableCount: 12,
  siteUrl: new URL('./', location.href).href, reviewFilter: 'all',
};
const itemSubs = {};
const reviewSubs = {};
let authSubs = [];
let plan = null;
let planDirty = false;
let pendingRender = false;

api.watchCentre((c) => {
  S.centre = c;
  // Save the corrected shop name once a manager is signed in.
  if (c.needsNameFix && isAdmin()) api.updateCentre({ name: c.name, nameZh: c.nameZh }).catch(() => {});
  render();
});
api.onAuth(async (u) => {
  authSubs.forEach((f) => f());
  authSubs = [];
  Object.assign(S, { user: u, admins: undefined, owned: null, all: null });
  render(true);
  if (!u) return;
  S.admins = await api.getAdmins().catch(() => null);
  if (S.user !== u) return;
  if (isAdmin() && S.centre?.needsNameFix) api.updateCentre({ name: S.centre.name, nameZh: S.centre.nameZh }).catch(() => {});
  subscribeData();
  render(true);
});
window.addEventListener('hashchange', () => {
  if (planDirty && !confirm(t('unsaved'))) { history.back(); return; }
  planDirty = false;
  window.scrollTo(0, 0);
  render(true);
});
window.addEventListener('langchange', () => render(true));
window.addEventListener('beforeunload', (e) => { if (planDirty) e.preventDefault(); });
// Live updates must not wipe what someone is typing: wait until they leave the field.
app.addEventListener('focusout', () => setTimeout(() => { if (pendingRender && !typing()) render(); }, 150));

const isAdmin = () => !!S.user && !!S.admins?.includes(S.user.email);
const typing = () => document.activeElement?.matches?.('input:not([type=checkbox]):not([type=file]), textarea, select') && app.contains(document.activeElement);
const storeById = (id) => (S.all || S.owned || []).find((s) => s.id === id);
const owns = (id) => !!S.owned?.some((s) => s.id === id);

function subscribeData() {
  authSubs.push(api.watchOwnedStores(S.user, (list) => { S.owned = list; render(); }));
  if (isAdmin()) authSubs.push(api.watchStores((list) => { S.all = list; render(); }));
}
function needItems(id) {
  itemSubs[id] ??= api.watchItems(id, (items) => { S.items[id] = items; render(); });
}
function needReviews(id) {
  reviewSubs[id] ??= api.watchReviews(id, (list) => { S.reviews[id] = list; render(); });
}
function firstValue(watchFn) {
  return new Promise((resolve) => {
    let un = null;
    let done = false;
    un = watchFn((v) => { if (done) return; done = true; resolve(v); setTimeout(() => un?.(), 0); });
  });
}

function route() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}
const go = (hash) => { location.hash = hash; };

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render(force = false) {
  if (!force && typing()) { pendingRender = true; return; }
  pendingRender = false;
  if (S.user === undefined || !S.centre) return shell(null, `<p class="muted">${t('loading')}</p>`);
  if (!S.user) return renderLogin();
  if (S.admins === undefined || S.owned === null || (isAdmin() && S.all === null)) {
    return shell(null, `<p class="muted">${t('loading')}</p>`);
  }
  // First-time setup: nobody manages the site yet, and this person has no stall.
  if (S.admins === null && !S.owned.length && S.user.verified) return renderClaim();
  if (!isAdmin() && !S.owned.length) return renderUnlinked();

  const [page, a, b] = route();
  if (page === 'floor' && isAdmin()) return renderFloor(force);
  disposePlan();
  if (page === 'stall' && a && (isAdmin() || owns(a))) {
    const s = storeById(a);
    if (!s) return go('#/');
    if (!b) return renderStallHome(s);
    return ({ status: renderStallStatus, menu: renderStallMenu, info: renderStallInfo, reviews: renderStallReviews }[b] || renderStallHome)(s);
  }
  if (isAdmin()) {
    if (page === 'stalls') return renderStalls();
    if (page === 'stall-edit') return renderStallEdit(a);
    if (page === 'centre') return renderCentre();
    if (page === 'qr') return renderQr();
    if (page === 'reviews') return renderAllReviews();
    if (page === 'admins') return renderAdmins();
  }
  if (page === 'account') return renderAccount();
  return renderHome();
}

function staffNav() {
  if (!S.user || !S.owned) return '';
  const current = location.hash || '#/';
  const links = [{ href: '#/', label: t('dashboard'), icon: ICONS.shop }];
  for (const s of S.owned) links.push({ href: `#/stall/${encodeURIComponent(s.id)}`, label: `${s.number} · ${pick(s)}`, icon: ICONS.bowl });
  if (isAdmin()) links.push(
    { href: '#/stalls', label: t('tileStalls'), icon: ICONS.people },
    { href: '#/floor', label: t('tileFloor'), icon: ICONS.map },
    { href: '#/centre', label: t('tileCentre'), icon: ICONS.clock },
    { href: '#/qr', label: t('tileQR'), icon: ICONS.print },
    { href: '#/reviews', label: t('tileMgrReviews'), icon: ICONS.star },
    { href: '#/admins', label: t('tileAdmins'), icon: ICONS.people },
  );
  if (S.user.provider === 'password') links.push({ href: '#/account', label: t('changePassword'), icon: ICONS.pencil });
  return `<nav class="staff-nav" aria-label="${t('dashboard')}">${links.map(({ href, label, icon }) =>
    `<a href="${href}" class="${current === href || (href.startsWith('#/stall/') && current.startsWith(href + '/')) ? 'active' : ''}">${icon}<span>${esc(label)}</span></a>`).join('')}</nav>`;
}

// Top bar + navigation + page body. `back` is a hash to return to, or null on the home screen.
function shell(back, body, title) {
  const c = S.centre || DEFAULT_CENTRE;
  app.innerHTML = `
    <header class="kopitiam-header staff-header">
      <div class="signboard">
        <a class="frame" href="#/" aria-label="${esc(c.name || t('centreName'))}">
          <div class="zh">${esc(c.nameZh || '金城茶餐室')}</div>
          <div class="en">${esc(c.name || 'RESTORAN KIM SENG')}</div>
        </a>
      </div>
      <div class="tiles" aria-hidden="true"></div>
      <div class="staff-subbar">
        <div class="wrap staff-subbar-inner">
          <div class="staff-subbar-meta">
            <span class="staff-role-badge">${isAdmin() ? t('manager') : t('stallOwner')}</span>
            <span class="staff-page-title">${esc(title || t('dashboard'))}</span>
            ${S.user ? `<span class="staff-user-email">${esc(S.user.email)}</span>` : ''}
          </div>
          <div class="staff-subbar-actions">
            <div class="header-language">${langSwitcher()}</div>
            ${!back && S.user ? `<button type="button" class="btn sm" id="logout">${t('logOut')}</button>` : ''}
          </div>
        </div>
      </div>
    </header>
    <div class="staff-layout wrap">${staffNav()}<main class="staff-main">
      ${back ? `<a class="back-link" href="${back}">${ICONS.back}<span>${t('back')}</span></a>` : ''}
      <div class="stack" id="body">${body}</div>
    </main></div>`;
  $('#logout')?.addEventListener('click', () => api.signOut());
  bindLangSwitcher(app);
  return $('#body');
}

// ---------------------------------------------------------------------------
// Login, first-time setup, not linked
// ---------------------------------------------------------------------------
function renderLogin() {
  const c = S.centre || DEFAULT_CENTRE;
  app.innerHTML = `
    <header class="kopitiam-header staff-header">
      <div class="signboard">
        <a class="frame" href="./" aria-label="${esc(c.name || t('centreName'))}">
          <div class="zh">${esc(c.nameZh || '金城茶餐室')}</div>
          <div class="en">${esc(c.name || 'RESTORAN KIM SENG')}</div>
        </a>
      </div>
      <div class="tiles" aria-hidden="true"></div>
    </header>
    <main class="wrap stack login-main">
      <div class="login-intro">
        <span class="eyebrow">${esc(c.name || t('centreName'))}</span>
        <h1>${t('staffLogin')}</h1>
        <p>${t('staffWho')}</p>
      </div>
      <!-- lang switcher in sticky subbar -->
      <div class="card stack login-box">
        <button type="button" class="btn big block google-btn" id="google" style="background:#fff">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="#FBBC05"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335"/></svg>
          <span>${t('continueGoogle')}</span></button>
        <div class="muted center" style="text-align:center;margin-top:-6px">${t('haveGmail')}</div>
        
        <div class="or">${t('noGmail')}</div>
        <form id="login" class="stack">
          <label class="field"><span>${t('email')}</span><input type="email" name="email" required autocomplete="username"></label>
          <label class="field"><span>${t('password')}</span><input type="password" name="password" required autocomplete="current-password"></label>
          <button type="submit" class="btn red big block">${t('logIn')}</button>
        </form>
        <button type="button" class="btn sm" id="forgot" style="border:0;background:none;color:var(--red);cursor:pointer">${t('firstTime')}</button>
      </div>
      <a href="./" class="muted back-to-site" style="text-align:center">← ${t('backToSite')}</a>
    </main>`;
  bindLangSwitcher(app);
  $('#google').onclick = () => api.signInGoogle().catch((e) => toast(errorText(e), 'error'));
  
  $('#login').onsubmit = (e) => {
    e.preventDefault();
    api.signInEmail(e.target.email.value, e.target.password.value).catch((err) => toast(errorText(err), 'error'));
  };
  $('#forgot').onclick = async () => {
    const email = $('[name=email]').value.trim();
    if (!email) { toast(t('typeEmailFirst'), 'error'); $('[name=email]').focus(); return; }
    try { await api.resetPassword(email); toast(t('resetSent')); } catch (err) { toast(errorText(err), 'error'); }
  };
}

function renderClaim() {
  const body = shell(null, `<div class="card stack">
    <div class="card-title">${t('claimTitle')}</div>
    <p style="margin:0">${t('claimText', { x: `<b>${esc(S.user.email)}</b>` })}</p>
    <button type="button" class="btn red big" id="claim">${t('claimBtn')}</button>
  </div>`);
  $('#claim', body).onclick = async (e) => {
    const ok = await saving(e.currentTarget, async () => {
      await api.claimAdmin(S.user.email);
      await api.updateCentre(DEFAULT_CENTRE);
    });
    if (!ok) return;
    S.admins = [S.user.email];
    subscribeData();
    render(true);
  };
}

function renderUnlinked() {
  const body = shell(null, `<div class="card stack">
    <p style="margin:0">${S.admins?.length ? t('noStoreLinked') : t('notAdmin', { x: esc(S.user.email) })}</p>
    ${S.user.verified ? '' : `<div class="notice stack">${t('verifyHint')}
      <button type="button" class="btn" id="verify">${t('verifyEmail')}</button>
      <button type="button" class="btn green" id="verified">${t('iVerified')}</button></div>`}
    <details><summary class="muted">${t('giveIdToAdmin')}</summary><code class="id">${esc(S.user.uid)}</code></details>
  </div>`);
  $('#verify', body)?.addEventListener('click', (e) => saving(e.currentTarget, () => api.sendVerification(), t('verifySent')));
  $('#verified', body)?.addEventListener('click', async () => {
    const u = await api.refreshUser();
    if (!u?.verified) { toast(t('notVerifiedYet'), 'error'); return; }
    authSubs.forEach((f) => f());
    authSubs = [];
    Object.assign(S, { user: u, owned: null, all: null });
    subscribeData();
    render(true);
  });
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
function tile(href, iconHtml, title, sub) {
  return `<a class="tile" href="${href}">${iconHtml}<b>${title}</b><span>${sub}</span></a>`;
}

function stallCard(s) {
  const st = storeStatus(s, S.centre);
  const ov = overrideActive(s.override);
  let quick = '';
  if (st.reason !== 'centre') {
    if (st.open) quick = `<button type="button" class="btn red big btn-col" data-quick="close">${t('closeToday')}<span class="sub">${t('closeTodaySub')}</span></button>`;
    else if (ov) quick = `<button type="button" class="btn green big btn-col" data-quick="normal">${t('backToNormal')}<span class="sub">${t('backToNormalSub')}</span></button>`;
    else quick = `<button type="button" class="btn big btn-col" data-quick="anyway">${t('openAnyway')}<span class="sub">${t('openAnywaySub')}</span></button>`;
  }
  return `<div class="card stack" data-stall="${esc(s.id)}">
    <div class="row" style="flex-wrap:nowrap">
      <span class="plate">${esc(s.number ?? '')}</span>
      <div style="min-width:0"><div class="card-title">${esc(pick(s))}</div>
        <div class="muted">${esc(pickAlt(s))}${pickAlt(s) ? ' · ' : ''}${t('yourStall')}</div></div>
    </div>
    ${statusBox(st, st.open ? t('stallIsOpen') : t('stallIsClosed'))}
    ${quick}
  </div>`;
}

function stallTiles(s) {
  const id = encodeURIComponent(s.id);
  return `<div class="section-title">${t('whatToDo')}</div>
    <div class="tile-grid">
      ${tile(`#/stall/${id}/status`, bigIcon('clock', '#2B6B4E'), t('tileHours'), t('tileHoursSub'))}
      ${tile(`#/stall/${id}/menu`, bigIcon('bowl', '#A8261B').replace('width="28" height="28"', 'width="44" height="44"'), t('tileMenu'), t('tileMenuSub'))}
      ${tile(`#/stall/${id}/info`, ICONS.pencil, t('tileInfo'), t('tileInfoSub'))}
      ${tile(`#/stall/${id}/reviews`, ICONS.star, t('tileReviews'), reviewSummary(s.id))}
    </div>
    <a class="btn" href="./${location.search}#/store/${id}" target="_blank" rel="noopener">${t('seeAsCustomer')}</a>`;
}

function reviewSummary(id) {
  needReviews(id);
  const list = S.reviews[id];
  if (!list?.length) return t('reviewsCount', { n: list ? 0 : '…' });
  return `${(list.reduce((a, r) => a + r.rating, 0) / list.length).toFixed(1)} ★ · ${t('reviewsCount', { n: list.length })}`;
}

function bindQuick(root) {
  root.querySelectorAll('[data-stall] [data-quick]').forEach((b) => {
    const id = b.closest('[data-stall]').dataset.stall;
    b.onclick = () => {
      const q = b.dataset.quick;
      const ov = q === 'normal' ? null : { status: q === 'close' ? 'closed' : 'open', until: todayStr(), note: '' };
      saving(b, () => api.updateStore(id, { override: ov }));
    };
  });
}

function managerCard() {
  const cs = centreStatus(S.centre);
  const ov = overrideActive(S.centre.override);
  const now = nowLocal();
  const openCount = S.all.filter((s) => storeStatus(s, S.centre, now).open).length;
  let quick = '';
  if (cs.open) quick = `<button type="button" class="btn red big btn-col" data-shop="close">${t('closeShop')}<span class="sub">${t('closeShopSub')}</span></button>`;
  else if (ov) quick = `<button type="button" class="btn green big btn-col" data-shop="normal">${t('reopenShop')}<span class="sub">${t('reopenShopSub')}</span></button>`;
  return `<div class="card stack">
    <div class="card-title">${esc(S.centre.nameZh || '')} ${esc(S.centre.name || '')} · ${t('manager')}</div>
    ${statusBox({ ...cs, detail: [cs.detail, t('stallsOpenCount', { n: openCount, m: S.all.length })].filter(Boolean).join(' · ') }, cs.open ? t('shopIsOpen') : t('shopIsClosed'))}
    ${quick}
  </div>
  <div class="tile-grid">
    ${tile('#/stalls', bigIcon('shop', '#2B6B4E'), t('tileStalls'), t('tileStallsSub'))}
    ${tile('#/floor', ICONS.map, t('tileFloor'), t('tileFloorSub'))}
    ${tile('#/centre', bigIcon('clock', '#8A5A33'), t('tileCentre'), t('tileCentreSub'))}
    ${tile('#/qr', ICONS.print, t('tileQR'), t('tileQRSub'))}
    ${tile('#/reviews', ICONS.star, t('tileMgrReviews'), t('tileMgrReviewsSub'))}
    ${tile('#/admins', ICONS.people, t('tileAdmins'), t('tileAdminsSub'))}
  </div>`;
}

function renderHome() {
  const owned = S.owned || [];
  const body = shell(null, `
        ${owned.map((s) => stallCard(s) + stallTiles(s)).join('<div style="height:10px"></div>')}
    ${isAdmin() ? `${owned.length ? '<div class="section-title">' + t('manager') + '</div>' : ''}${managerCard()}` : ''}
    ${S.user.provider === 'password' ? `<a class="btn sm" href="#/account">${t('changePassword')}</a>` : ''}`);
  bindQuick(body);
  body.querySelectorAll('[data-shop]').forEach((b) => {
    b.onclick = () => {
      const ov = b.dataset.shop === 'normal' ? null : { status: 'closed', until: todayStr(), note: '' };
      saving(b, () => api.updateCentre({ override: ov }));
    };
  });
}

// ---------------------------------------------------------------------------
// One stall (owner, or the manager on the owner's behalf)
// ---------------------------------------------------------------------------
const stallBack = (s) => (isAdmin() && !owns(s.id) ? `#/stall/${encodeURIComponent(s.id)}` : '#/');

function renderStallHome(s) {
  const body = shell(isAdmin() ? '#/stalls' : '#/', stallCard(s) + stallTiles(s), `${t('manageStall')} ${s.number ?? ''}`);
  bindQuick(body);
}

function renderStallStatus(s) {
  const st = storeStatus(s, S.centre);
  const body = shell(stallBack(s), `
    ${statusBox(st, `${t('now')}: ${st.open ? t('openNowBig') : t('closedBig')}`)}
    ${statusChoicesHtml(s.override)}
    ${hoursEditorHtml(s.hours)}`, `${t('pageOpenClose')} · ${esc(pick(s))}`);
  bindStatusChoices(body, (override) => api.updateStore(s.id, { override }));
  bindHoursEditor(body, (hours) => api.updateStore(s.id, { hours }));
}

function renderStallMenu(s) {
  needItems(s.id);
  const items = S.items[s.id];
  const mixed = s.type === 'mixedRice';
  const body = shell(stallBack(s), `
    ${mixed ? priceGuideHtml(s) + `<div class="section-title">${t('dishesUsually')}</div><div class="notice">${t('mixedRiceNote')}</div>` : ''}
    <button type="button" class="btn red big" id="add-item">${ICONS.plus}${t('addFood')}</button>
    <div class="help">${t('soldOutHint')}</div>
    ${items ? (items.length ? items.map(itemCardHtml).join('') : `<div class="card" style="text-align:center;padding:36px 16px;background:var(--marble);border-radius:var(--radius);border:1px solid var(--line);">
      <div style="font-size:2.2rem;margin-bottom:8px">📋</div>
      <p style="margin:0 0 6px;font-weight:700;font-size:1.05rem;color:var(--ink)">No menu items yet · 暂无菜品</p>
      <p class="small muted" style="margin:0">Tap "+ Add food" above to add your first dish.</p>
    </div>`) : `<p class="muted">${t('loading')}</p>`}
    <datalist id="sections">${[...new Set((items || []).map((i) => i.section).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`,
  `${t('tileMenu')} · ${esc(pick(s))}`);
  if (mixed) bindPriceGuide(body, s);
  $('#add-item', body).onclick = () => openItemDialog({ mixedRice: mixed, onSave: (data) => api.addItem(s.id, data) });
  body.querySelectorAll('[data-item]').forEach((card) => {
    const it = items.find((x) => x.id === card.dataset.item);
    $('[data-avail]', card).onclick = (e) => {
      const available = it.available === false;
      saving(e.currentTarget, () => api.updateItem(s.id, it.id, { available }), available ? t('nowAvailable') : t('nowSoldOut'));
    };
    $('[data-edit]', card).onclick = () => openItemDialog({ item: it, mixedRice: mixed, onSave: (data) => api.updateItem(s.id, it.id, data) });
    $('[data-del]', card).onclick = (e) => {
      if (confirm(t('confirmDelete', { x: pick(it) }))) saving(e.currentTarget, () => api.deleteItem(s.id, it.id), t('deleted'));
    };
  });
}

function priceGuideHtml(s) {
  const rows = s.mixedRice?.prices || [];
  const row = (p = {}) => `<div class="price-row">
    <input type="text" data-k="label" placeholder="1 meat + 2 veg" maxlength="40" value="${esc(p.label || '')}" aria-label="${t('name')}">
    <input type="text" data-k="labelZh" placeholder="一肉两菜" maxlength="40" value="${esc(p.labelZh || '')}" aria-label="${t('chineseName')}">
    <input type="number" data-k="price" placeholder="RM" min="0" step="0.1" inputmode="decimal" value="${esc(p.price ?? '')}" aria-label="${t('price')}">
    <button type="button" class="btn sm danger" data-rm aria-label="${t('delete')}" style="padding:0">✕</button></div>`;
  return `<div class="card stack" id="guide">
    <div class="card-title">${t('priceGuide')}</div>
    <div class="stack" id="guide-rows" style="gap:8px">${rows.map(row).join('')}</div>
    <template id="guide-tpl">${row()}</template>
    <button type="button" class="btn sm" id="guide-add">${ICONS.plus}${t('add')}</button>
    <label class="field"><span>${t('messageForCustomers')}</span><input type="text" id="guide-note" maxlength="150" value="${esc(s.mixedRice?.note || '')}"></label>
    <button type="button" class="btn green" id="guide-save">${t('save')}</button>
  </div>`;
}

function bindPriceGuide(body, s) {
  const box = $('#guide-rows', body);
  const bindRm = () => box.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => b.closest('.price-row').remove(); });
  bindRm();
  $('#guide-add', body).onclick = () => { box.appendChild($('#guide-tpl', body).content.cloneNode(true)); bindRm(); };
  $('#guide-save', body).onclick = (e) => {
    const prices = [...box.querySelectorAll('.price-row')].map((r) => ({
      label: $('[data-k=label]', r).value.trim(),
      labelZh: $('[data-k=labelZh]', r).value.trim(),
      price: Number($('[data-k=price]', r).value) || 0,
    })).filter((p) => p.label || p.labelZh);
    saving(e.currentTarget, () => api.updateStore(s.id, { mixedRice: { ...(s.mixedRice || {}), prices, note: $('#guide-note', body).value.trim() } }));
  };
}

function renderStallInfo(s) {
  const body = shell(stallBack(s), `<form class="card stack" id="info">
      ${photoPickerHtml('store-photo', s.photo, storeArt(s))}
      <label class="field"><span>${t('nameEn')}</span><input type="text" name="name" required maxlength="60" value="${esc(s.name || '')}"></label>
      <label class="field"><span>${t('chineseName')}</span><input type="text" name="nameZh" maxlength="60" value="${esc(s.nameZh || '')}"></label>
      <label class="field"><span>${t('descriptionEn')}</span><textarea name="description" maxlength="400">${esc(s.description || '')}</textarea></label>
      <label class="field"><span>${t('descriptionZh')}</span><textarea name="descriptionZh" maxlength="400">${esc(s.descriptionZh || '')}</textarea></label>
      <label class="field"><span>${t('phone')}</span><input type="text" name="phone" inputmode="tel" maxlength="20" value="${esc(s.phone || '')}"></label>
      <button type="submit" class="btn green big">${t('save')}</button>
    </form>`, `${t('tileInfo')}`);
  const getPhoto = bindPhotoPicker(body, 'store-photo', s.photo, storeArt(s), { maxSide: 720, maxBytes: 80_000 });
  $('#info', body).onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const patch = Object.fromEntries(['name', 'nameZh', 'description', 'descriptionZh', 'phone'].map((k) => [k, f.get(k).trim()]));
    patch.photo = getPhoto();
    saving(e.submitter, () => api.updateStore(s.id, patch));
  };
}

function reviewHtml(r, s, canDelete) {
  return `<div class="card stack" style="gap:6px">
    ${s ? `<div class="row small"><span class="plate sm">${esc(s.number ?? '')}</span><b>${esc(pick(s))}</b></div>` : ''}
    <div class="row"><b>${esc(r.name || '—')}</b><span class="stars">${stars(r.rating)}</span><span class="spacer"></span>
      <span class="small muted">${new Date(r.createdAt).toLocaleDateString()}</span></div>
    ${r.text ? `<div>${esc(r.text)}</div>` : ''}
    ${canDelete ? `<button type="button" class="btn sm danger" style="align-self:flex-end" data-rdel="${esc(r.id)}" data-store="${esc(s?.id || '')}">${t('remove')}</button>` : ''}
  </div>`;
}

function renderStallReviews(s) {
  needReviews(s.id);
  const list = S.reviews[s.id];
  const avg = list?.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;
  const body = shell(stallBack(s), list ? `
    <div class="card row"><span class="rating">${list.length ? avg.toFixed(1) : '–'}</span>
      <span><span class="stars">${stars(avg)}</span><br><span class="muted">${t('reviewsCount', { n: list.length })}</span></span></div>
    ${list.length ? list.map((r) => reviewHtml(r, null, isAdmin()).replace('data-store=""', `data-store="${esc(s.id)}"`)).join('') : `<p class="muted">${t('noReviews')}</p>`}`
    : `<p class="muted">${t('loading')}</p>`, `${t('tileReviews')} · ${esc(pick(s))}`);
  bindReviewDelete(body);
}

function bindReviewDelete(body) {
  body.querySelectorAll('[data-rdel]').forEach((b) => {
    b.onclick = () => {
      if (confirm(t('confirmDelete', { x: t('reviews') }))) saving(b, () => api.deleteReview(b.dataset.store, b.dataset.rdel), t('deleted'));
    };
  });
}

// ---------------------------------------------------------------------------
// Manager screens
// ---------------------------------------------------------------------------
function renderStalls() {
  const body = shell('#/', `
    <a class="btn red big" href="#/stall-edit/new">${ICONS.plus}${t('addStall')}</a>
    <div class="help">${t('stallsHelp')}</div>
    ${S.all.map((s) => `<div class="card stack ${s.ownerUid || s.ownerEmail ? '' : 'warn'}">
      <div class="row" style="flex-wrap:nowrap">
        <span class="plate">${esc(s.number ?? '')}</span>
        <div style="min-width:0"><b style="font-size:1.1rem">${esc(pick(s))}</b> ${pickAlt(s) ? `<span class="muted">${esc(pickAlt(s))}</span>` : ''}
          <div class="small" style="${s.ownerUid || s.ownerEmail ? 'color:var(--open)' : 'color:#8a5a00;font-weight:700'}">
            ${s.ownerUid || s.ownerEmail ? `✓ ${esc(t('ownerIs', { x: s.ownerEmail || s.ownerUid }))}` : `! ${t('noOwner')}`}</div></div>
      </div>
      <div class="grid2">
        <a class="btn" href="#/stall-edit/${encodeURIComponent(s.id)}">${t('edit')}</a>
        <a class="btn" href="#/stall/${encodeURIComponent(s.id)}">${t('menu')}</a>
      </div>
    </div>`).join('')}`, t('tileStalls'));
}

const isGmail = (email) => /@(gmail|googlemail)\.com$/i.test(email || '');

function nextNumber() {
  const used = new Set(S.all.map((s) => Number(s.number)));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

function renderStallEdit(id) {
  const isNew = id === 'new';
  const s = isNew ? null : storeById(id);
  if (!isNew && !s) return go('#/stalls');
  const d = s || { number: nextNumber(), category: 'other', type: 'normal' };
  let owner = { ownerUid: d.ownerUid || '', ownerEmail: d.ownerEmail || '' };
  const linked = () => owner.ownerUid || owner.ownerEmail;
  const body = shell('#/stalls', `<form class="stack" id="sf">
    <div class="card stack">
      <div class="card-title">${t('step1')}</div>
      <div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px">
        <label class="field"><span>${t('stallNumber')}</span><input type="number" name="number" min="1" required value="${esc(d.number)}" style="text-align:center;font-weight:900"></label>
        <label class="field"><span>${t('category')}</span><select name="category">${Object.keys(CATEGORIES).map((c) =>
          `<option value="${c}" ${d.category === c ? 'selected' : ''}>${t(`cat_${c}`)}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>${t('nameEn')}</span><input type="text" name="name" required maxlength="60" value="${esc(d.name || '')}"></label>
      <label class="field"><span>${t('chineseName')}</span><input type="text" name="nameZh" maxlength="60" value="${esc(d.nameZh || '')}"></label>
      <label class="check"><input type="checkbox" name="mixed" ${d.type === 'mixedRice' ? 'checked' : ''}>
        <span><b>${t('mixedRiceMode')}</b><br><span class="help">${t('mixedRiceModeSub')}</span></span></label>
    </div>
    <div class="card stack">
      <div class="card-title">${t('step2')}</div>
      <div id="owner-linked" class="stack ${linked() ? '' : 'hidden'}">
        <div style="color:var(--open);font-weight:700;overflow-wrap:anywhere">✓ ${esc(t('ownerLinked', { x: d.ownerEmail || d.ownerUid || '' }))}</div>
        ${d.ownerEmail && !isGmail(d.ownerEmail) ? `<button type="button" class="btn sm" id="resend">${t('sendSetPw')}</button>` : ''}
        <button type="button" class="btn sm danger" id="unlink">${t('removeOwner')}</button>
      </div>
      <div id="owner-new" class="stack ${linked() ? 'hidden' : ''}">
        <div class="notice">${t('noOwnerYet')}</div>
        <input type="email" name="oemail" placeholder="${esc(t('ownerEmail'))}" autocomplete="off">
        <div class="help"><b>${t('gmailHint')}</b><br>${t('otherHint')}</div>
        <details><summary class="help">${t('linkById')}</summary><input type="text" name="ouid" placeholder="Account ID" style="margin-top:6px"></details>
      </div>
    </div>
    <button type="submit" class="btn green big">${t('save')}</button>
  </form>
  ${isNew ? '' : `<div class="danger-zone stack">
    <b style="color:var(--closed)">${t('dangerZone')}</b><div class="help">${t('deleteHelp')}</div>
    <button type="button" class="btn danger" id="del">${t('deleteStall')}</button></div>`}`,
  isNew ? t('newStall') : t('editStall', { n: d.number }));

  $('#resend', body)?.addEventListener('click', (e) => saving(e.currentTarget, () => api.resetPassword(d.ownerEmail), t('setPwSent')));
  $('#unlink', body)?.addEventListener('click', () => {
    owner = { ownerUid: '', ownerEmail: '' };
    $('#owner-linked', body).classList.add('hidden');
    $('#owner-new', body).classList.remove('hidden');
  });
  $('#del', body)?.addEventListener('click', (e) => {
    if (!confirm(t('confirmDeleteStall', { x: `${s.number} ${pick(s)}` }))) return;
    if (!confirm(t('confirmDeleteStall', { x: `${s.number} ${pick(s)}` }))) return;
    saving(e.currentTarget, () => api.deleteStore(s.id), t('deleted')).then((ok) => ok && go('#/stalls'));
  });
  $('#sf', body).onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const number = Number(f.get('number'));
    if (S.all.some((x) => x.id !== s?.id && Number(x.number) === number)) { toast(t('numberTaken', { n: number }), 'error'); return; }
    const data = {
      number, name: f.get('name').trim(), nameZh: f.get('nameZh').trim(),
      category: f.get('category'), type: f.get('mixed') ? 'mixedRice' : 'normal',
    };
    let doneMsg = t('saved');
    const ok = await saving(e.submitter, async () => {
      const oemail = f.get('oemail').trim().toLowerCase();
      const ouid = f.get('ouid').trim();
      if (!linked() && ouid) owner = { ownerUid: ouid, ownerEmail: oemail };
      else if (!linked() && oemail && isGmail(oemail)) owner = { ownerUid: '', ownerEmail: oemail };
      else if (!linked() && oemail) {
        owner = { ownerUid: (await api.createOwnerAccount(oemail)) || '', ownerEmail: oemail };
        doneMsg = t('setPwSent');
      }
      Object.assign(data, owner);
      if (data.type === 'mixedRice' && !s?.mixedRice) data.mixedRice = { prices: [], note: '' };
      if (isNew) {
        const { findFreeSpot } = await import('./floorplan.js?v=3');
        const rects = [...S.all.map((x) => x.block).filter(Boolean), ...(S.centre.floor?.extras || [])];
        Object.assign(data, {
          description: '', descriptionZh: '', phone: '', photo: '', override: null,
          hours: S.centre.hours || null,
          block: findFreeSpot(rects, S.centre.floor?.cols || 20, S.centre.floor?.rows || 12),
        });
        await api.createStore(data);
      } else {
        await api.updateStore(s.id, data);
      }
    }, null);
    if (ok) { toast(doneMsg); go('#/stalls'); }
  };
}

// --- Floor plan editor -----------------------------------------------------------
function disposePlan() {
  plan?.dispose();
  plan = null;
}

function planData(layout) {
  const floor = layout || S.centre.floor || DEFAULT_CENTRE.floor;
  return {
    cols: floor.cols, rows: floor.rows, extras: floor.extras || [],
    stores: S.all.map((s) => ({ id: s.id, number: s.number, label: pick(s), color: categoryColor(s), block: layout?.blocks?.[s.id] || s.block })),
  };
}

async function renderFloor(force) {
  if (plan && !force && $('#fp')) {
    plan.setData(planData(planDirty ? plan.getLayout() : null));
    return;
  }
  disposePlan();
  const floor = S.centre.floor || DEFAULT_CENTRE.floor;
  const migration = kimSengLayoutMigration(S.centre, S.all);
  const body = shell('#/', `
    ${migration ? `<div class="card stack">
      <b>${t('kimSengLayoutTitle')}</b>
      <p class="help" style="margin:0">${t('kimSengLayoutHelp')}</p>
      <button type="button" class="btn green big" id="apply-kimseng">${t('kimSengLayoutApply')}</button>
    </div>` : ''}
    <div class="help" style="font-size:1rem">${t('floorHelp')}</div>
    <div class="fp-wrap fp-editor" id="fp"></div>
    <div class="card stack" id="sel-box">
      <b id="sel-label">${t('tapToSelect')}</b>
      <div class="grid3">
        <button type="button" class="btn sm" data-act="rotate">⟳ ${t('turn')}</button>
        <button type="button" class="btn sm" data-act="w+">${t('wider')}</button>
        <button type="button" class="btn sm" data-act="w-">${t('narrower')}</button>
        <button type="button" class="btn sm" data-act="h+">${t('longer')}</button>
        <button type="button" class="btn sm" data-act="h-">${t('shorter')}</button>
        <button type="button" class="btn sm danger" data-act="del">${t('removeObj')}</button>
      </div>
    </div>
    <div class="grid3">
      <button type="button" class="btn sm" data-add="table">+ ${t('table')}</button>
      <button type="button" class="btn sm" data-add="entrance">+ ${t('entrance')}</button>
      <button type="button" class="btn sm" data-add="toilet">+ ${t('toilet')}</button>
      <button type="button" class="btn sm" data-add="wall">+ ${t('wall')}</button>
      <button type="button" class="btn sm" data-add="pillar">+ ${t('pillar')}</button>
      <button type="button" class="btn sm" data-add="sink">+ ${t('sink')}</button>
    </div>
    <button type="button" class="btn green big" id="save-plan">${t('saveFloor')}</button>
    <details class="fold"><summary>${t('gridSize')} · ${t('view3d')} / ${t('topView')}</summary><div class="stack">
      <div class="grid2"><button type="button" class="btn sm" data-view="3d">${t('view3d')}</button><button type="button" class="btn sm" data-view="top">${t('topView')}</button></div>
      <div class="row"><input type="number" id="g-cols" min="6" max="60" value="${floor.cols}" style="width:90px" aria-label="columns"> ×
        <input type="number" id="g-rows" min="6" max="60" value="${floor.rows}" style="width:90px" aria-label="rows">
        <button type="button" class="btn sm" id="g-apply">✓</button></div>
      <button type="button" class="btn sm" id="renumber">${t('renumber')}</button>
    </div></details>`, t('tileFloor'));
  const { createFloorPlan, EXTRA_TYPES } = await import('./floorplan.js?v=3');
  if (!$('#fp') || route()[0] !== 'floor') return;
  const markDirty = (v = true) => {
    planDirty = v;
    if ($('#apply-kimseng')) $('#apply-kimseng').disabled = v;
  };
  const selBtns = [...body.querySelectorAll('[data-act]')];
  plan = createFloorPlan($('#fp'), {
    editable: true,
    onChange: () => markDirty(),
    onMessage: (m) => toast(m, 'error'),
    onSelect: (sel) => {
      selBtns.forEach((b) => { b.disabled = !sel || (b.dataset.act === 'del' && sel.kind !== 'extra'); });
      const s = sel?.kind === 'store' && S.all.find((x) => x.id === sel.id);
      $('#sel-label').textContent = !sel ? t('tapToSelect') : t('selected', { x: s ? `${s.number} ${pick(s)}` : t(sel.type) });
    },
  });
  if (!plan) return;
  selBtns.forEach((b) => { b.disabled = true; });
  plan.setData(planData(null));
  planDirty = false;
  $('#apply-kimseng')?.addEventListener('click', (e) => {
    saving(e.currentTarget, () => api.applyKimSengLayout(migration), t('kimSengLayoutSaved'));
  });
  body.querySelectorAll('[data-add]').forEach((b) => { if (EXTRA_TYPES[b.dataset.add]) b.onclick = () => plan.addExtra(b.dataset.add); });
  body.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => plan.setView(b.dataset.view); });
  selBtns.forEach((b) => {
    b.onclick = () => ({
      rotate: () => plan.rotateSelected(),
      'w+': () => plan.resizeSelected(1, 0), 'w-': () => plan.resizeSelected(-1, 0),
      'h+': () => plan.resizeSelected(0, 1), 'h-': () => plan.resizeSelected(0, -1),
      del: () => plan.deleteSelected(),
    })[b.dataset.act]();
  });
  $('#g-apply').onclick = () => {
    const cols = Math.max(6, Math.min(60, Number($('#g-cols').value) || 20));
    const rows = Math.max(6, Math.min(60, Number($('#g-rows').value) || 12));
    const layout = plan.getLayout();
    const fit = (r) => ({ ...r, x: Math.max(0, Math.min(cols - r.w, r.x)), y: Math.max(0, Math.min(rows - r.h, r.y)) });
    Object.assign(layout, { cols, rows, extras: layout.extras.map(fit) });
    for (const k of Object.keys(layout.blocks)) layout.blocks[k] = fit(layout.blocks[k]);
    plan.setData(planData(layout));
    markDirty();
  };
  $('#renumber').onclick = (e) => {
    if (!confirm(`${t('renumber')}?`)) return;
    const patches = {};
    S.all.forEach((s, i) => { if (s.number !== i + 1) patches[s.id] = { number: i + 1 }; });
    saving(e.currentTarget, () => api.updateStores(patches));
  };
  $('#save-plan').onclick = (e) => {
    const layout = plan.getLayout();
    saving(e.currentTarget, async () => {
      await api.updateCentre({ floor: { cols: layout.cols, rows: layout.rows, extras: layout.extras } });
      const patches = {};
      for (const s of S.all) {
        const b = layout.blocks[s.id];
        if (b && JSON.stringify(b) !== JSON.stringify(s.block)) patches[s.id] = { block: b };
      }
      if (Object.keys(patches).length) await api.updateStores(patches);
      markDirty(false);
    }, t('floorSaved'));
  };
}

// --- Name, hours & notice ------------------------------------------------------------
function renderCentre() {
  const c = S.centre;
  const cs = centreStatus(c);
  const body = shell('#/', `
    <form class="card stack" id="cinfo">
      <div class="card-title">${t('shopName')}</div>
      <label class="field"><span>${t('chineseNameShop')}</span><input type="text" name="nameZh" maxlength="40" value="${esc(c.nameZh || '')}" class="sign" style="color:var(--red);font-size:1.3rem"></label>
      <label class="field"><span>${t('nameEnShop')}</span><input type="text" name="name" maxlength="80" value="${esc(c.name || '')}"></label>
      <div class="help">${t('nameWhere')}</div>
      <div class="card-title" style="margin-top:8px">${t('noticeTitle')}</div>
      <input type="text" name="announcement" maxlength="200" value="${esc(c.announcement || '')}" aria-label="${t('noticeTitle')}">
      <div class="help">${t('noticeHelp')}</div>
      <label class="field"><span>${t('address')}</span><input type="text" name="address" maxlength="200" value="${esc(c.address || '')}"></label>
      <button type="submit" class="btn green big">${t('save')}</button>
    </form>
    <div class="section-title">${t('shopOpenClose')}</div>
    ${statusBox(cs, `${t('now')}: ${cs.open ? t('openNowBig') : t('closedBig')}`)}
    ${statusChoicesHtml(c.override)}
    ${hoursEditorHtml(c.hours, t('shopHours'))}`, t('tileCentre'));
  $('#cinfo', body).onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    saving(e.submitter, () => api.updateCentre(Object.fromEntries(['name', 'nameZh', 'announcement', 'address'].map((k) => [k, f.get(k).trim()]))));
  };
  bindStatusChoices(body, (override) => api.updateCentre({ override }));
  bindHoursEditor(body, (hours) => api.updateCentre({ hours }));
}

// --- QR codes ------------------------------------------------------------------------
function qrSvg(text) {
  /* global qrcode */
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}

function printArea() {
  const c = S.centre;
  const url = S.siteUrl;
  const head = `<div class="head">${esc(c.nameZh || c.name || '')}</div>`;
  if (S.qrMode === 'poster') {
    return `<div class="qr-poster">
      <div class="signboard"><div class="frame"><div class="zh">${esc(c.nameZh || c.name || '')}</div>${c.nameZh && c.name ? `<div class="en">${esc(c.name)}</div>` : ''}</div></div>
      <div class="tiles"></div>
      <div class="body">
        <div class="call">扫码看菜单</div>
        ${qrSvg(url)}
        <div class="langs"><b>Scan for stalls, menus &amp; opening status</b><br>扫码查看档口、菜单和营业状态<br>Imbas untuk gerai, menu &amp; status buka</div>
        <div class="muted small">${esc(url)}</div>
      </div></div>`;
  }
  if (S.qrMode === 'tables') {
    const svg = qrSvg(url);
    return `<div class="qr-cards">${Array.from({ length: S.tableCount }, (_, i) => `<div class="qr-card">${head}${svg}
      <div class="small">Menu · 菜单</div><div class="num">${t('tableLabel', { n: i + 1 })}</div></div>`).join('')}</div>`;
  }
  return `<div class="qr-cards">${S.all.map((s) => `<div class="qr-card">${head}
    <div class="num">${esc(s.number)} · ${esc(s.nameZh || s.name || '')}</div>
    ${qrSvg(`${url}#/store/${encodeURIComponent(s.id)}`)}<div class="small">${esc(s.name || '')} · Menu 菜单</div></div>`).join('')}</div>`;
}

function renderQr() {
  const pickBtn = (mode, title, sub) => `<button type="button" class="qr-pick ${S.qrMode === mode ? 'on' : ''}" data-qm="${mode}">
    <span><b>${title}${S.qrMode === mode ? ' ✓' : ''}</b><br><span class="help">${sub}</span></span></button>`;
  const body = shell('#/', `
    <b>${t('whatToPrint')}</b>
    ${pickBtn('poster', t('qrPoster'), t('qrPosterSub'))}
    ${pickBtn('tables', t('qrTables'), t('qrTablesSub'))}
    ${pickBtn('stalls', t('qrStalls'), t('qrStallsSub'))}
    ${S.qrMode === 'tables' ? `<label class="field"><span>${t('tableCount')}</span><input type="number" id="qr-n" min="1" max="200" value="${S.tableCount}"></label>` : ''}
    <button type="button" class="btn red big" id="qr-print">${t('print')}</button>
    <div id="print-area">${printArea()}</div>
    <details class="fold"><summary>${t('siteUrl')}</summary><div><input type="url" id="qr-url" value="${esc(S.siteUrl)}"></div></details>`, t('tileQR'));
  body.querySelectorAll('[data-qm]').forEach((b) => { b.onclick = () => { S.qrMode = b.dataset.qm; renderQr(); }; });
  $('#qr-n', body)?.addEventListener('change', (e) => { S.tableCount = Math.max(1, Math.min(200, Number(e.target.value) || 1)); $('#print-area').innerHTML = printArea(); });
  $('#qr-url', body).onchange = (e) => { S.siteUrl = e.target.value.trim(); $('#print-area').innerHTML = printArea(); };
  $('#qr-print', body).onclick = () => window.print();
}

// --- All reviews -------------------------------------------------------------------
function renderAllReviews() {
  S.all.forEach((s) => needReviews(s.id));
  const stores = S.reviewFilter === 'all' ? S.all : S.all.filter((s) => s.id === S.reviewFilter);
  const list = stores.flatMap((s) => (S.reviews[s.id] || []).map((r) => ({ r, s }))).sort((a, b) => b.r.createdAt - a.r.createdAt);
  const body = shell('#/', `
    <label class="field"><span>${t('showReviewsFor')}</span><select id="rf">
      <option value="all">${t('allReviews')}</option>
      ${S.all.map((s) => `<option value="${esc(s.id)}" ${S.reviewFilter === s.id ? 'selected' : ''}>${esc(s.number)} · ${esc(pick(s))}</option>`).join('')}
    </select></label>
    <div class="help">${t('reviewsHelp')}</div>
    ${list.length ? list.map(({ r, s }) => reviewHtml(r, s, true)).join('') : `<p class="muted">${t('noReviews')}</p>`}`, t('tileMgrReviews'));
  $('#rf', body).onchange = (e) => { S.reviewFilter = e.target.value; e.target.blur(); render(true); };
  bindReviewDelete(body);
}

// --- Managers ------------------------------------------------------------------------
function renderAdmins() {
  const body = shell('#/', `
    <div class="help" style="font-size:1rem">${t('adminsHelp')}</div>
    ${S.admins.map((em) => `<div class="card row" style="flex-wrap:nowrap">
      <div style="flex:1;min-width:0"><b style="overflow-wrap:anywhere">${esc(em)}</b>${em === S.user.email ? `<div class="small muted">${t('you')}</div>` : ''}</div>
      ${S.admins.length > 1 ? `<button type="button" class="btn sm danger" data-rm="${esc(em)}">${t('remove')}</button>` : ''}
    </div>`).join('')}
    <form class="card stack" id="add-admin">
      <label class="field"><span>${t('addManager')}</span><input type="email" name="email" required placeholder="name@gmail.com"></label>
      <button type="submit" class="btn green big">${t('add')}</button>
    </form>
    <div class="notice">${t('lastManager')}</div>`, t('tileAdmins'));
  const save = (btn, emails) => saving(btn, async () => { await api.setAdmins(emails); S.admins = emails; }).then((ok) => ok && render(true));
  body.querySelectorAll('[data-rm]').forEach((b) => {
    b.onclick = () => {
      const em = b.dataset.rm;
      if (em === S.user.email ? !confirm(t('removeSelf')) : !confirm(t('confirmDelete', { x: em }))) return;
      save(b, S.admins.filter((x) => x !== em));
    };
  });
  $('#add-admin', body).onsubmit = (e) => {
    e.preventDefault();
    const em = e.target.email.value.trim().toLowerCase();
    if (!em || S.admins.includes(em)) return;
    e.target.email.blur();
    save(e.submitter, [...S.admins, em]);
  };
}

// --- Account (email/password stall owners) ------------------------------------------------
function renderAccount() {
  const body = shell('#/', `<form class="card stack" id="pw">
      <div>${t('email')}: <b>${esc(S.user.email)}</b></div>
      <label class="field"><span>${t('newPassword')}</span><input type="password" name="pw" minlength="6" required autocomplete="new-password"></label>
      <button type="submit" class="btn green big">${t('changePassword')}</button>
    </form>`, t('changePassword'));
  $('#pw', body).onsubmit = (e) => {
    e.preventDefault();
    saving(e.submitter, () => api.changePassword(e.target.pw.value), t('passwordChanged')).then((ok) => ok && e.target.reset());
  };
}
