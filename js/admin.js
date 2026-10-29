// Hawker centre admin: centre status, stalls, floor plan editor, QR codes, admins.
import { getApi, errorText } from './api.js';
import { t, pick, langSwitcher, bindLangSwitcher } from './i18n.js';
import { centreStatus } from './status.js';
import { $, esc, toast, categoryOf, CATEGORIES, photoOrEmoji } from './util.js';
import { STARTER_STORES, DEFAULT_CENTRE } from './seed.js';
import { saving, statusControlHtml, bindStatusControl, hoursEditorHtml, bindHoursEditor, openDialog } from './forms.js';
import { createFloorPlan, findFreeSpot, EXTRA_TYPES } from './floorplan.js';

const api = await getApi();
const app = $('#app');

const state = {
  user: undefined, admins: undefined, centre: null, stores: null,
  tab: 'stalls', qrMode: 'poster', tableCount: 12, siteUrl: new URL('./', location.href).href,
};
let plan = null;
let planDirty = false;
let unsubs = [];

window.addEventListener('langchange', () => render(true));
window.addEventListener('beforeunload', (e) => { if (planDirty) e.preventDefault(); });

api.onAuth(async (u) => {
  state.user = u;
  state.admins = undefined;
  unsubs.forEach((f) => f());
  unsubs = [];
  if (u) {
    state.admins = await api.getAdmins().catch(() => null);
    if (isAdmin()) {
      unsubs.push(api.watchCentre((c) => { state.centre = c; render(); }));
      unsubs.push(api.watchStores((s) => { state.stores = s; render(); }));
    }
  }
  render(true);
});

const isAdmin = () => !!state.user && !!state.admins?.includes(state.user.email);

function header() {
  return `<header class="topbar"><div class="wrap">
    <a class="brand" href="index.html"><b>🛠️ ${t('adminTitle')}</b><span>${esc(pick(state.centre) || t('centreName'))}</span></a>
    <span class="spacer"></span>${langSwitcher()}
    ${state.user ? `<button class="btn small" id="out" style="background:transparent;color:inherit;border-color:rgb(255 255 255 / .5)">${t('signOut')}</button>` : ''}
  </div></header>
  ${api.mode === 'demo' ? `<div class="banner demo">${t('demoBanner')}</div>` : ''}`;
}

function bindHeader() {
  bindLangSwitcher(app);
  $('#out')?.addEventListener('click', () => {
    if (planDirty && !confirm(t('unsaved'))) return;
    planDirty = false;
    api.signOut();
  });
}

function render(force = false) {
  if (state.user === undefined) return;
  if (!state.user) return renderLogin();
  if (state.admins === undefined) return;
  if (state.admins === null) return renderClaim();
  if (!isAdmin()) return renderNotAdmin();
  if (!state.centre || !state.stores) return;

  // Do not wipe a form or the floor plan editor while it is being used.
  const active = document.activeElement;
  if (!force && active?.matches?.('input, textarea, select') && app.contains(active)) return;
  if (!force && state.tab === 'floor' && plan) { refreshPlan(); return; }

  const tabs = { stalls: t('stalls'), floor: t('floorPlan'), centre: t('centre'), qr: t('qrCodes'), admins: t('admins') };
  disposePlan();
  app.innerHTML = `${header()}
    <nav class="tabs"><div class="wrap">${Object.entries(tabs).map(([k, v]) =>
      `<button class="tab ${state.tab === k ? 'active' : ''}" data-tab="${k}">${v}</button>`).join('')}</div></nav>
    <main class="wrap section" id="tab-body"></main>`;
  bindHeader();
  app.querySelectorAll('[data-tab]').forEach((b) => {
    b.onclick = () => {
      if (state.tab === 'floor' && planDirty && !confirm(t('unsaved'))) return;
      planDirty = false;
      state.tab = b.dataset.tab;
      render(true);
    };
  });
  const body = $('#tab-body');
  ({ stalls: renderStalls, floor: renderFloor, centre: renderCentre, qr: renderQr, admins: renderAdmins })[state.tab](body);
}

// --- Sign-in states ------------------------------------------------------------
function renderLogin() {
  app.innerHTML = `${header()}<main class="wrap"><div class="card login-box stack">
      <h1>${t('adminTitle')}</h1>
      <button class="btn primary block" id="google">G ${t('signInGoogle')}</button>
      <details><summary class="small muted">${t('email')} / ${t('password')}</summary>
        <form id="login" class="stack" style="margin-top:10px">
          <input type="email" name="email" required placeholder="${t('email')}" autocomplete="username">
          <input type="password" name="password" required placeholder="${t('password')}" autocomplete="current-password">
          <button class="btn block" type="submit">${t('signIn')}</button>
        </form></details>
      <a class="small" href="index.html">← ${t('back')}</a>
    </div></main>`;
  bindHeader();
  $('#google').onclick = () => api.signInGoogle().catch((e) => toast(errorText(e), 'error'));
  $('#login').onsubmit = (e) => {
    e.preventDefault();
    api.signInEmail(e.target.email.value, e.target.password.value).catch((err) => toast(errorText(err), 'error'));
  };
}

function renderClaim() {
  app.innerHTML = `${header()}<main class="wrap"><div class="card login-box stack">
    <h2>${t('claimAdminTitle')}</h2>
    <p>${t('claimAdminText', { x: `<b>${esc(state.user.email)}</b>` })}</p>
    <button class="btn primary" id="claim">${t('claimAdminBtn')}</button>
  </div></main>`;
  bindHeader();
  $('#claim').onclick = async (e) => {
    const ok = await saving(e.currentTarget, async () => {
      await api.claimAdmin(state.user.email);
      if (api.mode === 'firebase') await api.updateCentre(DEFAULT_CENTRE);
    });
    if (!ok) return;
    state.admins = [state.user.email];
    unsubs.push(api.watchCentre((c) => { state.centre = c; render(); }));
    unsubs.push(api.watchStores((s) => { state.stores = s; render(); }));
  };
}

function renderNotAdmin() {
  app.innerHTML = `${header()}<main class="wrap"><div class="card login-box stack">
    <p>${t('notAdmin', { x: `<b>${esc(state.user.email)}</b>` })}</p></div></main>`;
  bindHeader();
}

// --- Stalls ----------------------------------------------------------------------
function renderStalls(body) {
  const stores = state.stores;
  body.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <button class="btn primary" id="add">＋ ${t('addStall')}</button>
      ${!stores.length ? `<button class="btn" id="starter">⚡ ${t('starterStalls')}</button>` : ''}
    </div>
    <div class="list">${stores.map((s) => `
      <div class="list-item" data-store="${esc(s.id)}">
        ${photoOrEmoji(s.photo, categoryOf(s).emoji, 'thumb')}
        <div class="info">
          <div class="title"><span class="badge-num" style="min-width:26px;height:26px;font-size:.8rem">${esc(s.number)}</span>
            ${esc(pick(s))} ${s.type === 'mixedRice' ? '🍱' : ''}</div>
          <div class="small muted">${t(`cat_${s.category}`)} · ${s.ownerUid || s.ownerEmail ? `👤 ${esc(s.ownerEmail || s.ownerUid)}` : `⚠️ ${t('notLinked')}`}</div>
          <div class="row" style="margin-top:6px">
            <a class="btn small" href="owner.html?store=${encodeURIComponent(s.id)}">🍽️ ${t('menu')} / ${t('status')}</a>
            <button class="btn small" data-edit>${t('edit')}</button>
            <button class="btn small danger" data-del>${t('delete')}</button>
          </div>
        </div>
      </div>`).join('')}</div>`;
  $('#add').onclick = () => openStoreDialog(null);
  $('#starter')?.addEventListener('click', (e) => saving(e.currentTarget, async () => {
    for (const s of STARTER_STORES) await api.createStore(s);
  }, t('starterDone')));
  body.querySelectorAll('[data-store]').forEach((row) => {
    const s = stores.find((x) => x.id === row.dataset.store);
    $('[data-edit]', row).onclick = () => openStoreDialog(s);
    $('[data-del]', row).onclick = (e) => {
      if (confirm(t('confirmDelete', { x: `${s.number} · ${pick(s)}` }))) saving(e.currentTarget, () => api.deleteStore(s.id), t('deleted'));
    };
  });
}

const isGmail = (email) => /@(gmail|googlemail)\.com$/i.test(email || '');

function nextNumber() {
  const used = new Set(state.stores.map((s) => Number(s.number)));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

function openStoreDialog(s) {
  const isNew = !s;
  const d = s || { number: nextNumber(), category: 'other', type: 'normal' };
  const linked = !!(d.ownerUid || d.ownerEmail);
  openDialog(`
    <form class="stack" id="sf">
      <h2>${isNew ? t('addStall') : `${t('edit')} · ${esc(pick(d))}`}</h2>
      <div class="grid2">
        <label class="field"><span>${t('stallNumber')}</span><input type="number" name="number" min="1" required value="${esc(d.number)}"></label>
        <label class="field"><span>${t('category')}</span><select name="category">${Object.keys(CATEGORIES).map((c) =>
          `<option value="${c}" ${d.category === c ? 'selected' : ''}>${CATEGORIES[c].emoji} ${t(`cat_${c}`)}</option>`).join('')}</select></label>
        <label class="field"><span>${t('name')}</span><input type="text" name="name" required maxlength="60" value="${esc(d.name || '')}"></label>
        <label class="field"><span>${t('nameZh')}</span><input type="text" name="nameZh" maxlength="60" value="${esc(d.nameZh || '')}"></label>
      </div>
      <label class="check"><input type="checkbox" name="mixed" ${d.type === 'mixedRice' ? 'checked' : ''}> ${t('mixedRiceMode')}</label>
      <fieldset class="card stack" style="box-shadow:none">
        <legend><b>${t('ownerAccount')}</b></legend>
        <div id="owner-state" class="small row">${linked ? `✅ ${t('linkedTo', { x: esc(d.ownerEmail || d.ownerUid) })}
          <button type="button" class="btn small danger" id="unlink">${t('unlink')}</button>
          ${d.ownerEmail && !isGmail(d.ownerEmail) ? `<button type="button" class="btn small" id="resend">✉️ ${t('sendSetPw')}</button>` : ''}`
          : t('notLinked')}</div>
        <div id="owner-new" class="${linked ? 'hidden' : ''} stack">
          <input type="email" name="oemail" placeholder="${esc(t('ownerEmail'))}" autocomplete="off">
          <p class="small muted" style="margin:0">${t('ownerEmailHint')}</p>
          <details><summary class="small muted">${t('linkById')}</summary>
            <input type="text" name="ouid" placeholder="Account ID" style="margin-top:6px"></details>
        </div>
      </fieldset>
      <div class="row"><span class="spacer"></span>
        <button type="button" class="btn" data-close>${t('cancel')}</button>
        <button type="submit" class="btn primary">${t('save')}</button></div>
    </form>`, (dlg) => {
    let owner = { ownerUid: d.ownerUid || '', ownerEmail: d.ownerEmail || '' };
    $('#resend', dlg)?.addEventListener('click', (e) => saving(e.currentTarget, () => api.resetPassword(d.ownerEmail), t('setPwSent')));
    $('#unlink', dlg)?.addEventListener('click', () => {
      owner = { ownerUid: '', ownerEmail: '' };
      $('#owner-state', dlg).textContent = t('notLinked');
      $('#owner-new', dlg).classList.remove('hidden');
    });
    $('#sf', dlg).onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const number = Number(f.get('number'));
      if (state.stores.some((x) => x.id !== s?.id && Number(x.number) === number)) {
        toast(t('numberTaken', { n: number }), 'error');
        return;
      }
      const data = {
        number,
        name: f.get('name').trim(),
        nameZh: f.get('nameZh').trim(),
        category: f.get('category'),
        type: f.get('mixed') ? 'mixedRice' : 'normal',
      };
      let doneMsg = t('saved');
      const ok = await saving(e.submitter, async () => {
        const oemail = f.get('oemail').trim().toLowerCase();
        const ouid = f.get('ouid').trim();
        const isLinked = owner.ownerUid || owner.ownerEmail;
        if (!isLinked && ouid) owner = { ownerUid: ouid, ownerEmail: oemail };
        else if (!isLinked && oemail && isGmail(oemail)) {
          // Gmail: the owner just taps "Sign in with Google". No password.
          owner = { ownerUid: '', ownerEmail: oemail };
        } else if (!isLinked && oemail) {
          // Other email: create a login and email a link to choose a password.
          owner = { ownerUid: (await api.createOwnerAccount(oemail)) || '', ownerEmail: oemail };
          doneMsg = t('setPwSent');
        }
        Object.assign(data, owner);
        if (data.type === 'mixedRice' && !s?.mixedRice) data.mixedRice = { prices: [], note: '' };
        if (isNew) {
          const rects = [...state.stores.map((x) => x.block).filter(Boolean), ...(state.centre.floor?.extras || [])];
          Object.assign(data, {
            description: '', descriptionZh: '', phone: '', photo: '', override: null,
            hours: state.centre.hours || null,
            block: findFreeSpot(rects, state.centre.floor?.cols || 20, state.centre.floor?.rows || 12),
          });
          await api.createStore(data);
        } else {
          await api.updateStore(s.id, data);
        }
      }, null);
      if (ok) { toast(doneMsg); dlg.close(); }
    };
  });
}

// --- Floor plan editor -------------------------------------------------------------
function disposePlan() {
  plan?.dispose();
  plan = null;
}

function planData(layout) {
  const floor = layout || state.centre.floor || DEFAULT_CENTRE.floor;
  return {
    cols: floor.cols, rows: floor.rows, extras: floor.extras || [],
    stores: state.stores.map((s) => ({
      id: s.id, number: s.number, label: pick(s), color: categoryOf(s).color,
      block: layout?.blocks?.[s.id] || s.block,
    })),
  };
}

function refreshPlan() {
  // Live updates from the database: keep the admin's unsaved moves.
  const layout = planDirty ? plan.getLayout() : null;
  plan.setData(planData(layout));
}

function renderFloor(body) {
  const floor = state.centre.floor || DEFAULT_CENTRE.floor;
  body.innerHTML = `
    <p class="small muted">${t('editorHelp')}</p>
    <div class="fp-tools">
      ${Object.keys(EXTRA_TYPES).map((k) => `<button class="btn small" data-add="${k}">＋ ${t(k)}</button>`).join('')}
    </div>
    <div class="fp-wrap fp-editor" id="fp"></div>
    <div class="fp-tools" id="sel-tools">
      <span class="small muted" id="sel-label">—</span>
      <button class="btn small" data-act="rotate">⟳ ${t('rotate')}</button>
      <button class="btn small" data-act="w+">${t('wider')}</button>
      <button class="btn small" data-act="w-">${t('narrower')}</button>
      <button class="btn small" data-act="h+">${t('longer')}</button>
      <button class="btn small" data-act="h-">${t('shorter')}</button>
      <button class="btn small danger" data-act="del">${t('delete')}</button>
    </div>
    <div class="fp-tools">
      <button class="btn small" data-view="3d">${t('view3d')}</button>
      <button class="btn small" data-view="top">${t('topView')}</button>
      <span class="small muted">${t('gridSize')}:</span>
      <input type="number" id="g-cols" min="6" max="60" value="${floor.cols}" style="width:80px" aria-label="${t('columns')}"> ×
      <input type="number" id="g-rows" min="6" max="60" value="${floor.rows}" style="width:80px" aria-label="${t('rows')}">
      <button class="btn small" id="g-apply">✓</button>
      <button class="btn small" id="renumber">${t('renumber')}</button>
      <span class="spacer"></span>
      <span class="small" id="dirty" style="color:var(--closed)"></span>
      <button class="btn primary" id="save-plan">💾 ${t('saveLayout')}</button>
    </div>`;
  const markDirty = (v = true) => { planDirty = v; $('#dirty').textContent = v ? t('unsaved') : ''; };
  const selTools = $('#sel-tools');
  plan = createFloorPlan($('#fp'), {
    editable: true,
    onChange: () => markDirty(),
    onMessage: (m) => toast(m, 'error'),
    onSelect: (sel) => {
      selTools.querySelectorAll('button').forEach((b) => { b.disabled = !sel || (b.dataset.act === 'del' && sel.kind !== 'extra'); });
      if (!sel) { $('#sel-label').textContent = '—'; return; }
      const s = sel.kind === 'store' && state.stores.find((x) => x.id === sel.id);
      $('#sel-label').textContent = s ? `#${s.number} ${pick(s)}` : t(sel.type);
    },
  });
  if (!plan) return;
  selTools.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  plan.setData(planData(null));
  markDirty(false);

  body.querySelectorAll('[data-add]').forEach((b) => { b.onclick = () => plan.addExtra(b.dataset.add); });
  body.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => plan.setView(b.dataset.view); });
  selTools.querySelectorAll('[data-act]').forEach((b) => {
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
    layout.cols = cols;
    layout.rows = rows;
    layout.extras = layout.extras.map(fit);
    for (const k of Object.keys(layout.blocks)) layout.blocks[k] = fit(layout.blocks[k]);
    plan.setData(planData(layout));
    markDirty();
  };
  $('#renumber').onclick = (e) => {
    if (!confirm(`${t('renumber')}?`)) return;
    const patches = {};
    state.stores.forEach((s, i) => { if (s.number !== i + 1) patches[s.id] = { number: i + 1 }; });
    saving(e.currentTarget, () => api.updateStores(patches));
  };
  $('#save-plan').onclick = (e) => {
    const layout = plan.getLayout();
    saving(e.currentTarget, async () => {
      await api.updateCentre({ floor: { cols: layout.cols, rows: layout.rows, extras: layout.extras } });
      const patches = {};
      for (const s of state.stores) {
        const b = layout.blocks[s.id];
        if (b && JSON.stringify(b) !== JSON.stringify(s.block)) patches[s.id] = { block: b };
      }
      if (Object.keys(patches).length) await api.updateStores(patches);
      markDirty(false);
    }, t('layoutSaved'));
  };
}

// --- Centre ------------------------------------------------------------------------
function renderCentre(body) {
  const c = state.centre;
  body.innerHTML = `<div class="stack">
    <h2>${t('status')}</h2>
    ${statusControlHtml(centreStatus(c), c.override)}
    ${hoursEditorHtml(c.hours)}
    <form class="card stack" id="cinfo">
      <div class="grid2">
        <label class="field"><span>${t('name')}</span><input type="text" name="name" maxlength="80" value="${esc(c.name || '')}"></label>
        <label class="field"><span>${t('nameZh')}</span><input type="text" name="nameZh" maxlength="80" value="${esc(c.nameZh || '')}"></label>
      </div>
      <label class="field"><span>Address</span><input type="text" name="address" maxlength="200" value="${esc(c.address || '')}"></label>
      <label class="field"><span>${t('announcement')}</span><input type="text" name="announcement" maxlength="200" value="${esc(c.announcement || '')}"></label>
      <button class="btn primary" type="submit">${t('save')}</button>
    </form>
  </div>`;
  bindStatusControl(body, (override) => api.updateCentre({ override }));
  bindHoursEditor(body, (hours) => api.updateCentre({ hours }));
  $('#cinfo').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    saving(e.submitter, () => api.updateCentre(Object.fromEntries(['name', 'nameZh', 'address', 'announcement'].map((k) => [k, f.get(k).trim()]))));
  };
}

// --- QR codes ------------------------------------------------------------------------
function qrSvg(text) {
  /* global qrcode */
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}

function renderQr(body) {
  const modes = { poster: t('qrPoster'), tables: t('qrTables'), stores: t('qrStores') };
  body.innerHTML = `
    <div class="card stack">
      <label class="field"><span>${t('siteUrl')}</span><input type="url" id="qr-url" value="${esc(state.siteUrl)}"></label>
      <div class="row">${Object.entries(modes).map(([k, v]) => `<button class="btn small ${state.qrMode === k ? 'on' : ''}" data-qm="${k}">${v}</button>`).join('')}
        ${state.qrMode === 'tables' ? `<label class="row small">${t('tableCount')} <input type="number" id="qr-n" min="1" max="200" value="${state.tableCount}" style="width:90px"></label>` : ''}
        <span class="spacer"></span><button class="btn primary" id="qr-print">🖨️ ${t('print')}</button></div>
    </div>
    <div id="print-area" class="section"></div>`;
  const draw = () => {
    const url = state.siteUrl;
    const c = state.centre;
    const area = $('#print-area');
    if (state.qrMode === 'poster') {
      area.innerHTML = `<div class="qr-poster">
        <h2>${esc(c.name || 'Kim Seng Hawker Centre')}</h2>
        <div style="font-size:1.4rem">${esc(c.nameZh || '')}</div>
        ${qrSvg(url)}
        <div class="langs"><b>Scan for stalls, menus & opening status</b><br>扫码查看档口、菜单和营业状态<br>Imbas untuk gerai, menu & status buka</div>
        <p class="small" style="color:#78716c">${esc(url)}</p></div>`;
    } else if (state.qrMode === 'tables') {
      const svg = qrSvg(url);
      area.innerHTML = `<div class="qr-cards">${Array.from({ length: state.tableCount }, (_, i) => `
        <div class="qr-card"><b>${esc(c.name || '')}</b>${svg}
          <div class="small">Menu · 菜单 · Menu</div><div><b>${t('tableLabel', { n: i + 1 })}</b></div></div>`).join('')}</div>`;
    } else {
      area.innerHTML = `<div class="qr-cards">${state.stores.map((s) => `
        <div class="qr-card"><b>${esc(s.number)} · ${esc(s.name || '')}</b>${esc(s.nameZh || '')}
          ${qrSvg(`${url}#/store/${encodeURIComponent(s.id)}`)}<div class="small">Menu · 菜单 · Menu</div></div>`).join('')}</div>`;
    }
  };
  draw();
  $('#qr-url').onchange = (e) => { state.siteUrl = e.target.value.trim(); draw(); };
  $('#qr-n')?.addEventListener('change', (e) => { state.tableCount = Math.max(1, Math.min(200, Number(e.target.value) || 1)); draw(); });
  body.querySelectorAll('[data-qm]').forEach((b) => { b.onclick = () => { state.qrMode = b.dataset.qm; renderQr(body); }; });
  $('#qr-print').onclick = () => window.print();
}

// --- Admins ------------------------------------------------------------------------
function renderAdmins(body) {
  body.innerHTML = `<form class="card stack" id="adm">
      <label class="field"><span>${t('adminEmails')}</span>
        <textarea name="emails" rows="4">${esc(state.admins.join('\n'))}</textarea></label>
      <button class="btn primary" type="submit">${t('save')}</button>
    </form>
    ${api.mode === 'demo' ? `<p class="section"><button class="btn danger" id="reset-demo">Reset demo data</button></p>` : ''}`;
  $('#adm').onsubmit = (e) => {
    e.preventDefault();
    const emails = [...new Set(e.target.emails.value.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];
    if (!emails.includes(state.user.email) && !confirm(`${state.user.email} will lose admin access. Continue?`)) return;
    if (!emails.length) return;
    saving(e.submitter, async () => { await api.setAdmins(emails); state.admins = emails; });
  };
  $('#reset-demo')?.addEventListener('click', () => {
    if (!confirm('Reset all demo data?')) return;
    api.resetDemo();
    location.reload();
  });
}
