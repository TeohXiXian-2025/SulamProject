// Works out whether the hawker centre / a stall is open right now.
//
// hours:    array of 7 entries (0 = Sunday … 6 = Saturday), each either
//           null (day off) or { open: 'HH:MM', close: 'HH:MM' }.
//           A close time earlier than the open time means "past midnight".
// override: { status: 'open' | 'closed', until: 'YYYY-MM-DD', note } or null.
//           Set by the owner for sudden changes. It applies up to and
//           including the `until` date, then the normal schedule resumes.
import { TIMEZONE } from './config.js';
import { t } from './i18n.js';

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
});
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function nowLocal(date = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    day: WEEKDAYS[p.weekday],
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

export function todayStr() { return nowLocal().date; }

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const toMin = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function validDay(entry) {
  return entry && toMin(entry.open) != null && toMin(entry.close) != null;
}

export function hasSchedule(hours) {
  return Array.isArray(hours) && hours.some(validDay);
}

// Returns { open, closeAt } for the schedule alone.
function scheduleState(hours, now) {
  if (!hasSchedule(hours)) return { open: true, closeAt: null, always: true };
  const today = hours[now.day];
  if (validDay(today)) {
    const o = toMin(today.open);
    const c = toMin(today.close);
    if (c > o ? now.minutes >= o && now.minutes < c : now.minutes >= o) {
      return { open: true, closeAt: today.close };
    }
  }
  // Yesterday's shift running past midnight.
  const y = hours[(now.day + 6) % 7];
  if (validDay(y)) {
    const o = toMin(y.open);
    const c = toMin(y.close);
    if (c <= o && now.minutes < c) return { open: true, closeAt: y.close };
  }
  return { open: false };
}

// Next scheduled opening strictly after "now" (and after a closed-until date).
function nextOpening(hours, now, notBefore) {
  if (!hasSchedule(hours)) return null;
  for (let i = 0; i <= 8; i++) {
    const date = addDays(now.date, i);
    if (notBefore && date <= notBefore) continue;
    const day = (now.day + i) % 7;
    const entry = hours[day];
    if (!validDay(entry)) continue;
    if (i === 0 && toMin(entry.open) <= now.minutes) continue;
    return { date, day, time: entry.open, isToday: i === 0 };
  }
  return null;
}

function activeOverride(ov, now) {
  return ov && (ov.status === 'open' || ov.status === 'closed') && ov.until && ov.until >= now.date ? ov : null;
}

// Result: { open, label, detail, note, reason }
//   reason: 'schedule' | 'override' | 'centre'
export function centreStatus(centre, now = nowLocal()) {
  const ov = activeOverride(centre?.override, now);
  if (ov) return describe(ov.status === 'open', 'override', ov, centre?.hours, now);
  const s = scheduleState(centre?.hours, now);
  return describe(s.open, 'schedule', null, centre?.hours, now, s.closeAt);
}

export function storeStatus(store, centre, now = nowLocal()) {
  const c = centreStatus(centre, now);
  if (!c.open) {
    return { open: false, reason: 'centre', label: t('closed'), detail: t('centreClosed'), note: c.note };
  }
  const ov = activeOverride(store?.override, now);
  if (ov) return describe(ov.status === 'open', 'override', ov, store?.hours, now);
  const s = scheduleState(store?.hours, now);
  return describe(s.open, 'schedule', null, store?.hours, now, s.closeAt);
}

function describe(open, reason, ov, hours, now, closeAt) {
  const res = { open, reason, label: open ? t('open') : t('closed'), detail: '', note: ov?.note || '' };
  if (open) {
    if (closeAt) res.detail = t('closesAt', { t: closeAt });
    return res;
  }
  if (ov) {
    res.detail = ov.until === now.date ? t('closedToday') : t('closedUntil', { d: prettyDate(ov.until) });
    return res;
  }
  const next = nextOpening(hours, now, ov?.until);
  if (next) {
    res.detail = next.isToday ? t('opensAt', { t: next.time }) : t('opensOn', { d: t('days')[next.day], t: next.time });
  }
  return res;
}

export function prettyDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${t('days')[day]} ${d}/${m}`;
}

export function hoursTable(hours) {
  if (!hasSchedule(hours)) return '';
  const now = nowLocal();
  const days = t('days');
  // Start the week on Monday for display.
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const e = hours[d];
    const txt = validDay(e) ? `${e.open} – ${e.close}` : t('dayOff');
    return `<tr class="${d === now.day ? 'today' : ''}"><th>${days[d]}</th><td>${txt}</td></tr>`;
  }).join('');
}

export function statusPill(st) {
  const cls = st.open ? 'open' : 'closed';
  return `<span class="pill ${cls}"><span class="dot"></span>${st.label}</span>`;
}
