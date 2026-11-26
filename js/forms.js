// Form building blocks for the staff pages (stall owners and the manager).
import { t, pick, pickAlt, getLang } from './i18n.js?v=3';
import { todayStr, addDays, overrideActive, nowLocal } from './status.js?v=3';
import { $, esc, toast, compressImage, fmtPrice, pic } from './util.js?v=3';
import { errorText } from './api.js?v=3';
import { art } from './art.js?v=3';

// Runs an async save, shows "Saved" or the error. Returns true on success.
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

const icon = (path, color) => `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" style="flex:none">${path}</svg>`;
const ICON_TODAY = icon('<circle cx="12" cy="12" r="9"/><path d="M6 18L18 6"/>', '#A8261B');
const ICON_HOLIDAY = icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', '#8A5A33');
const ICON_NORMAL = icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', '#2B6B4E');
const ICON_ANYWAY = icon('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>', '#1E6E3A');

// --- Open / closed choices --------------------------------------------------
export function statusChoicesHtml(override) {
  const today = todayStr();
  const active = overrideActive(override);
  const mode = !active ? 'normal' : active.status === 'open' ? 'anyway' : active.until === today ? 'today' : 'holiday';
  const choice = (key, ic, title, sub, extra = '') =>
    `<button type="button" class="choice ${mode === key ? 'on' : ''} ${extra}" data-ov="${key}">${ic}
      <span><b>${title}${mode === key ? ' ✓' : ''}</b><span class="sub">${sub}</span></span></button>`;
  return `<div class="stack">
    <b>${t('chooseOne')}</b>
    ${choice('today', ICON_TODAY, t('chToday'), t('chTodaySub'))}
    ${choice('holiday', ICON_HOLIDAY, t('chHoliday'), t('chHolidaySub'))}
    <div class="card stack ${mode === 'holiday' ? '' : 'hidden'}" id="ov-until-box">
      <label class="field"><span>${t('lastDay')}</span>
        <input type="date" id="ov-until" min="${today}" value="${esc(mode === 'holiday' ? active.until : addDays(today, 2))}"></label>
      <button type="button" class="btn red" id="ov-until-save">${t('save')}</button>
    </div>
    ${choice('normal', ICON_NORMAL, t('chNormal'), t('chNormalSub'))}
    ${choice('anyway', ICON_ANYWAY, t('chAnyway'), t('chAnywaySub'), 'dashed')}
    <label class="field"><span>${t('messageForCustomers')}</span>
      <input type="text" id="ov-note" maxlength="120" placeholder="${esc(t('messageEg'))}" value="${esc(active?.note || '')}"></label>
  </div>`;
}

export function bindStatusChoices(root, onSave) {
  const note = () => $('#ov-note', root).value.trim();
  root.querySelectorAll('[data-ov]').forEach((b) => {
    b.onclick = () => {
      const v = b.dataset.ov;
      if (v === 'holiday') { $('#ov-until-box', root).classList.remove('hidden'); $('#ov-until', root).focus(); return; }
      const ov = v === 'normal' ? null : { status: v === 'anyway' ? 'open' : 'closed', until: todayStr(), note: note() };
      saving(b, () => onSave(ov));
    };
  });
  $('#ov-until-save', root).onclick = (e) => {
    const until = $('#ov-until', root).value;
    if (until) saving(e.currentTarget, () => onSave({ status: 'closed', until, note: note() }));
  };
}

// --- Weekly hours --------------------------------------------------------------
const ORDER = [1, 2, 3, 4, 5, 6, 0];

// Dropdown of times every 30 minutes, written the way people say them
// ("3:00 pm" / "下午3:00"), so nobody mixes up 03:00 and 15:00.
function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const mm = String(m).padStart(2, '0');
  const h12 = h % 12 || 12;
  if (getLang() === 'zh') return `${h < 12 ? (h < 6 ? '凌晨' : '早上') : h < 18 ? '下午' : '晚上'}${h12}:${mm}`;
  return `${h12}:${mm} ${h < 12 ? 'am' : 'pm'}`;
}
function timeSelect(attr, d, value, label) {
  const times = [];
  for (let i = 0; i < 48; i++) times.push(`${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
  if (value && !times.includes(value)) times.push(value);
  times.sort();
  return `<select ${attr}="${d}" aria-label="${esc(label)}">
    <option value="">—</option>
    ${times.map((v) => `<option value="${v}" ${v === value ? 'selected' : ''}>${timeLabel(v)}</option>`).join('')}
  </select>`;
}
export function hoursEditorHtml(hours, title = t('hoursTitle')) {
  const h = Array.isArray(hours) ? hours : [];
  return `<div class="card stack">
    <div class="card-title">${title}</div>
    <div class="hours-grid" id="hours-grid">
      <span></span><span class="head">${t('hOpen')}</span><span class="head">${t('hClose')}</span><span class="head" style="text-align:center">${t('hRest')}</span>
      ${ORDER.map((d) => {
        const e = h[d];
        const rest = !(e && e.open && e.close);
        return `<b>${t('days')[d]}</b>
          ${timeSelect('data-open', d, e?.open || '', `${t('days')[d]} ${t('hOpen')}`)}
          ${timeSelect('data-close', d, e?.close || '', `${t('days')[d]} ${t('hClose')}`)}
          <label class="rest"><input type="checkbox" data-rest="${d}" ${rest ? 'checked' : ''} aria-label="${t('days')[d]} ${t('hRest')}"></label>`;
      }).join('')}
    </div>
    <div class="grid2">
      <button type="button" class="btn" id="hours-same">${t('sameEveryDay')}</button>
      <button type="button" class="btn green" id="hours-save">${t('save')}</button>
    </div>
  </div>`;
}

export function bindHoursEditor(root, onSave) {
  const grid = $('#hours-grid', root);
  const sync = () => ORDER.forEach((d) => {
    const rest = $(`[data-rest="${d}"]`, grid).checked;
    [$(`[data-open="${d}"]`, grid), $(`[data-close="${d}"]`, grid)].forEach((i) => { i.style.opacity = rest ? 0.35 : 1; });
  });
  grid.querySelectorAll('[data-rest]').forEach((c) => { c.onchange = sync; });
  grid.querySelectorAll('select').forEach((i) => {
    i.onchange = () => { $(`[data-rest="${i.dataset.open ?? i.dataset.close}"]`, grid).checked = false; sync(); };
  });
  sync();
  $('#hours-same', root).onclick = () => {
    const o = $('[data-open="1"]', grid).value;
    const c = $('[data-close="1"]', grid).value;
    const r = $('[data-rest="1"]', grid).checked;
    ORDER.forEach((d) => {
      $(`[data-open="${d}"]`, grid).value = o;
      $(`[data-close="${d}"]`, grid).value = c;
      $(`[data-rest="${d}"]`, grid).checked = r;
    });
    sync();
    toast(t('sameEveryDayDone'));
  };
  $('#hours-save', root).onclick = (e) => {
    const hours = [0, 1, 2, 3, 4, 5, 6].map((d) => {
      const open = $(`[data-open="${d}"]`, grid).value;
      const close = $(`[data-close="${d}"]`, grid).value;
      return !$(`[data-rest="${d}"]`, grid).checked && open && close ? { open, close } : null;
    });
    saving(e.currentTarget, () => onSave(hours));
  };
}

// --- Photo picker --------------------------------------------------------------
export function photoPickerHtml(id, photo, fallback) {
  return `<div class="photo-pick" id="${id}">
    <div class="pp-preview">${pic(photo || fallback, '')}</div>
    <div class="stack" style="flex:1;min-width:170px">
      <label class="btn">${t('changePhoto')}<input type="file" accept="image/*" class="hidden pp-file"></label>
      <button type="button" class="btn sm danger pp-remove ${photo ? '' : 'hidden'}">${t('removePhoto')}</button>
    </div>
  </div>`;
}

export function bindPhotoPicker(root, id, initial, fallback, { maxSide = 640, maxBytes = 90_000 } = {}) {
  const box = $(`#${id}`, root);
  let photo = initial || '';
  const show = () => {
    $('.pp-preview', box).innerHTML = pic(photo || fallback, '');
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

// --- Dialog helper -------------------------------------------------------------
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

// --- Food item dialog ----------------------------------------------------------
export const KINDS = ['meat', 'fish', 'veg', 'egg', 'other'];

// Price line for a dish or price-guide row: several sizes ("Small RM 10.00 ·
// Big RM 17.00"), a starting price ("from RM 4.30"), one price, or nothing
// when the stall has not given a price.
export function priceText(it) {
  if (it.sizes?.length) return it.sizes.map((s) => `${s.label} ${fmtPrice(s.price)}`).join(' · ');
  if (it.price == null || it.price === '') return '';
  return it.priceFrom ? t('fromPrice', { p: fmtPrice(it.price) }) : fmtPrice(it.price);
}
// One line per size: label on the left, price on the right.
export function sizesHtml(it) {
  return it.sizes?.length ? `<div class="dish-sizes">${it.sizes.map((x) =>
    `<span><span>${esc(x.label)}</span><b class="price">${fmtPrice(x.price)}</b></span>`).join('')}</div>` : '';
}
// Dishes sold only on some days keep `days` (0 = Sunday … 6 = Saturday, Malaysia
// time); no `days` means every day.
export const soldToday = (it) => !it.days?.length || it.days.includes(nowLocal().day);
export const daysText = (it) => (it.days?.length ? t('onlyOn', { d: it.days.map((d) => t('days')[d]).join(', ') }) : '');
const sizeRow = (s = {}) => `<div class="size-row">
  <input type="text" data-size-label maxlength="40" placeholder="${esc(t('sizeName'))}" value="${esc(s.label || '')}">
  <input type="number" data-size-price min="0" step="0.1" inputmode="decimal" placeholder="RM" value="${esc(s.price ?? '')}">
  <button type="button" class="btn sm danger" data-size-del aria-label="${esc(t('delete'))}">✕</button>
</div>`;

export function openItemDialog({ item, mixedRice, onSave }) {
  const it = item || { available: true, kind: 'meat' };
  openDialog(`
    <form method="dialog" class="stack" id="item-form">
      <h2 class="sign">${item ? t('editFood') : t('addFood')}</h2>
      ${photoPickerHtml('item-photo', it.photo, art('dish'))}
      <label class="field"><span>${t('name')} *</span><input type="text" name="name" required maxlength="80" value="${esc(it.name || '')}"></label>
      <label class="field"><span>${t('nameZh')}</span><input type="text" name="nameZh" maxlength="80" value="${esc(it.nameZh || '')}"></label>
      ${mixedRice ? `<label class="field"><span>${t('kind')}</span><select name="kind">${KINDS.map((k) =>
        `<option value="${k}" ${it.kind === k ? 'selected' : ''}>${t(`kind_${k}`)}</option>`).join('')}</select></label>` : ''}
      <div id="one-price" class="stack ${it.sizes?.length ? 'hidden' : ''}" style="gap:6px">
        <label class="field"><span>${t('price')}</span>
          <input type="number" name="price" min="0" step="0.1" inputmode="decimal" value="${esc(it.sizes?.length ? '' : it.price ?? '')}"></label>
        <label class="check"><input type="checkbox" name="priceFrom" ${it.priceFrom ? 'checked' : ''}><span>${t('priceFromBox')}</span></label>
      </div>
      ${mixedRice ? '' : `<div class="stack" style="gap:6px">
        <div id="sizes" class="stack" style="gap:6px">${(it.sizes || []).map(sizeRow).join('')}</div>
        <button type="button" class="btn sm" id="add-size">+ ${t('addSize')}</button>
        <div class="help">${t('sizesHelp')}</div>
      </div>
      <div class="grid2">
        <label class="field"><span>${t('section')}</span><input type="text" name="section" maxlength="40" value="${esc(it.section || '')}" list="sections"></label>
        <label class="field"><span>${t('dishCode')}</span><input type="text" name="code" maxlength="8" value="${esc(it.code || '')}"></label>
      </div>`}
      <label class="field"><span>${t('description')}</span><input type="text" name="description" maxlength="150" value="${esc(it.description || '')}"></label>
      <div class="field"><span>${t('soldOnDays')}</span>
        <div class="day-picks">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="check"><input type="checkbox" name="day" value="${d}" ${!it.days?.length || it.days.includes(d) ? 'checked' : ''}><span>${t('days')[d]}</span></label>`).join('')}</div>
        <div class="help">${t('soldOnDaysHelp')}</div></div>
      <div class="grid2">
        <button type="button" class="btn" data-close>${t('cancel')}</button>
        <button type="submit" class="btn green">${t('save')}</button>
      </div>
    </form>`, (dlg) => {
    const getPhoto = bindPhotoPicker(dlg, 'item-photo', it.photo, art('dish'));
    const form = $('#item-form', dlg);
    // With sizes the single price box is hidden; each size has its own price.
    const sizesBox = $('#sizes', dlg);
    const syncSizes = () => $('#one-price', dlg).classList.toggle('hidden', !!sizesBox?.children.length);
    $('#add-size', dlg)?.addEventListener('click', () => {
      if (!sizesBox.children.length) sizesBox.insertAdjacentHTML('beforeend', sizeRow({ price: form.price.value }));
      sizesBox.insertAdjacentHTML('beforeend', sizeRow());
      syncSizes();
    });
    sizesBox?.addEventListener('click', (e) => {
      if (e.target.closest('[data-size-del]')) { e.target.closest('.size-row').remove(); syncSizes(); }
    });
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const data = {
        name: f.get('name').trim(),
        nameZh: f.get('nameZh').trim(),
        description: f.get('description').trim(),
        photo: getPhoto(),
      };
      const money = (v) => (v === '' || v == null ? null : Math.round(Number(v) * 100) / 100);
      const sizes = [...dlg.querySelectorAll('.size-row')]
        .map((r) => ({ label: $('[data-size-label]', r).value.trim(), price: money($('[data-size-price]', r).value) }))
        .filter((s) => s.label && s.price != null);
      if (sizes.length) {
        Object.assign(data, { sizes, price: Math.min(...sizes.map((s) => s.price)), priceFrom: false });
      } else {
        Object.assign(data, { sizes: [], price: money(f.get('price')), priceFrom: !!f.get('priceFrom') });
      }
      if (mixedRice) {
        data.kind = f.get('kind');
      } else {
        data.section = f.get('section').trim();
        data.code = f.get('code').trim();
      }
      const days = f.getAll('day').map(Number).sort();
      data.days = days.length === 7 || !days.length ? [] : days;
      if (!item) data.available = true;
      const ok = await saving(form.querySelector('[type=submit]'), () => onSave(data));
      if (ok) dlg.close();
    };
  });
}

export function itemCardHtml(it) {
  const sold = it.available === false;
  return `<div class="card item-card ${sold ? 'sold' : ''}" data-item="${esc(it.id)}">
    <div class="top">
      ${pic(it.photo || art('dish'))}
      <div style="flex:1;min-width:0">
        <div style="font-weight:900;font-size:1.1rem;line-height:1.3">${it.code ? `<span class="dish-code">${esc(it.code)}</span> ` : ''}${esc(pick(it))} ${pickAlt(it) ? `<span class="muted" style="font-weight:500">${esc(pickAlt(it))}</span>` : ''}</div>
        ${it.sizes?.length ? sizesHtml(it) : priceText(it) ? `<div class="price">${esc(priceText(it))}</div>` : `<div class="small muted">${t('noPriceYet')}</div>`}
        ${it.kind ? `<div class="small muted">${t(`kind_${it.kind}`)}</div>` : ''}
        ${daysText(it) ? `<div class="small" style="color:var(--jade);font-weight:700">${esc(daysText(it))}</div>` : ''}
      </div>
    </div>
    <button type="button" class="avail ${sold ? 'no' : 'yes'}" data-avail>${sold ? t('soldOutBtn') : t('availableBtn')}</button>
    <div class="grid2">
      <button type="button" class="btn sm" data-edit>${t('edit')}</button>
      <button type="button" class="btn sm danger" data-del>${t('delete')}</button>
    </div>
  </div>`;
}
