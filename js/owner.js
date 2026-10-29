// Stall owner page: open/closed status, stall info, menu and reviews.
// The admin can also open this page for any stall via owner.html?store=<id>.
import { getApi, errorText } from './api.js';
import { t, pick, langSwitcher, bindLangSwitcher } from './i18n.js';
import { storeStatus } from './status.js';
import { $, esc, toast, stars, categoryOf } from './util.js';
import {
  saving, statusControlHtml, bindStatusControl, hoursEditorHtml, bindHoursEditor,
  photoPickerHtml, bindPhotoPicker, openItemDialog, itemRowHtml,
} from './forms.js';

const api = await getApi();
const app = $('#app');
const params = new URLSearchParams(location.search);

const state = {
  user: undefined, isAdmin: false, stores: null, storeId: params.get('store'),
  centre: null, items: null, reviews: null, tab: 'status',
};
let unsubs = [];
let unsubStore = [];

api.watchCentre((c) => { state.centre = c; if (state.tab === 'status') render(); });
api.onAuth(async (u) => {
  state.user = u;
  unsubs.forEach((f) => f());
  unsubs = [];
  state.stores = null;
  if (u) {
    const admins = await api.getAdmins().catch(() => null);
    state.isAdmin = !!admins?.includes(u.email);
    const watch = state.isAdmin && params.get('store') ? api.watchStores : (cb) => api.watchOwnedStores(u.uid, cb);
    unsubs.push(watch((list) => {
      state.stores = list;
      if (!list.some((s) => s.id === state.storeId)) selectStore(list[0]?.id || null);
      render();
    }));
  }
  render();
});
window.addEventListener('langchange', () => render());

function selectStore(id) {
  unsubStore.forEach((f) => f());
  unsubStore = [];
  state.storeId = id;
  state.items = null;
  state.reviews = null;
  if (!id) return;
  unsubStore = [
    api.watchItems(id, (items) => { state.items = items; if (state.tab === 'menu') render(); }),
    api.watchReviews(id, (r) => { state.reviews = r; if (state.tab === 'reviews') render(); }),
  ];
}

const store = () => state.stores?.find((s) => s.id === state.storeId);

function header() {
  return `<header class="topbar"><div class="wrap">
    <a class="brand" href="index.html"><b>🧑‍🍳 ${t('ownerTitle')}</b><span>${esc(pick(state.centre) || t('centreName'))}</span></a>
    <span class="spacer"></span>${langSwitcher()}
  </div></header>
  ${api.mode === 'demo' ? `<div class="banner demo">${t('demoBanner')} Logins: drinks@demo.com / rice@demo.com — password demo123</div>` : ''}`;
}

function render() {
  if (state.user === undefined) return;
  if (!state.user) return renderLogin();
  if (!state.stores) { app.innerHTML = header() + `<p class="wrap muted">${t('loading')}</p>`; bindLangSwitcher(app); return; }
  const s = store();
  if (!s) return renderUnlinked();

  // Keep what the owner is typing if live data arrives mid-edit.
  const active = document.activeElement;
  if (active?.matches?.('input[type=text], textarea, input[type=date], input[type=time]') && app.contains(active)) return;

  const tabs = ['status', 'info', 'menu', 'reviews', 'account'];
  const labels = { status: t('status'), info: t('storeInfo'), menu: t('menu'), reviews: t('reviews'), account: '⚙️' };
  app.innerHTML = `${header()}
    <nav class="tabs"><div class="wrap">${tabs.map((k) =>
      `<button class="tab ${state.tab === k ? 'active' : ''}" data-tab="${k}">${labels[k]}</button>`).join('')}</div></nav>
    <main class="wrap section">
      <div class="row" style="margin-bottom:12px">
        <span class="badge-num">${esc(s.number ?? '')}</span><h1 style="margin:0">${esc(pick(s))}</h1>
        <span class="spacer"></span>
        ${state.stores.length > 1 ? `<select id="store-pick" style="width:auto" aria-label="${t('chooseStall')}">${state.stores.map((x) =>
          `<option value="${esc(x.id)}" ${x.id === s.id ? 'selected' : ''}>${esc(x.number)} · ${esc(pick(x))}</option>`).join('')}</select>` : ''}
      </div>
      <div id="tab-body"></div>
    </main>`;
  bindLangSwitcher(app);
  app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { state.tab = b.dataset.tab; render(); }; });
  $('#store-pick')?.addEventListener('change', (e) => { selectStore(e.target.value); render(); });
  const body = $('#tab-body');
  ({ status: renderStatus, info: renderInfo, menu: renderMenu, reviews: renderReviews, account: renderAccount })[state.tab](body, s);
}

function renderLogin() {
  app.innerHTML = `${header()}
    <main class="wrap"><div class="card login-box stack">
      <h1>${t('ownerTitle')} · ${t('signIn')}</h1>
      <form id="login" class="stack">
        <label class="field"><span>${t('email')}</span><input type="email" name="email" required autocomplete="username"></label>
        <label class="field"><span>${t('password')}</span><input type="password" name="password" required autocomplete="current-password"></label>
        <button class="btn primary block" type="submit">${t('signIn')}</button>
      </form>
      <button class="btn ghost small" id="forgot">${t('forgotPassword')}</button>
      <div class="divider">— or —</div>
      <button class="btn block" id="google">G ${t('signInGoogle')}</button>
      <a class="small" href="index.html">← ${t('back')}</a>
    </div></main>`;
  bindLangSwitcher(app);
  $('#login').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try { await api.signInEmail(f.get('email'), f.get('password')); } catch (err) { toast(errorText(err), 'error'); }
  };
  $('#forgot').onclick = async () => {
    const email = $('[name=email]').value.trim();
    if (!email) { $('[name=email]').focus(); return; }
    try { await api.resetPassword(email); toast(t('resetSent')); } catch (err) { toast(errorText(err), 'error'); }
  };
  $('#google').onclick = () => api.signInGoogle().catch((err) => toast(errorText(err), 'error'));
}

function renderUnlinked() {
  app.innerHTML = `${header()}
    <main class="wrap"><div class="card login-box stack">
      <p>${t('noStoreLinked')}</p>
      <p class="small muted">${t('giveIdToAdmin')}</p>
      <code class="id">${esc(state.user.uid)}</code>
      <p class="small muted">${esc(state.user.email)}</p>
      <button class="btn" id="out">${t('signOut')}</button>
    </div></main>`;
  bindLangSwitcher(app);
  $('#out').onclick = () => api.signOut();
}

// --- Tabs ----------------------------------------------------------------------
function renderStatus(body, s) {
  const st = storeStatus(s, state.centre);
  body.innerHTML = `<div class="stack">${statusControlHtml(st, s.override)}${hoursEditorHtml(s.hours)}</div>`;
  bindStatusControl(body, (override) => api.updateStore(s.id, { override }));
  bindHoursEditor(body, (hours) => api.updateStore(s.id, { hours }));
}

function renderInfo(body, s) {
  body.innerHTML = `
    <form class="card stack" id="info">
      ${photoPickerHtml('store-photo', s.photo, categoryOf(s).emoji)}
      <div class="grid2">
        <label class="field"><span>${t('name')}</span><input type="text" name="name" required maxlength="60" value="${esc(s.name || '')}"></label>
        <label class="field"><span>${t('nameZh')}</span><input type="text" name="nameZh" maxlength="60" value="${esc(s.nameZh || '')}"></label>
      </div>
      <label class="field"><span>${t('description')}</span><textarea name="description" maxlength="400">${esc(s.description || '')}</textarea></label>
      <label class="field"><span>${t('descriptionZh')}</span><textarea name="descriptionZh" maxlength="400">${esc(s.descriptionZh || '')}</textarea></label>
      <label class="field"><span>${t('phone')}</span><input type="text" name="phone" inputmode="tel" maxlength="20" value="${esc(s.phone || '')}"></label>
      <button class="btn primary" type="submit">${t('save')}</button>
    </form>`;
  const getPhoto = bindPhotoPicker(body, 'store-photo', s.photo, { maxSide: 720, maxBytes: 80_000, emoji: categoryOf(s).emoji });
  $('#info').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const patch = Object.fromEntries(['name', 'nameZh', 'description', 'descriptionZh', 'phone'].map((k) => [k, f.get(k).trim()]));
    patch.photo = getPhoto();
    saving(e.submitter, () => api.updateStore(s.id, patch));
  };
}

function renderMenu(body, s) {
  const mixed = s.type === 'mixedRice';
  const items = state.items;
  body.innerHTML = `
    ${mixed ? priceGuideHtml(s) : ''}
    ${mixed ? `<h2 class="section">${t('mixedRiceDishes')}</h2><p class="note small">${t('mixedRiceNote')}</p>` : ''}
    <button class="btn primary" id="add-item" style="margin:12px 0">＋ ${t('addFood')}</button>
    <div class="list" id="item-list">${items ? items.map(itemRowHtml).join('') : t('loading')}</div>
    <datalist id="sections">${[...new Set((items || []).map((i) => i.section).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
  if (mixed) bindPriceGuide(body, s);
  $('#add-item').onclick = () => openItemDialog({ mixedRice: mixed, onSave: (data) => api.addItem(s.id, data) });
  body.querySelectorAll('[data-item]').forEach((row) => {
    const it = items.find((x) => x.id === row.dataset.item);
    $('[data-avail]', row).onchange = (e) => saving(null, () => api.updateItem(s.id, it.id, { available: e.target.checked }),
      e.target.checked ? t('available') : t('soldOut'));
    $('[data-edit]', row).onclick = () => openItemDialog({ item: it, mixedRice: mixed, onSave: (data) => api.updateItem(s.id, it.id, data) });
    $('[data-del]', row).onclick = (e) => {
      if (confirm(t('confirmDelete', { x: pick(it) }))) saving(e.currentTarget, () => api.deleteItem(s.id, it.id), t('deleted'));
    };
  });
}

function priceGuideHtml(s) {
  const rows = s.mixedRice?.prices || [];
  const row = (p = {}) => `<div class="row price-row">
    <input type="text" data-k="label" placeholder="${esc(t('priceRow'))}" maxlength="40" value="${esc(p.label || '')}">
    <input type="text" data-k="labelZh" placeholder="中文" maxlength="40" value="${esc(p.labelZh || '')}">
    <input type="number" data-k="price" placeholder="RM" min="0" step="0.1" inputmode="decimal" value="${esc(p.price ?? '')}">
    <button type="button" class="btn small danger" data-rm aria-label="${t('delete')}">✕</button></div>`;
  return `<div class="card stack" id="guide">
    <h2>💰 ${t('mixedRiceGuide')}</h2>
    <div class="stack price-rows" id="guide-rows">${rows.map(row).join('')}</div>
    <template id="guide-tpl">${row()}</template>
    <label class="field"><span>${t('noteOptional')}</span><input type="text" id="guide-note" maxlength="150" value="${esc(s.mixedRice?.note || '')}"></label>
    <div class="row"><button type="button" class="btn small" id="guide-add">＋ ${t('addRow')}</button><span class="spacer"></span>
      <button type="button" class="btn primary" id="guide-save">${t('save')}</button></div>
  </div>`;
}

function bindPriceGuide(body, s) {
  const rowsBox = $('#guide-rows', body);
  const bindRm = () => rowsBox.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => b.closest('.price-row').remove(); });
  bindRm();
  $('#guide-add', body).onclick = () => {
    rowsBox.appendChild($('#guide-tpl', body).content.cloneNode(true));
    bindRm();
  };
  $('#guide-save', body).onclick = (e) => {
    const prices = [...rowsBox.querySelectorAll('.price-row')].map((r) => ({
      label: $('[data-k=label]', r).value.trim(),
      labelZh: $('[data-k=labelZh]', r).value.trim(),
      price: Number($('[data-k=price]', r).value) || 0,
    })).filter((p) => p.label || p.labelZh);
    saving(e.currentTarget, () => api.updateStore(s.id, { mixedRice: { ...(s.mixedRice || {}), prices, note: $('#guide-note', body).value.trim() } }));
  };
}

function renderReviews(body, s) {
  const list = state.reviews;
  if (!list) { body.textContent = t('loading'); return; }
  const avg = list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;
  body.innerHTML = `
    <div class="card">
      <div class="row"><span class="rating-big">${list.length ? avg.toFixed(1) : '–'}</span>
        <span><span class="stars">${stars(avg)}</span><br><span class="small muted">${t('reviewsCount', { n: list.length })}</span></span></div>
      ${list.length ? list.map((r) => `<div class="review">
        <div class="row"><b>${esc(r.name || '—')}</b><span class="stars">${stars(r.rating)}</span><span class="spacer"></span>
          <span class="small muted">${new Date(r.createdAt).toLocaleDateString()}</span>
          ${state.isAdmin ? `<button class="btn small danger" data-rdel="${esc(r.id)}">${t('delete')}</button>` : ''}</div>
        ${r.text ? `<div>${esc(r.text)}</div>` : ''}</div>`).join('') : `<p class="muted">${t('noReviews')}</p>`}
    </div>`;
  body.querySelectorAll('[data-rdel]').forEach((b) => {
    b.onclick = () => { if (confirm(t('confirmDelete', { x: t('reviews') }))) saving(b, () => api.deleteReview(s.id, b.dataset.rdel), t('deleted')); };
  });
}

function renderAccount(body) {
  const isPassword = state.user.provider === 'password';
  body.innerHTML = `<div class="card stack">
      <div>${t('email')}: <b>${esc(state.user.email)}</b></div>
      ${isPassword ? `<form id="pw" class="row">
        <input type="password" name="pw" minlength="6" required placeholder="${esc(t('newPassword'))}" autocomplete="new-password" style="flex:1">
        <button class="btn" type="submit">${t('changePassword')}</button></form>` : ''}
      ${state.isAdmin ? `<a class="btn" href="admin.html">🛠️ ${t('adminTitle')}</a>` : ''}
      <button class="btn danger" id="out">${t('signOut')}</button>
    </div>`;
  $('#out', body).onclick = () => api.signOut();
  $('#pw', body)?.addEventListener('submit', (e) => {
    e.preventDefault();
    saving(e.submitter, () => api.changePassword(e.target.pw.value), t('passwordChanged')).then((ok) => ok && e.target.reset());
  });
}
