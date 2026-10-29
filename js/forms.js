// Form building blocks shared by the stall-owner and admin pages.
import { t, pick } from './i18n.js';
import { todayStr, statusPill, addDays } from './status.js';
import { $, esc, toast, compressImage, photoOrEmoji } from './util.js';
import { errorText } from './api.js';

// Runs an async save, shows "Saved" or the error.
export async function saving(btn, fn, okText = t('saved')) {
  if (btn) btn.disabled = true;
  try {
    await fn();
    if (okText) toast(okText);
    return true;
  } catch (e) {
    console.error(e);
    toast(errorText(e), 'error');
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// --- Open / closed control -------------------------------------------------
// status: result of storeStatus()/centreStatus(); override: current override.
export function statusControlHtml(status, override) {
  const today = todayStr();
  const active = override && override.until >= today ? override : null;
  const mode = !active ? 'auto' : active.status === 'open' ? 'open' : active.until === today ? 'closed' : 'until';
  return `
    <div class="card stack">
      <div class="status-now">${t('currently')}: ${statusPill(status)} <span class="muted small">${esc(status.detail || '')}</span></div>
      <div class="status-buttons">
        <button class="btn ${mode === 'auto' ? 'on' : ''}" data-ov="auto">🕒 ${t('followSchedule')}</button>
        <button class="btn ${mode === 'open' ? 'on' : ''}" data-ov="open">✅ ${t('openToday')}</button>
        <button class="btn ${mode === 'closed' ? 'on' : ''}" data-ov="closed">⛔ ${t('closeToday')}</button>
        <button class="btn ${mode === 'until' ? 'on' : ''}" data-ov="until">📅 ${t('closeUntil')}</button>
      </div>
      <div class="row ${mode === 'until' ? '' : 'hidden'}" id="ov-until-row">
        <input type="date" id="ov-until" min="${today}" value="${esc(mode === 'until' ? active.until : addDays(today, 1))}" style="flex:1">
        <button class="btn primary" id="ov-until-save">${t('save')}</button>
      </div>
      <label class="field"><span>${t('noteOptional')}</span>
        <input type="text" id="ov-note" maxlength="120" value="${esc(active?.note || '')}"></label>
    </div>`;
}

export function bindStatusControl(root, onSave) {
  const note = () => $('#ov-note', root).value.trim();
  root.querySelectorAll('[data-ov]').forEach((b) => {
    b.onclick = () => {
      const v = b.dataset.ov;
      const today = todayStr();
      if (v === 'until') { $('#ov-until-row', root).classList.remove('hidden'); return; }
      const ov = v === 'auto' ? null : { status: v, until: today, note: note() };
      saving(b, () => onSave(ov));
    };
  });
  $('#ov-until-save', root).onclick = (e) => {
    const until = $('#ov-until', root).value;
    if (!until) return;
    saving(e.currentTarget, () => onSave({ status: 'closed', until, note: note() }));
  };
}

// --- Weekly hours ------------------------------------------------------------
const ORDER = [1, 2, 3, 4, 5, 6, 0];
export function hoursEditorHtml(hours) {
  const h = Array.isArray(hours) ? hours : [];
  return `
    <div class="card stack">
      <b>${t('openingHours')}</b>
      <p class="small muted" style="margin:0">${t('hoursHint')}</p>
      <div class="hours-edit">
        ${ORDER.map((d) => `<span>${t('days')[d]}</span>
          <input type="time" data-open="${d}" value="${esc(h[d]?.open || '')}" aria-label="${t('days')[d]} open">
          <input type="time" data-close="${d}" value="${esc(h[d]?.close || '')}" aria-label="${t('days')[d]} close">`).join('')}
      </div>
      <div class="row">
        <button class="btn small" id="hours-copy">⇩ ${t('days')[1]} → ${t('days')[0]}</button>
        <span class="spacer"></span>
        <button class="btn primary" id="hours-save">${t('save')}</button>
      </div>
    </div>`;
}

export function bindHoursEditor(root, onSave) {
  $('#hours-copy', root).onclick = () => {
    const o = $('[data-open="1"]', root).value;
    const c = $('[data-close="1"]', root).value;
    ORDER.forEach((d) => { $(`[data-open="${d}"]`, root).value = o; $(`[data-close="${d}"]`, root).value = c; });
  };
  $('#hours-save', root).onclick = (e) => {
    const hours = [0, 1, 2, 3, 4, 5, 6].map((d) => {
      const open = $(`[data-open="${d}"]`, root).value;
      const close = $(`[data-close="${d}"]`, root).value;
      return open && close ? { open, close } : null;
    });
    saving(e.currentTarget, () => onSave(hours));
  };
}

// --- Photo picker ------------------------------------------------------------
// Returns HTML; call bindPhotoPicker to get a function returning the photo.
export function photoPickerHtml(id, photo, emoji = '📷') {
  return `
    <div class="photo-pick" id="${id}">
      <div class="pp-preview">${photoOrEmoji(photo, emoji)}</div>
      <div class="stack">
        <label class="btn small">📷 ${t('changePhoto')}
          <input type="file" accept="image/*" class="hidden pp-file"></label>
        <button type="button" class="btn small danger pp-remove ${photo ? '' : 'hidden'}">${t('removePhoto')}</button>
      </div>
    </div>`;
}

export function bindPhotoPicker(root, id, initial, { maxSide = 640, maxBytes = 90_000, emoji = '📷' } = {}) {
  const box = $(`#${id}`, root);
  let photo = initial || '';
  const show = () => {
    $('.pp-preview', box).innerHTML = photoOrEmoji(photo, emoji);
    $('.pp-remove', box).classList.toggle('hidden', !photo);
  };
  $('.pp-file', box).onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      photo = await compressImage(file, { maxSide, maxBytes });
      show();
    } catch (err) {
      toast(err.message, 'error');
    }
    e.target.value = '';
  };
  $('.pp-remove', box).onclick = () => { photo = ''; show(); };
  return () => photo;
}

// --- Dialog helper -----------------------------------------------------------
export function openDialog(html, bind) {
  const dlg = document.createElement('dialog');
  dlg.innerHTML = html;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => dlg.close(); });
  bind?.(dlg);
  dlg.showModal();
  return dlg;
}

// --- Food item dialog --------------------------------------------------------
const KINDS = ['meat', 'fish', 'veg', 'egg', 'other'];
export function openItemDialog({ item, mixedRice, onSave }) {
  const it = item || { available: true, kind: 'meat' };
  openDialog(`
    <form method="dialog" class="stack" id="item-form">
      <h2>${item ? t('editFood') : t('addFood')}</h2>
      ${photoPickerHtml('item-photo', it.photo, '🍽️')}
      <label class="field"><span>${t('name')} *</span><input type="text" name="name" required maxlength="80" value="${esc(it.name || '')}"></label>
      <label class="field"><span>${t('nameZh')}</span><input type="text" name="nameZh" maxlength="80" value="${esc(it.nameZh || '')}"></label>
      ${mixedRice ? `<label class="field"><span>${t('kind')}</span><select name="kind">${KINDS.map((k) =>
        `<option value="${k}" ${it.kind === k ? 'selected' : ''}>${t(`kind_${k}`)}</option>`).join('')}</select></label>` : ''}
      <div class="grid2">
        <label class="field"><span>${t('price')}${mixedRice ? '' : ' *'}</span>
          <input type="number" name="price" min="0" step="0.1" inputmode="decimal" ${mixedRice ? '' : 'required'} value="${esc(it.price ?? '')}"></label>
        ${mixedRice ? '' : `<label class="field"><span>${t('section')}</span><input type="text" name="section" maxlength="40" value="${esc(it.section || '')}" list="sections"></label>`}
      </div>
      <label class="field"><span>${t('description')}</span><input type="text" name="description" maxlength="150" value="${esc(it.description || '')}"></label>
      <label class="check"><input type="checkbox" name="available" ${it.available !== false ? 'checked' : ''}> ${t('available')}</label>
      <div class="row"><span class="spacer"></span>
        <button type="button" class="btn" data-close>${t('cancel')}</button>
        <button type="submit" class="btn primary">${t('save')}</button></div>
    </form>`, (dlg) => {
    const getPhoto = bindPhotoPicker(dlg, 'item-photo', it.photo, { emoji: '🍽️' });
    const form = $('#item-form', dlg);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const price = f.get('price');
      const data = {
        name: f.get('name').trim(),
        nameZh: f.get('nameZh').trim(),
        description: f.get('description').trim(),
        price: price === '' ? null : Math.round(Number(price) * 100) / 100,
        available: f.get('available') === 'on',
        photo: getPhoto(),
      };
      if (mixedRice) data.kind = f.get('kind');
      else data.section = (f.get('section') || '').trim();
      const ok = await saving(form.querySelector('[type=submit]'), () => onSave(data));
      if (ok) dlg.close();
    };
  });
}

export function itemRowHtml(it) {
  return `<div class="list-item" data-item="${esc(it.id)}">
    ${photoOrEmoji(it.photo, '🍽️', 'thumb')}
    <div class="info">
      <div class="title">${esc(pick(it))}</div>
      <div class="small muted">${it.price != null ? `RM ${Number(it.price).toFixed(2)}` : ''}
        ${it.section ? ` · ${esc(it.section)}` : ''}${it.kind ? ` · ${t(`kind_${it.kind}`)}` : ''}</div>
      <div class="row" style="margin-top:6px">
        <button class="btn small" data-edit>${t('edit')}</button>
        <button class="btn small danger" data-del>${t('delete')}</button>
      </div>
    </div>
    <label class="switch" title="${t('available')}"><input type="checkbox" data-avail ${it.available !== false ? 'checked' : ''}
      aria-label="${t('available')}"><span></span></label>
  </div>`;
}
