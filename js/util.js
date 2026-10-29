// Small shared helpers used by all three pages.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function fmtPrice(n) {
  const v = Number(n);
  return Number.isFinite(v) ? `RM ${v.toFixed(2)}` : '';
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function stars(rating) {
  const r = Math.round(rating || 0);
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

let toastTimer;
export function toast(message, kind = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

// Shrinks a photo in the browser so it can be stored directly in the free
// database (no paid file storage needed). Result is a small data: URL.
export async function compressImage(file, { maxSide = 640, maxBytes = 90_000 } = {}) {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Cannot read this image'));
      i.src = bitmapUrl;
    });
    let side = maxSide;
    let quality = 0.75;
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = Math.min(1, side / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let data = canvas.toDataURL('image/webp', quality);
      if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/jpeg', quality);
      if (data.length <= maxBytes) return data;
      if (quality > 0.45) quality -= 0.1; else side = Math.round(side * 0.8);
    }
    throw new Error('Image is too large');
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function sortStores(list) {
  return [...list].sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
}

export function sortItems(list) {
  return [...list].sort((a, b) =>
    (a.section || '').localeCompare(b.section || '') || (a.createdAt || 0) - (b.createdAt || 0));
}

// Categories shown on cards and the floor plan. Labels live in i18n.js.
export const CATEGORIES = {
  drinks: { emoji: '🥤', color: '#3b82f6' },
  mixedRice: { emoji: '🍱', color: '#f59e0b' },
  cookedFood: { emoji: '🍳', color: '#ef4444' },
  noodles: { emoji: '🍜', color: '#eab308' },
  porridge: { emoji: '🥣', color: '#a3a3a3' },
  panMee: { emoji: '🥢', color: '#84cc16' },
  wantanMee: { emoji: '🥟', color: '#f97316' },
  chickenRice: { emoji: '🍗', color: '#d97706' },
  soup: { emoji: '🍲', color: '#14b8a6' },
  chinese: { emoji: '🥡', color: '#dc2626' },
  dessert: { emoji: '🍧', color: '#ec4899' },
  other: { emoji: '🍽️', color: '#8b5cf6' },
};

export function categoryOf(store) {
  return CATEGORIES[store?.category] || CATEGORIES.other;
}

export function photoOrEmoji(photo, emoji, cls = '') {
  return photo
    ? `<img class="${cls}" src="${esc(photo)}" alt="" loading="lazy">`
    : `<div class="${cls} emoji-ph" aria-hidden="true">${emoji}</div>`;
}
