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
const GOOGLE_MAPS_URL = 'https://www.google.com/maps?q=Restaurant+Kim+Seng,+Seksyen+17,+46400+Petaling+Jaya,+Selangor,+Malaysia&ftid=0x31cc495d298b9beb:0xfe6a13c3cd6df28d';
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
      <header class="kopitiam-header">
        <div class="signboard">
          <a class="frame" href="#/" aria-label="${esc(c.name || t('centreName'))}">
            <div class="zh">${esc(c.nameZh || '金城茶餐室')}</div>
            <div class="en">${esc(c.name || 'RESTORAN KIM SENG')}</div>
          </a>
        </div>
        <div class="tiles" aria-hidden="true"></div>
        <div class="customer-subbar">
          <div class="wrap customer-subbar-inner">
            <nav class="header-nav" aria-label="Main navigation">
              <a href="#/" class="${r.page !== 'map' ? 'active' : ''}">${ICONS.bowl}<span>${t('navStalls')}</span></a>
              <a href="#/map" class="${r.page === 'map' ? 'active' : ''}">${ICONS.pin}<span>${t('navMap')}</span></a>
            </nav>
            <div class="header-status-slot" id="header-status-slot"></div>
            <div class="header-language">${langSwitcher()}</div>
          </div>
        </div>
      </header>
      <main class="wrap page" id="page"></main>
      <nav class="bottom-nav" aria-label="Mobile navigation">
        <a href="#/" class="${r.page !== 'map' ? 'active' : ''}">${ICONS.bowl}<span>${t('navStalls')}</span></a>
        <a href="#/map" class="${r.page === 'map' ? 'active' : ''}">${ICONS.pin}<span>${t('navMap')}</span></a>
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
    page.innerHTML = `<div class="stack discovery-page">
      ${state.centre.announcement ? `
        <div class="notice announcement-card">
          <div class="notice-badge">${t('notice')}</div>
          <div class="notice-content">${esc(state.centre.announcement)}</div>
        </div>` : ''}

      <section class="centre-hero-card">
        <div class="centre-hero-body">
          <div class="centre-hero-status" id="shop-status"></div>
          <div class="centre-hero-actions">
            <a class="btn hero-map-link" href="${esc(GOOGLE_MAPS_URL)}">
              ${ICONS.pin}<span>${t('googleMaps')}</span>
            </a>
          </div>
        </div>
      </section>

      <div class="discovery-tools">
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="q" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" value="${esc(state.query)}">
          <button type="button" class="search-clear ${state.query ? '' : 'hidden'}" id="q-clear" aria-label="Clear search">✕</button>
        </div>
        <div class="filter-row" role="group" aria-label="${t('allStalls')}">
          <button type="button" class="btn sm filter-btn ${state.openOnly ? '' : 'on'}" data-filter="all">
            <span>${t('allStalls')}</span>
          </button>
          <button type="button" class="btn sm filter-btn ${state.openOnly ? 'on' : ''}" data-filter="open">
            <span class="live-dot"></span><span>${t('openOnly')}</span>
          </button>
        </div>
      </div>

      <div class="section-heading">
        <div class="heading-title-group">
          <h2>${t('allStalls')}</h2>
          <span class="stall-badge-count" id="stall-count"></span>
        </div>
      </div>
      <div class="stall-list" id="stall-list"></div>
    </div>`;
    $('#q').oninput = (e) => {
      state.query = e.target.value;
      renderList();
      const clearBtn = $('#q-clear');
      if (clearBtn) clearBtn.classList.toggle('hidden', !state.query);
    };
    if ($('#q-clear')) {
      $('#q-clear').onclick = () => {
        state.query = '';
        $('#q').value = '';
        $('#q-clear').classList.add('hidden');
        $('#q').focus();
        renderList();
      };
    }
    page.querySelectorAll('[data-filter]').forEach((b) => {
      b.onclick = () => {
        state.openOnly = b.dataset.filter === 'open';
        page.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('on', x === b));
        renderList();
      };
    });
  }
  $('#shop-status').innerHTML = statusBox(cs, cs.open ? t('shopOpen') : t('shopClosed'));
  const headerStatus = $('#header-status-slot');
  if (headerStatus) {
    headerStatus.innerHTML = `<span class="pill ${cs.open ? 'open' : 'closed'}"><span class="live-dot"></span>${cs.open ? t('open') : t('closed')}${cs.detail ? `<span class="detail-time"> · ${cs.detail}</span>` : ''}</span>`;
  }
  renderList();
}

function renderList() {
  const now = nowLocal();
  const q = state.query.trim().toLowerCase();
  const rows = state.stores
    .map((s) => ({ s, st: storeStatus(s, state.centre, now) }))
    .filter(({ s, st }) => (!state.openOnly || st.open) && (!q
      || [s.name, s.nameZh, t(`cat_${s.category}`), String(s.number)].some((v) => String(v || '').toLowerCase().includes(q))));
  $('#stall-count').textContent = `${rows.length} ${t('navStalls')}`;
  $('#stall-list').innerHTML = rows.map(({ s, st }) => `
    <a class="stall-row ${st.open ? '' : 'off'}" href="#/store/${encodeURIComponent(s.id)}" aria-label="${esc(pick(s))}">
      <div class="stall-thumb-wrap">
        ${pic(s.photo || storeArt(s), 'stall-thumb-img')}
        <span class="plate ${st.open ? '' : 'off'}">${esc(s.number ?? '')}</span>
      </div>
      <div class="info">
        <div class="stall-names">
          <span class="name">${esc(pick(s))}</span>
          ${pickAlt(s) ? `<span class="alt">${esc(pickAlt(s))}</span>` : ''}
        </div>
        <div class="stall-meta">
          ${s.category ? `<span class="stall-cat-tag">${esc(t(`cat_${s.category}`) || s.category)}</span>` : ''}
          ${statusPill(st)}
        </div>
      </div>
      <span class="chev">${ICONS.chev}</span>
    </a>`).join('') || `<div class="empty-state"><p class="muted">${t('notFound')}</p></div>`;
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
    page.innerHTML = `<div class="stack store-page"><p>${t('notFound')}</p><a class="btn" href="#/">${ICONS.back}<span>${t('backToStalls')}</span></a></div>`;
    return;
  }
  const draftText = $('#rv-text')?.value;
  const st = storeStatus(s, state.centre);
  page.innerHTML = `<div class="stack store-page">
    <div class="store-nav-header">
      <a class="back-link" href="#/">${ICONS.back}<span>${t('backToStalls')}</span></a>
    </div>

    <section class="store-overview ${s.photo ? 'has-photo' : ''}">
      ${s.photo ? `<div class="store-hero-media">${pic(s.photo, 'hero')}</div>` : ''}
      <div class="store-overview-content">
        <div class="stall-head">
          <span class="plate big ${st.open ? '' : 'off'}">${esc(s.number ?? '')}</span>
          <div class="store-hero-titles">
            <h1 class="name">${esc(pick(s))}</h1>
            ${pickAlt(s) ? `<div class="alt">${esc(pickAlt(s))}</div>` : ''}
            ${s.category ? `<span class="stall-cat-tag">${esc(t(`cat_${s.category}`) || s.category)}</span>` : ''}
          </div>
        </div>

        <div class="store-status-wrapper">
          ${statusBox(st)}
        </div>

        ${pick(s, 'description') ? `<p class="store-desc">${esc(pick(s, 'description'))}</p>` : ''}

        <div class="grid2 store-actions">
          <a class="btn" href="#/map/${encodeURIComponent(s.id)}" style="${s.phone ? '' : 'grid-column:1/-1'}">${ICONS.pin}<span>${t('whereIsIt')}</span></a>
          ${s.phone ? `<a class="btn" href="tel:${esc(s.phone)}">${ICONS.phone}<span>${t('callStall')}</span></a>` : ''}
        </div>
      </div>
    </section>

    <div class="store-quick-anchors" role="navigation" aria-label="Quick jump">
      <a href="#store-menu" class="anchor-pill">${ICONS.bowl}<span>${t('menu')}</span></a>
      ${hoursTable(s.hours) ? `<a href="#store-hours" class="anchor-pill">${ICONS.clock}<span>${t('openingHours')}</span></a>` : ''}
      <a href="#store-reviews" class="anchor-pill">${ICONS.star}<span>${t('reviews')}</span></a>
    </div>

    <div class="store-content-blocks">
      <div id="store-menu" class="store-block">
        ${s.type === 'mixedRice' ? mixedRiceHtml(s) : menuHtml()}
      </div>

      ${hoursTable(s.hours) ? `
      <div id="store-hours" class="store-block">
        <details class="fold" open>
          <summary>${ICONS.clock}<span>${t('openingHours')}</span></summary>
          <div><table class="hours">${hoursTable(s.hours)}</table></div>
        </details>
      </div>` : ''}

      <div id="store-reviews" class="store-block">
        ${reviewsHtml()}
      </div>
    </div>
  </div>`;
  if (draftText != null && $('#rv-text')) $('#rv-text').value = draftText;
  bindReviews(s);
}

function dishHtml(it) {
  const sold = it.available === false;
  return `<div class="dish ${sold ? 'sold' : ''}">
    <div class="dish-media">
      ${pic(it.photo || art('dish'))}
      ${sold ? `<span class="tag-sold">${t('soldOut')}</span>` : ''}
    </div>
    <div class="info">
      <div class="dish-top-line">
        <span class="fname">${esc(pick(it))}</span>
        ${it.price != null && it.price !== '' ? `<span class="price">${fmtPrice(it.price)}</span>` : ''}
      </div>
      ${pickAlt(it) ? `<div class="muted">${esc(pickAlt(it))}</div>` : ''}
      ${it.description ? `<div class="desc">${esc(it.description)}</div>` : ''}
    </div>
  </div>`;
}

function menuHtml() {
  if (!state.items) return `<div class="loading-state"><p class="muted">${t('loading')}</p></div>`;
  if (!state.items.length) {
    return `<div class="empty-state card" style="text-align:center;padding:36px 16px;background:var(--marble);border-radius:var(--radius);border:1px solid var(--line);">
      <div style="font-size:2.2rem;margin-bottom:8px">🍜</div>
      <p style="margin:0 0 6px;font-weight:700;font-size:1.05rem;color:var(--ink)">${t('noFoodYet')}</p>
      <p class="small muted" style="margin:0">${t('noFoodSub')}</p>
    </div>`;
  }
  const groups = new Map();
  for (const it of state.items) {
    const k = pick(it, 'section');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  return `<div class="section-title">${t('menu')}</div>` + [...groups].map(([sec, items]) =>
    `<div class="board">
      ${sec ? `<div class="board-header"><h3>${esc(sec)}</h3><span class="badge-count">${items.length}</span></div>` : ''}
      <div class="board-dishes">${items.map(dishHtml).join('')}</div>
    </div>`).join('');
}

function mixedRiceHtml(s) {
  const prices = s.mixedRice?.prices || [];
  const items = state.items || [];
  if (!prices.length && !items.length) {
    return `<div class="empty-state card" style="text-align:center;padding:36px 16px;background:var(--marble);border-radius:var(--radius);border:1px solid var(--line);">
      <div style="font-size:2.2rem;margin-bottom:8px">🍛</div>
      <p style="margin:0 0 6px;font-weight:700;font-size:1.05rem;color:var(--ink)">${t('noFoodYet')}</p>
      <p class="small muted" style="margin:0">${t('noFoodSub')}</p>
    </div>`;
  }
  return `
    ${prices.length ? `<div class="board red">
      <div class="board-header"><h3>${t('priceGuide')}</h3></div>
      <div class="guide-list">
        ${prices.map((p) => `<div class="guide-row">
          <span>${esc(pick(p, 'label'))}${pickAlt(p, 'label') ? ` <span class="muted">${esc(pickAlt(p, 'label'))}</span>` : ''}</span>
          <span class="price">${fmtPrice(p.price)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}
    ${s.mixedRice?.note ? `<p class="muted mixed-note">${esc(s.mixedRice.note)}</p>` : ''}
    <div class="section-title">${t('dishesUsually')}</div>
    <div class="notice mixed-rice-notice">${t('mixedRiceNote')}</div>
    <div class="mixed-rice-sections">
      ${KINDS.map((k) => {
        const list = items.filter((it) => (it.kind || 'other') === k);
        return list.length ? `<div class="board">
          <div class="board-header"><h3>${t(`kind_${k}`)}</h3><span class="badge-count">${list.length}</span></div>
          <div class="dish-grid">${list.map((it) => `
            <div class="dish-card ${it.available === false ? 'sold' : ''}">
              <div class="dish-card-media">
                ${pic(it.photo || art('dish'))}
                ${it.available === false ? `<span class="tag-sold">${t('soldOut')}</span>` : ''}
              </div>
              <div class="dish-card-caption">
                <b>${esc(pick(it))}</b>
                ${pickAlt(it) ? `<span class="alt">${esc(pickAlt(it))}</span>` : ''}
              </div>
            </div>`).join('')}</div>
        </div>` : '';
      }).join('')}
    </div>`;
}

function reviewsHtml() {
  const reviews = state.reviews || [];
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const mine = state.user && reviews.find((r) => r.id === state.user.uid);
  const rating = state.draftRating || mine?.rating || 0;
  const form = state.user
    ? `<div class="card stack review-form-card">
        <b>${mine ? t('yourReview') : t('writeReview')}</b>
        <div class="star-input" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) =>
          `<button type="button" data-star="${n}" class="${n <= rating ? 'on' : ''}" aria-label="${n}">★</button>`).join('')}</div>
        <textarea id="rv-text" maxlength="500" placeholder="Write your review here...">${esc(mine?.text || '')}</textarea>
        <button type="button" class="btn red" id="rv-save">${t('submit')}</button>
        <div class="grid2">
          ${mine ? `<button type="button" class="btn sm danger" id="rv-del">${t('deleteMyReview')}</button>` : '<span></span>'}
          <button type="button" class="btn sm" id="rv-out">${t('signOut')}</button>
        </div>
      </div>`
    : `<div class="review-signin-card"><button type="button" class="btn red block" id="rv-in">${t('writeReview')}</button></div>`;
  return `<div class="section-title">${t('reviews')}</div>
    <div class="card stack reviews-card">
      ${reviews.length ? `<div class="row reviews-score-summary">
        <span class="rating">${avg.toFixed(1)}</span>
        <div><span class="stars">${stars(avg)}</span><div class="small muted">${t('reviewsCount', { n: reviews.length })}</div></div>
      </div>` : ''}
      ${form}
      <div class="reviews-list">
        ${reviews.length ? reviews.map((r) => `<div class="review">
          <div class="row review-header">
            <b>${esc(r.name || '—')}</b>
            <span class="stars">${stars(r.rating)}</span>
            <span class="spacer"></span>
            <span class="small muted">${new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          ${r.text ? `<div class="review-text">${esc(r.text)}</div>` : ''}
        </div>`).join('') : `<p class="muted" style="margin:10px 0 0">${t('noReviews')}</p>`}
      </div>
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
    page.innerHTML = `<div class="stack map-page-layout">
      <div class="map-page-top">
        <h2 class="section-title" style="margin-top:0">${t('whereTitle')}</h2>
        <div class="legend">
          <span class="legend-item"><i style="background:#1b5e4a"></i>${t('legendOpen')}</span>
          <span class="legend-item"><i style="background:#a8a29e"></i>${t('legendClosed')}</span>
          <span class="legend-item"><i style="background:#cfc9bf"></i>${t('legendTables')}</span>
        </div>
      </div>
      <div class="fp-wrap" id="fp"></div>
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
      color: '#1b5e4a', dim: !storeStatus(s, state.centre, now).open,
    })),
  });
  if (selectedId) plan.select(`store:${selectedId}`);
  showMapCard(selectedId);
}

function showMapCard(id) {
  const box = $('#map-card');
  if (!box) return;
  const s = id && state.stores.find((x) => x.id === id);
  if (!s) { box.innerHTML = ''; return; }
  const st = storeStatus(s, state.centre);
  box.innerHTML = `<div class="card map-card">
    <span class="plate ${st.open ? '' : 'off'}">${esc(s.number ?? '')}</span>
    <div style="flex:1;min-width:0">
      <div class="map-card-name"><b>${esc(pick(s))}</b>${pickAlt(s) ? `<span class="muted"> ${esc(pickAlt(s))}</span>` : ''}</div>
      <div>${statusPill(st)}</div>
    </div>
    <a class="btn red" href="#/store/${encodeURIComponent(s.id)}">${t('menu')}</a>
  </div>`;
}
