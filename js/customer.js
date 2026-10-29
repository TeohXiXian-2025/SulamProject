// Customer website: stall list, one stall (menu + reviews) and the floor plan.
// No staff links here — staff use their own address (staff.html).
import { getApi, errorText } from './api.js';
import { t, pick, pickAlt, langSwitcher, bindLangSwitcher } from './i18n.js';
import { centreStatus, storeStatus, statusPill, statusBox, hoursTable, nowLocal } from './status.js';
import { $, esc, fmtPrice, toast, stars, pic, ICONS } from './util.js';
import { art, storeArt } from './art.js';
import { KINDS } from './forms.js';

const api = await getApi();
const app = $('#app');
document.body.classList.add('customer');

const state = {
  centre: null, stores: null, user: null, openOnly: false, query: '',
  storeId: null, items: null, reviews: null, draftRating: 0,
};
let unsubStore = [];
let plan = null;
let planLoading = false;

api.watchCentre((c) => { state.centre = c; render(); });
api.watchStores((s) => { state.stores = s; render(); });
api.onAuth((u) => { state.user = u; if (route().page === 'store') renderPage(); });
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(true); });
window.addEventListener('langchange', () => render(true));
setInterval(() => render(), 60_000); // opening status depends on the clock

function route() {
  const [page, id] = location.hash.replace(/^#\/?/, '').split('/');
  if (page === 'store' && id) return { page: 'store', id: decodeURIComponent(id) };
  if (page === 'map') return { page: 'map', id: id ? decodeURIComponent(id) : null };
  return { page: 'home' };
}

let shellKey = '';
function render(force = false) {
  if (!state.centre || !state.stores) return;
  const r = route();
  const key = [r.page, document.documentElement.lang, state.centre.name, state.centre.nameZh].join('|');
  if (force || key !== shellKey || !$('#page')) {
    if (r.page !== 'map') disposePlan();
    shellKey = key;
    const c = state.centre;
    document.title = [c.nameZh, c.name].filter(Boolean).join(' · ') || t('centreName');
    app.innerHTML = `
      <header class="signboard ${r.page === 'home' ? '' : 'slim'}"><div class="frame">
        <div class="zh">${esc(c.nameZh || c.name || t('centreName'))}</div>
        ${r.page === 'home' && c.nameZh && c.name ? `<div class="en">${esc(c.name)}</div>` : ''}
      </div></header>
      <div class="tiles"></div>
      ${api.mode === 'demo' ? `<div class="banner demo">${t('demoBanner')}</div>` : ''}
      ${r.page === 'home' ? `<div class="lang-row">${langSwitcher()}</div>` : ''}
      <main class="wrap page" id="page"></main>
      <nav class="bottom-nav">
        <a href="#/" class="${r.page !== 'map' ? 'active' : ''}">${ICONS.bowl}${t('navStalls')}</a>
        <a href="#/map" class="${r.page === 'map' ? 'active' : ''}">${ICONS.pin}${t('navMap')}</a>
      </nav>`;
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
// Home: all stalls
// ---------------------------------------------------------------------------
function renderHome(force) {
  const page = $('#page');
  const cs = centreStatus(state.centre);
  if (force || !$('#stall-list')) {
    page.innerHTML = `<div class="stack">
      <div id="shop-status"></div>
      ${state.centre.announcement ? `<div class="notice"><b>${t('notice')}:</b> ${esc(state.centre.announcement)}</div>` : ''}
      <div class="grid2">
        <button type="button" class="btn ${state.openOnly ? '' : 'on'}" data-filter="all">${t('allStalls')}</button>
        <button type="button" class="btn ${state.openOnly ? 'on' : ''}" data-filter="open">${t('openOnly')}</button>
      </div>
      <input type="search" id="q" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" value="${esc(state.query)}">
      <div class="section-title">${t('allStalls')}</div>
      <div class="stall-list" id="stall-list"></div>
    </div>`;
    $('#q').oninput = (e) => { state.query = e.target.value; renderList(); };
    page.querySelectorAll('[data-filter]').forEach((b) => {
      b.onclick = () => {
        state.openOnly = b.dataset.filter === 'open';
        page.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('on', x === b));
        renderList();
      };
    });
  }
  $('#shop-status').innerHTML = statusBox(cs, cs.open ? t('shopOpen') : t('shopClosed'));
  renderList();
}

function renderList() {
  const now = nowLocal();
  const q = state.query.trim().toLowerCase();
  const rows = state.stores
    .map((s) => ({ s, st: storeStatus(s, state.centre, now) }))
    .filter(({ s, st }) => (!state.openOnly || st.open) && (!q
      || [s.name, s.nameZh, t(`cat_${s.category}`), String(s.number)].some((v) => String(v || '').toLowerCase().includes(q))));
  $('#stall-list').innerHTML = rows.map(({ s, st }) => `
    <a class="stall-row ${st.open ? '' : 'off'}" href="#/store/${encodeURIComponent(s.id)}">
      <span class="plate ${st.open ? '' : 'off'}">${esc(s.number ?? '')}</span>
      ${pic(s.photo || storeArt(s))}
      <span class="info">
        <span class="name" style="display:block">${esc(pick(s))}</span>
        ${pickAlt(s) ? `<span class="alt" style="display:block">${esc(pickAlt(s))}</span>` : ''}
        ${statusPill(st)}
      </span>
      <span class="chev">${ICONS.chev}</span>
    </a>`).join('') || `<p class="muted">—</p>`;
}

// ---------------------------------------------------------------------------
// One stall
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
    page.innerHTML = `<div class="stack"><p>${t('notFound')}</p><a class="btn" href="#/">${ICONS.back}${t('backToStalls')}</a></div>`;
    return;
  }
  const draftText = $('#rv-text')?.value;
  const st = storeStatus(s, state.centre);
  page.innerHTML = `<div class="stack">
    <a class="btn" href="#/">${ICONS.back}${t('backToStalls')}</a>
    <div class="stall-head">
      <span class="plate big">${esc(s.number ?? '')}</span>
      <div style="min-width:0">
        <div class="name">${esc(pick(s))}</div>
        ${pickAlt(s) ? `<div class="alt">${esc(pickAlt(s))}</div>` : ''}
      </div>
    </div>
    ${s.photo ? pic(s.photo, 'hero') : ''}
    ${statusBox(st)}
    <div class="grid2">
      <a class="btn" href="#/map/${encodeURIComponent(s.id)}" style="${s.phone ? '' : 'grid-column:1/-1'}">${ICONS.pin}${t('whereIsIt')}</a>
      ${s.phone ? `<a class="btn" href="tel:${esc(s.phone)}">${ICONS.phone}${t('callStall')}</a>` : ''}
    </div>
    ${pick(s, 'description') ? `<p style="margin:0">${esc(pick(s, 'description'))}</p>` : ''}
    ${s.type === 'mixedRice' ? mixedRiceHtml(s) : menuHtml()}
    ${hoursTable(s.hours) ? `<details class="fold"><summary>${t('openingHours')}</summary>
      <div><table class="hours">${hoursTable(s.hours)}</table></div></details>` : ''}
    ${reviewsHtml()}
  </div>`;
  if (draftText != null && $('#rv-text')) $('#rv-text').value = draftText;
  bindReviews(s);
}

function dishHtml(it) {
  const sold = it.available === false;
  return `<div class="dish ${sold ? 'sold' : ''}">
    ${pic(it.photo || art('dish'))}
    <div class="info">
      <div class="fname">${esc(pick(it))}</div>
      ${pickAlt(it) ? `<div class="muted">${esc(pickAlt(it))}</div>` : ''}
      ${it.description ? `<div class="desc">${esc(it.description)}</div>` : ''}
      ${sold ? `<span class="tag-sold">${t('soldOut')}</span>` : ''}
    </div>
    ${it.price != null && it.price !== '' ? `<div class="price">${fmtPrice(it.price)}</div>` : ''}
  </div>`;
}

function menuHtml() {
  if (!state.items) return `<p class="muted">${t('loading')}</p>`;
  if (!state.items.length) return '';
  const groups = new Map();
  for (const it of state.items) {
    const k = pick(it, 'section');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  return `<div class="section-title">${t('menu')}</div>` + [...groups].map(([sec, items]) =>
    `<div class="board">${sec ? `<h3>${esc(sec)}</h3>` : ''}${items.map(dishHtml).join('')}</div>`).join('');
}

function mixedRiceHtml(s) {
  const prices = s.mixedRice?.prices || [];
  const items = state.items || [];
  return `
    ${prices.length ? `<div class="board red"><h3>${t('priceGuide')}</h3>
      ${prices.map((p) => `<div class="guide-row"><span>${esc(pick(p, 'label'))}${pickAlt(p, 'label') ? ` <span class="muted">${esc(pickAlt(p, 'label'))}</span>` : ''}</span>
        <span class="price">${fmtPrice(p.price)}</span></div>`).join('')}</div>` : ''}
    ${s.mixedRice?.note ? `<p class="muted" style="margin:0">${esc(s.mixedRice.note)}</p>` : ''}
    <div class="section-title">${t('dishesUsually')}</div>
    <div class="notice">${t('mixedRiceNote')}</div>
    ${KINDS.map((k) => {
      const list = items.filter((it) => (it.kind || 'other') === k);
      return list.length ? `<div class="board"><h3>${t(`kind_${k}`)}</h3><div class="dish-grid">${list.map((it) => `
        <div class="dish-card ${it.available === false ? 'sold' : ''}">${pic(it.photo || art('dish'))}
          <b>${esc(pick(it))}${pickAlt(it) ? `<br><span class="alt">${esc(pickAlt(it))}</span>` : ''}</b>
          ${it.available === false ? `<span class="tag-sold">${t('soldOut')}</span>` : ''}</div>`).join('')}</div></div>` : '';
    }).join('')}`;
}

function reviewsHtml() {
  const reviews = state.reviews || [];
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const mine = state.user && reviews.find((r) => r.id === state.user.uid);
  const rating = state.draftRating || mine?.rating || 0;
  const form = state.user
    ? `<div class="card stack">
        <b>${mine ? t('yourReview') : t('writeReview')}</b>
        <div class="star-input" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) =>
          `<button type="button" data-star="${n}" class="${n <= rating ? 'on' : ''}" aria-label="${n}">★</button>`).join('')}</div>
        <textarea id="rv-text" maxlength="500">${esc(mine?.text || '')}</textarea>
        <button type="button" class="btn red" id="rv-save">${t('submit')}</button>
        <div class="grid2">
          ${mine ? `<button type="button" class="btn sm danger" id="rv-del">${t('deleteMyReview')}</button>` : '<span></span>'}
          <button type="button" class="btn sm" id="rv-out">${t('signOut')}</button>
        </div>
      </div>`
    : `<button type="button" class="btn red block" id="rv-in">${t('writeReview')}</button>`;
  return `<div class="section-title">${t('reviews')}</div>
    <div class="card stack">
      ${reviews.length ? `<div class="row"><span class="rating">${avg.toFixed(1)}</span>
        <span><span class="stars">${stars(avg)}</span><br><span class="small muted">${t('reviewsCount', { n: reviews.length })}</span></span></div>` : ''}
      ${form}
      ${reviews.length ? reviews.map((r) => `<div class="review">
        <div class="row"><b>${esc(r.name || '—')}</b><span class="stars">${stars(r.rating)}</span>
          <span class="spacer"></span><span class="small muted">${new Date(r.createdAt).toLocaleDateString()}</span></div>
        ${r.text ? `<div>${esc(r.text)}</div>` : ''}</div>`).join('') : `<p class="muted" style="margin:0">${t('noReviews')}</p>`}
    </div>`;
}

function bindReviews(s) {
  $('#rv-in')?.addEventListener('click', (e) => {
    e.currentTarget.textContent = t('signInToReview');
    api.signInGoogle().catch((err) => toast(errorText(err), 'error'));
  });
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
    if (!rating) { toast(t('ratingRequired'), 'error'); return; }
    e.currentTarget.disabled = true;
    try {
      await api.saveReview(s.id, state.user, { rating, text: $('#rv-text').value.trim().slice(0, 500) });
      state.draftRating = 0;
      toast(t('reviewSaved'));
    } catch (err) {
      toast(errorText(err), 'error');
      e.currentTarget.disabled = false;
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
// Floor plan
// ---------------------------------------------------------------------------
function disposePlan() {
  plan?.dispose();
  plan = null;
}

async function renderMap(selectedId) {
  const page = $('#page');
  if (!plan || !$('#fp')) {
    if (planLoading) return;
    disposePlan();
    planLoading = true;
    page.innerHTML = `<div class="stack">
      <div class="section-title">${t('whereTitle')}</div>
      <div class="legend"><span><i style="background:#2B6B4E"></i>${t('legendOpen')}</span>
        <span><i style="background:#A8A29E"></i>${t('legendClosed')}</span>
        <span><i style="background:#B08968"></i>${t('legendTables')}</span></div>
      <div class="fp-wrap" id="fp"><div class="fp-hint" id="fp-hint">${t('tapStall')}</div></div>
      <div id="map-card"></div>
    </div>`;
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
      id: s.id, number: s.number, block: s.block, label: pick(s), sublabel: pickAlt(s),
      color: '#2B6B4E', dim: !storeStatus(s, state.centre, now).open,
    })),
  });
  if (selectedId) plan.select(`store:${selectedId}`);
  showMapCard(selectedId);
}

function showMapCard(id) {
  const box = $('#map-card');
  if (!box) return;
  const s = id && state.stores.find((x) => x.id === id);
  $('#fp-hint')?.classList.toggle('hidden', !!s);
  if (!s) { box.innerHTML = ''; return; }
  const st = storeStatus(s, state.centre);
  box.innerHTML = `<div class="card map-card">
    <span class="plate">${esc(s.number ?? '')}</span>
    <div style="flex:1;min-width:0"><b style="font-size:1.1rem">${esc(pick(s))}</b>
      ${pickAlt(s) ? `<span class="muted"> ${esc(pickAlt(s))}</span>` : ''}<div>${statusPill(st)}</div></div>
    <a class="btn red" href="#/store/${encodeURIComponent(s.id)}">${t('menu')}</a>
  </div>`;
}
