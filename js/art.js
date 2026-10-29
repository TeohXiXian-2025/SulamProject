// Simple drawn food pictures, used until the stall owner uploads a real
// photo. Each returns a small SVG as a data: URL, so it can be stored and
// shown exactly like an uploaded photo.

const BG = '<rect width="80" height="80" fill="#F3E3C3"/>';
const plate = (inner) => `${BG}<ellipse cx="40" cy="44" rx="33" ry="25" fill="#fff" stroke="#D9CBAE" stroke-width="2"/>${inner}`;
const rice = '<ellipse cx="29" cy="44" rx="15" ry="12" fill="#FBF1D6"/>';
const bowl = (soup, inner = '') => `${BG}<path d="M10 38h60c0 18-13 30-30 30S10 56 10 38z" fill="#fff" stroke="#D9CBAE" stroke-width="2"/><path d="M13 46h54" stroke="#A8261B" stroke-width="3"/><ellipse cx="40" cy="38" rx="30" ry="9" fill="${soup}"/>${inner}`;
const noodles = (c = '#F2CF5B') => `<path d="M20 37c5-4 8 4 13 0s8 4 13 0 8 4 13 0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const chopsticks = '<path d="M52 10L34 36M60 12L42 36" stroke="#8A5A33" stroke-width="3" stroke-linecap="round"/>';
const glass = (drink, foam) => `${BG}<path d="M24 16h32l-5 52H29z" fill="#EDE4D3" stroke="#BFAE92" stroke-width="2"/><path d="M26 30h28l-3.8 36H29.8z" fill="${drink}"/><path d="M26 30h28l-.6 6H26.6z" fill="${foam}"/><rect x="31" y="40" width="8" height="8" rx="2" fill="#fff" opacity=".5"/><rect x="42" y="47" width="8" height="8" rx="2" fill="#fff" opacity=".5"/><path d="M47 8l-4 30" stroke="#A8261B" stroke-width="3" stroke-linecap="round"/>`;
const cup = (drink) => `${BG}<ellipse cx="38" cy="62" rx="28" ry="7" fill="#fff" stroke="#D9CBAE" stroke-width="2"/><path d="M20 30h36l-4 30H24z" fill="#fff" stroke="#BFAE92" stroke-width="2"/><ellipse cx="38" cy="31" rx="17" ry="4" fill="${drink}"/><path d="M56 36c8 0 8 12 0 12" stroke="#BFAE92" stroke-width="3" fill="none"/><path d="M32 22c-2-4 2-6 0-10M40 22c-2-4 2-6 0-10" stroke="#BFAE92" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const greens = '<circle cx="24" cy="58" r="4" fill="#79A85C"/><circle cx="32" cy="61" r="4" fill="#79A85C"/>';
const chicken = (meat, line) => `<path d="M40 33c10-5 20-2 24 6l-6 13c-8 2-15-1-19-6z" fill="${meat}"/><path d="M44 38l14 3M43 45l13 3" stroke="${line}" stroke-width="2" stroke-linecap="round"/>`;

const ART = {
  kopi: glass('#7A4524', '#C89B6D'),
  kopiHot: cup('#7A4524'),
  teh: glass('#C68A4E', '#E8C9A0'),
  tehHot: cup('#C68A4E'),
  milo: glass('#5A3A22', '#8A6A50'),
  barley: glass('#E3D3A6', '#F4ECD2'),
  roastChicken: plate(rice + chicken('#C9672A', '#8C4416') + greens),
  steamChicken: plate(rice + chicken('#F2DDB0', '#D9B878') + greens),
  charSiu: plate(`${rice}<rect x="40" y="32" width="10" height="20" rx="3" fill="#B23A2A"/><rect x="52" y="33" width="10" height="20" rx="3" fill="#B23A2A"/>${greens}`),
  mixedRice: plate(`<ellipse cx="28" cy="40" rx="13" ry="11" fill="#FBF1D6"/><path d="M42 30c6-3 13-1 16 4l-3 9c-6 2-11 0-14-4z" fill="#C2552A"/><path d="M44 47c4-3 10-3 14 1-2 6-9 8-14 4z" fill="#5E9E45"/><path d="M24 54c4-2 9-2 12 1-2 5-8 6-12 3z" fill="#F2CF5B"/>`),
  wok: plate('<circle cx="31" cy="40" r="7" fill="#A8461F"/><circle cx="46" cy="37" r="6" fill="#B85A26"/><circle cx="40" cy="51" r="7" fill="#9B3C18"/><path d="M51 50l7-5M24 46l6-5" stroke="#D62F1F" stroke-width="3" stroke-linecap="round"/><circle cx="52" cy="44" r="2.5" fill="#79A85C"/>'),
  sweetSour: plate('<circle cx="30" cy="42" r="7" fill="#D2462C"/><circle cx="44" cy="38" r="6" fill="#C23B26"/><circle cx="40" cy="52" r="7" fill="#D2462C"/><circle cx="52" cy="48" r="5" fill="#C23B26"/><path d="M26 54l6-3M50 38l6 1" stroke="#F2CF5B" stroke-width="4" stroke-linecap="round"/>'),
  fish: plate('<path d="M18 44c10-12 30-12 40 0-10 12-30 12-40 0z" fill="#D9822B"/><path d="M58 44l10-8v16z" fill="#C9672A"/><circle cx="26" cy="42" r="2" fill="#2E1F15"/><path d="M34 40v8M42 39v10" stroke="#B85A26" stroke-width="2"/>'),
  friedRice: plate('<ellipse cx="40" cy="44" rx="22" ry="15" fill="#E9C46A"/><circle cx="33" cy="40" r="2.5" fill="#79A85C"/><circle cx="45" cy="46" r="2.5" fill="#79A85C"/><circle cx="40" cy="38" r="2.5" fill="#E76F51"/><circle cx="48" cy="40" r="2.5" fill="#F4A261"/><circle cx="34" cy="49" r="2.5" fill="#E76F51"/>'),
  veg: plate('<path d="M22 46c8-12 26-14 34-3-7 10-24 12-34 3z" fill="#A8D08A"/><path d="M36 40c10-10 24-8 28 2-8 8-20 8-28-2z" fill="#79B85E"/><path d="M28 52c8-6 20-6 26 2-6 6-18 6-26-2z" fill="#B9DA98"/>'),
  beans: plate('<path d="M18 42l44 5M20 49l42-2M23 55l36-6M21 37l38 10" stroke="#4E8F3A" stroke-width="4" stroke-linecap="round"/>'),
  kangkung: plate('<path d="M20 44l40 4M22 50l36-2M24 38l32 8" stroke="#4E8F3A" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="45" r="3" fill="#B23A2A"/>'),
  curry: plate('<ellipse cx="40" cy="45" rx="25" ry="16" fill="#E09A2D"/><path d="M26 44c4-5 11-5 14 1-3 6-10 6-14-1z" fill="#B8672A"/><path d="M42 40c4-4 11-3 13 2-4 5-10 5-13-2z" fill="#B8672A"/><circle cx="40" cy="52" r="4" fill="#F2D9A0"/>'),
  egg: plate('<ellipse cx="40" cy="44" rx="20" ry="14" fill="#FFF6DD" stroke="#F2D9A0"/><circle cx="40" cy="44" r="7" fill="#F2B51B"/>'),
  tofu: plate('<rect x="26" y="36" width="12" height="12" rx="2" fill="#F5E6C4" stroke="#D9B878"/><rect x="42" y="38" width="12" height="12" rx="2" fill="#F5E6C4" stroke="#D9B878"/><rect x="34" y="50" width="12" height="10" rx="2" fill="#F5E6C4" stroke="#D9B878"/><path d="M24 34c10 4 22 4 32 0" stroke="#B23A2A" stroke-width="2" fill="none"/>'),
  curryMee: bowl('#E0882D', noodles() + '<circle cx="30" cy="34" r="3" fill="#F5E6C4"/><circle cx="53" cy="35" r="4" fill="#79A85C"/>' + chopsticks),
  kueyTeow: plate('<path d="M22 40c6-4 10 4 16 0s10 4 16 0 6 4 8 2M20 47c6-4 10 4 16 0s10 4 16 0 6 4 8 2" stroke="#8A5A33" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="34" cy="38" r="3" fill="#F28C6A"/><circle cx="50" cy="50" r="3" fill="#79A85C"/>'),
  hokkien: plate('<path d="M22 40c6-4 10 4 16 0s10 4 16 0M20 47c6-4 10 4 16 0s10 4 16 0M24 54c6-4 10 4 16 0s8 4 12 0" stroke="#5A3A22" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="44" cy="44" r="3" fill="#F28C6A"/>'),
  porridge: bowl('#F6EEDC', '<circle cx="30" cy="35" r="2.5" fill="#79A85C"/><circle cx="38" cy="38" r="2.5" fill="#79A85C"/><circle cx="47" cy="34" r="2.5" fill="#79A85C"/><path d="M42 31l8 2M33 39l6 1" stroke="#E2A93B" stroke-width="2" stroke-linecap="round"/>'),
  centuryEgg: bowl('#F6EEDC', '<ellipse cx="34" cy="37" rx="6" ry="4" fill="#3D2E22"/><ellipse cx="48" cy="38" rx="5" ry="3" fill="#C9A27A"/><circle cx="40" cy="34" r="2" fill="#79A85C"/>'),
  panMeeDry: bowl('#8A5A33', noodles('#F5E6C4') + '<circle cx="36" cy="35" r="3" fill="#C23B26"/><circle cx="46" cy="37" r="3" fill="#C23B26"/><circle cx="52" cy="34" r="3" fill="#2E1F15"/>' + chopsticks),
  panMeeSoup: bowl('#D9B878', noodles('#F5E6C4') + '<path d="M26 36c4-2 8-2 10 1" stroke="#5E9E45" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="35" r="3" fill="#2E1F15"/>' + chopsticks),
  wantanMee: plate('<path d="M22 40c6-4 10 4 16 0s10 4 16 0M20 47c6-4 10 4 16 0s10 4 16 0" stroke="#F2CF5B" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="44" y="48" width="9" height="7" rx="2" fill="#B23A2A"/><path d="M26 52c3-4 9-4 10 0-3 3-7 3-10 0z" fill="#F5E6C4"/><path d="M50 36l8 2" stroke="#5E9E45" stroke-width="4" stroke-linecap="round"/>'),
  soup: bowl('#E8A15A', '<circle cx="30" cy="37" r="4" fill="#E76F51"/><circle cx="42" cy="35" r="4" fill="#F2CF5B"/><circle cx="51" cy="38" r="3" fill="#79A85C"/>'),
  herbalSoup: bowl('#6B3E1F', '<path d="M30 36c4-3 8-3 10 0" stroke="#F2DDB0" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="36" r="3" fill="#C23B26"/><circle cx="52" cy="38" r="2" fill="#C23B26"/>'),
  mapoTofu: bowl('#C23B26', '<rect x="28" y="33" width="7" height="7" rx="1.5" fill="#F5E6C4"/><rect x="39" y="35" width="7" height="7" rx="1.5" fill="#F5E6C4"/><rect x="49" y="33" width="6" height="6" rx="1.5" fill="#F5E6C4"/><circle cx="36" cy="40" r="1.5" fill="#79A85C"/>'),
  dish: plate('<ellipse cx="40" cy="44" rx="18" ry="12" fill="#E9C46A"/>'),
};

// Picture used for a stall when it has no photo of its own.
export const CATEGORY_ART = {
  drinks: 'kopi', mixedRice: 'mixedRice', cookedFood: 'wok', noodles: 'curryMee',
  porridge: 'porridge', panMee: 'panMeeDry', wantanMee: 'wantanMee', chickenRice: 'roastChicken',
  soup: 'soup', chinese: 'mapoTofu', dessert: 'barley', other: 'dish',
};

const cache = new Map();
export function art(kind) {
  const key = ART[kind] ? kind : 'dish';
  if (!cache.has(key)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${ART[key]}</svg>`;
    cache.set(key, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  }
  return cache.get(key);
}

export const storeArt = (store) => art(CATEGORY_ART[store?.category] || 'dish');
