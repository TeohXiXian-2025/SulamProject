// Customer website: stall list, stall page (menu + reviews) and 3D floor plan.
import { getApi, errorText } from './api.js';
import { t, pick, pickAlt, langSwitcher, bindLangSwitcher } from './i18n.js';
import { centreStatus, storeStatus, statusPill, hoursTable, nowLocal } from './status.js';
import { $, esc, fmtPrice, toast, stars, categoryOf, photoOrEmoji } from './util.js';

const api = await getApi();
const app = $('#app');

const state = {
  centre: null,
  stores: null,
  user: null,
  filterOpen: false,
  query: '',
  // Per-stall page subscriptions
  storeId: null,
  items: null,
  reviews: null,
  draftRating: 0,
};
let unsubStore = [];
let plan = null;

api.watchCentre((c) => { state.centre = c; render(); });
api.watchStores((s) => { state.stores = s; render(); });
api.onAuth((u) => { state.user = u; if (route().page === 'store') renderPage(); });
window.addEventListener('hashchange', () => render(true));
window.addEventListener('langchange', () => render(true));
// Opening status depends on the clock, so refresh it every minute.
setInterval(() => render(), 60_000);

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'store' && parts[1]) return { page: 'store', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'map') return { page: 'map', id: parts[1] ? decodeURIComponent(parts[1]) : null };
  return { page: 'home' };
}

let lastShellKey = '';
function render(force = false) {
  if (!state.centre || !state.stores) return;
  const r = route();
  const cs = centreStatus(state.centre);
  const shellKey = [r.page, document.documentElement.lang, cs.open, cs.note, state.centre.announcement, pick(state.centre)].join('|');
  if (force || shellKey !== lastShellKey || !$('#page')) {
    if (r.page !== 'map') disposePlan();
    lastShellKey = shellKey;
    app.innerHTML = `
      <header class="topbar"><div class="wrap">
        <a class="brand" href="#/"><b>${esc(pick(state.centre) || t('centreName'))}</b>
          <span>${esc(pickAlt(state.centre) || '')}</span></a>
        ${statusPill(cs)}
        <span class="spacer"></span>
        ${langSwitcher()}
      </div></header>
      <nav class="tabs"><div class="wrap">
        <a class="tab ${r.page !== 'map' ? 'active' : ''}" href="#/">${t('stalls')}</a>
        <a class="tab ${r.page === 'map' ? 'active' : ''}" href="#/map">${t('floorPlan')}</a>
      </div></nav>
      ${api.mode === 'demo' ? `<div class="banner demo">${t('demoBanner')}</div>` : ''}
      ${!cs.open ? `<div class="banner closed">${t('centreClosed')}${cs.detail ? ` · ${esc(cs.detail)}` : ''}${cs.note ? ` — ${esc(cs.note)}` : ''}</div>` : ''}
      ${state.centre.announcement ? `<div class="banner announce">📢 ${esc(state.centre.announcement)}</div>` : ''}
      <main class="wrap" id="page"></main>
      <footer class="footer">${esc(state.centre.address || '')}<br>
        <a href="owner.html">${t('ownerPage')}</a> · <a href="admin.html">${t('adminPage')}</a></footer>`;
    bindLangSwitcher(app);
  }
  if (r.page !== 'store' && state.storeId) leaveStore();
  if (r.page === 'store' && r.id !== state.storeId) enterStore(r.id);
  renderPage(force);
}

function renderPage(force) {
  const r = route();
  if (r.page === 'home') renderHome(force);
  else if (r.page === 'store') renderStore();
  else renderMap(r.id);
}

// ---------------------------------------------------------------------------
// Home: list of stalls
// ---------------------------------------------------------------------------
function renderHome(force) {
  const page = $('#page');
  if (force || !$('#store-grid')) {
    page.innerHTML = `
      <div class="toolbar">
        <input type="search" id="q" placeholder="${esc(t('search'))}" value="${esc(state.query)}" aria-label="${esc(t('search'))}">
        <button class="btn ${state.filterOpen ? 'on' : ''}" id="f-open">● ${t('openNow')}</button>
      </div>
      <div class="store-grid" id="store-grid"></div>`;
    $('#q').oninput = (e) => { state.query = e.target.value; renderGrid(); };
    $('#f-open').onclick = (e) => {
      state.filterOpen = !state.filterOpen;
      e.currentTarget.classList.toggle('on', state.filterOpen);
      renderGrid();
    };
  }
  renderGrid();
}

function renderGrid() {
  const now = nowLocal();
  const q = state.query.trim().toLowerCase();
  const list = state.stores
    .map((s) => ({ s, st: storeStatus(s, state.centre, now) }))
    .filter(({ s, st }) => (!state.filterOpen || st.open) && (!q ||
      [s.name, s.nameZh, t(`cat_${s.category}`), String(s.number)].some((v) => String(v || '').toLowerCase().includes(q))));
  $('#store-grid').innerHTML = list.length ? list.map(({ s, st }) => `
    <a class="store-card ${st.open ? '' : 'is-closed'}" href="#/store/${encodeURIComponent(s.id)}">
      <div class="thumb-wrap">${photoOrEmoji(s.photo, categoryOf(s).emoji, 'thumb')}
        <span class="badge-num num">${esc(s.number ?? '')}</span></div>
      <div class="body">
        <span class="name">${esc(pick(s))}</span>
        ${pickAlt(s) ? `<span class="small muted">${esc(pickAlt(s))}</span>` : ''}
        <span class="spacer"></span>
        <span>${statusPill(st)}</span>
        ${st.detail ? `<span class="small muted">${esc(st.detail)}</span>` : ''}
      </div>
    </a>`).join('') : `<p class="muted">—</p>`;
}

// ---------------------------------------------------------------------------
// Stall page
// ---------------------------------------------------------------------------
function enterStore(id) {
  leaveStore();
  state.storeId = id;
  state.draftRating = 0;
  unsubStore = [
    api.watchItems(id, (items) => { state.items = items; renderPage(); }),
    api.watchReviews(id, (reviews) => { state.reviews = reviews; renderPage(); }),
  ];
}
function leaveStore() {
  unsubStore.forEach((u) => u());
  unsubStore = [];
  Object.assign(state, { storeId: null, items: null, reviews: null });
}

function renderStore() {
  const page = $('#page');
  const s = state.stores.find((x) => x.id === state.storeId);
  if (!s) {
    page.innerHTML = `<p class="section">${t('notFound')}</p><a class="btn" href="#/">${t('back')}</a>`;
    return;
  }
  // Keep the review text the user is typing when live data refreshes.
  const draftText = $('#rv-text')?.value;
  const st = storeStatus(s, state.centre);
  const cat = categoryOf(s);
  page.innerHTML = `
    <div class="store-hero">${photoOrEmoji(s.photo, cat.emoji)}</div>
    <div class="store-head">
      <span class="badge-num">${esc(s.number ?? '')}</span>
      <div style="flex:1;min-width:0">
        <h1>${esc(pick(s))}</h1>
        ${pickAlt(s) ? `<div class="muted">${esc(pickAlt(s))}</div>` : ''}
        <div class="small muted">${cat.emoji} ${t(`cat_${s.category}`)}</div>
      </div>
    </div>
    <div class="status-box">
      <div class="row">${statusPill(st)} <span class="muted small">${esc(st.detail)}</span></div>
      ${st.note ? `<div class="small">📢 ${esc(st.note)}</div>` : ''}
    </div>
    <div class="row" style="margin:14px 0">
      <a class="btn" href="#/map/${encodeURIComponent(s.id)}">📍 ${t('showOnMap')}</a>
      ${s.phone ? `<a class="btn" href="tel:${esc(s.phone)}">📞 ${esc(s.phone)}</a>` : ''}
    </div>
    ${pick(s, 'description') ? `<p>${esc(pick(s, 'description'))}</p>` : ''}
    ${hoursTable(s.hours) ? `<details class="section"><summary><b>${t('openingHours')}</b></summary>
      <table class="hours">${hoursTable(s.hours)}</table></details>` : ''}
    ${s.type === 'mixedRice' ? mixedRiceHtml(s) : menuHtml()}
    ${reviewsHtml()}
    <p><a class="btn" href="#/">← ${t('back')}</a></p>`;
  if (draftText != null && $('#rv-text')) $('#rv-text').value = draftText;
  bindReviewForm(s);
}

function menuHtml() {
  if (!state.items) return `<p class="muted">${t('loading')}</p>`;
  if (!state.items.length) return '';
  const groups = new Map();
  for (const it of state.items) {
    const key = pick(it, 'section');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  return `<h2 class="section">${t('menu')}</h2>` + [...groups].map(([sec, items]) => `
    ${sec ? `<h3 class="menu-section-title">${esc(sec)}</h3>` : ''}
    <div class="menu-list">${items.map(itemHtml).join('')}</div>`).join('');
}

function itemHtml(it) {
  const sold = it.available === false;
  return `<div class="menu-item ${sold ? 'sold' : ''}">
    ${photoOrEmoji(it.photo, '🍽️', 'pic')}
    <div class="info">
      <div class="fname">${esc(pick(it))}</div>
      ${pickAlt(it) ? `<div class="small muted">${esc(pickAlt(it))}</div>` : ''}
      ${pick(it, 'description') ? `<div class="small muted">${esc(pick(it, 'description'))}</div>` : ''}
      ${sold ? `<span class="tag-sold">${t('soldOut')}</span>` : ''}
    </div>
    ${it.price != null && it.price !== '' ? `<div class="price">${fmtPrice(it.price)}</div>` : ''}
  </div>`;
}

const KINDS = ['meat', 'fish', 'veg', 'egg', 'other'];
function mixedRiceHtml(s) {
  const prices = s.mixedRice?.prices || [];
  const items = state.items || [];
  return `
    ${prices.length ? `<div class="card section"><h2>💰 ${t('mixedRiceGuide')}</h2>
      <table class="price-guide">${prices.map((p) => `<tr><td>${esc(pick(p, 'label'))}</td><td>${fmtPrice(p.price)}</td></tr>`).join('')}</table>
      ${pick(s.mixedRice, 'note') ? `<p class="small muted">${esc(pick(s.mixedRice, 'note'))}</p>` : ''}</div>` : ''}
    <h2 class="section">${t('mixedRiceDishes')}</h2>
    <p class="note">ℹ️ ${t('mixedRiceNote')}</p>
    ${KINDS.map((k) => {
      const list = items.filter((it) => (it.kind || 'other') === k);
      return list.length ? `<h3 class="menu-section-title">${t(`kind_${k}`)}</h3>
        <div class="menu-list">${list.map(itemHtml).join('')}</div>` : '';
    }).join('')}`;
}

function reviewsHtml() {
  const reviews = state.reviews || [];
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const mine = state.user && reviews.find((r) => r.id === state.user.uid);
  const rating = state.draftRating || mine?.rating || 0;
  const form = state.user ? `
    <div class="card stack" id="rv-form">
      <b>${mine ? t('yourReview') : t('writeReview')}</b>
      <div class="star-input" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) =>
        `<button type="button" data-star="${n}" class="${n <= rating ? 'on' : ''}" aria-label="${n}">★</button>`).join('')}</div>
      <textarea id="rv-text" maxlength="500" placeholder="…">${esc(mine?.text || '')}</textarea>
      <div class="row">
        <button class="btn primary" id="rv-save">${t('submit')}</button>
        ${mine ? `<button class="btn danger" id="rv-del">${t('deleteMyReview')}</button>` : ''}
        <span class="spacer"></span>
        <button class="btn ghost small" id="rv-out">${t('signOut')}</button>
      </div>
    </div>`
    : `<button class="btn" id="rv-in">G ${t('signInToReview')}</button>`;
  return `
    <section class="section" id="reviews">
      <h2>${t('reviews')}</h2>
      ${reviews.length ? `<div class="row"><span class="rating-big">${avg.toFixed(1)}</span>
        <span><span class="stars">${stars(avg)}</span><br><span class="small muted">${t('reviewsCount', { n: reviews.length })}</span></span></div>` : ''}
      <div style="margin:12px 0">${form}</div>
      ${reviews.length ? reviews.map((r) => `
        <div class="review">
          <div class="row"><b>${esc(r.name || '—')}</b><span class="stars">${stars(r.rating)}</span>
            <span class="spacer"></span><span class="small muted">${new Date(r.createdAt).toLocaleDateString()}</span></div>
          ${r.text ? `<div>${esc(r.text)}</div>` : ''}
        </div>`).join('') : `<p class="muted">${t('noReviews')}</p>`}
    </section>`;
}

function bindReviewForm(s) {
  $('#rv-in')?.addEventListener('click', () => api.signInGoogle().catch((e) => toast(errorText(e), 'error')));
  $('#rv-out')?.addEventListener('click', () => api.signOut());
  document.querySelectorAll('[data-star]').forEach((b) => {
    b.onclick = () => {
      state.draftRating = Number(b.dataset.star);
      document.querySelectorAll('[data-star]').forEach((x) => x.classList.toggle('on', Number(x.dataset.star) <= state.draftRating));
    };
  });
  $('#rv-save')?.addEventListener('click', async (e) => {
    const mine = state.reviews?.find((r) => r.id === state.user.uid);
    const rating = state.draftRating || mine?.rating || 0;
    if (!rating) return toast(t('ratingRequired'), 'error');
    e.target.disabled = true;
    try {
      await api.saveReview(s.id, state.user, { rating, text: $('#rv-text').value.trim().slice(0, 500) });
      state.draftRating = 0;
      toast(t('reviewSaved'));
    } catch (err) {
      toast(errorText(err), 'error');
      e.target.disabled = false;
    }
  });
  $('#rv-del')?.addEventListener('click', async () => {
    if (!confirm(t('confirmDelete', { x: t('yourReview') }))) return;
    try {
      await api.deleteReview(s.id, state.user.uid);
      state.draftRating = 0;
      toast(t('reviewDeleted'));
    } catch (err) { toast(errorText(err), 'error'); }
  });
}

// ---------------------------------------------------------------------------
// 3D floor plan
// ---------------------------------------------------------------------------
function disposePlan() {
  plan?.dispose();
  plan = null;
}

let planLoading = false;
async function renderMap(selectedId) {
  const page = $('#page');
  if (!plan || !$('#fp')) {
    if (planLoading) return;
    disposePlan();
    planLoading = true;
    page.innerHTML = `<div class="fp-wrap" id="fp"><div class="fp-hint" id="fp-hint">👆 ${t('tapStall')}</div>
      <div class="fp-card hidden" id="fp-card"></div></div>`;
    let createFloorPlan;
    try {
      ({ createFloorPlan } = await import('./floorplan.js'));
    } finally {
      planLoading = false;
    }
    if (!$('#fp') || route().page !== 'map') return;
    selectedId = route().id;
    plan = createFloorPlan($('#fp'), {
      onSelect: (sel) => {
        const id = sel?.kind === 'store' ? sel.id : null;
        const want = id ? `#/map/${encodeURIComponent(id)}` : '#/map';
        if (location.hash !== want) history.replaceState(null, '', want);
        showMapCard(id);
      },
    });
    if (!plan) return;
  }
  const now = nowLocal();
  plan.setData({
    cols: state.centre.floor?.cols,
    rows: state.centre.floor?.rows,
    extras: state.centre.floor?.extras || [],
    stores: state.stores.map((s) => ({
      id: s.id, number: s.number, block: s.block,
      label: pick(s), sublabel: pickAlt(s),
      color: categoryOf(s).color,
      dim: !storeStatus(s, state.centre, now).open,
    })),
  });
  if (selectedId) plan.select(`store:${selectedId}`);
  showMapCard(selectedId);
}

function showMapCard(id) {
  const card = $('#fp-card');
  if (!card) return;
  const s = id && state.stores.find((x) => x.id === id);
  $('#fp-hint')?.classList.toggle('hidden', !!s);
  card.classList.toggle('hidden', !s);
  if (!s) return;
  const st = storeStatus(s, state.centre);
  card.innerHTML = `<div class="card">
    <span class="badge-num">${esc(s.number ?? '')}</span>
    <div style="flex:1;min-width:0"><b>${esc(pick(s))}</b>
      <div class="row small">${statusPill(st)} <span class="muted">${esc(st.detail)}</span></div></div>
    <a class="btn primary small" href="#/store/${encodeURIComponent(s.id)}">${t('viewMenu')}</a>
  </div>`;
}
