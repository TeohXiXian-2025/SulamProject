// Starter data: the shop, its 10 stalls, a default floor plan and sample
// menus. The manager can load these with one click and then edit everything.
import { art } from './art.js';

const weekday = (open, close, offDays = []) =>
  [0, 1, 2, 3, 4, 5, 6].map((d) => (offDays.includes(d) ? null : { open, close }));

export const DEFAULT_CENTRE = {
  name: 'Restoran Kim Seng',
  nameZh: '金城茶餐室',
  address: '',
  announcement: '',
  hours: weekday('06:30', '22:00'),
  override: null,
  floor: {
    // Approximate positions from the Digital Niaga 3D scene (28 × 24 units).
    cols: 28,
    rows: 24,
    extras: [
      { id: 'entrance-east', type: 'entrance', x: 26, y: 4, w: 2, h: 1 },
      { id: 'entrance-south', type: 'entrance', x: 8, y: 23, w: 2, h: 1 },
      { id: 'beverage-counter', type: 'counter', x: 11.5, y: 1.8, w: 3, h: 3 },
      { id: 'toilet', type: 'toilet', x: 10.9, y: 0.1, w: 2.2, h: 1.6 },
      ...[[-6, -4], [1.8, -9], [2, -1], [2, 5], [2, 10]].map(([x, z], i) =>
        ({ id: `pillar-${i + 1}`, type: 'pillar', x: x + 13.4, y: z + 11.4, w: 1.2, h: 1.2 })),
      ...[[-10, -6], [-10, -4.2], [-6, -6], [-6, -1], [-6, 3], [-6, 7], [-6, 10],
        [-1, -5], [-1, -2], [-1, 0], [4, -5], [4, -2], [8, -5], [8, -2],
        [8, 1], [8, 4], [8, 7], [8, 10]].map(([x, z], i) =>
        ({ id: `table-${i + 1}`, type: 'table', x: x + 13.2, y: z + 11.2, w: 1.6, h: 1.6 })),
    ],
  },
};

export const STARTER_STORES = [
  { number: 1, name: 'Beverage', nameZh: '饮料', category: 'drinks', hours: weekday('06:30', '22:00') },
  { number: 2, name: 'Economy Mixed Rice', nameZh: '经济饭', category: 'mixedRice', type: 'mixedRice', hours: weekday('10:30', '15:00', [0]) },
  { number: 3, name: 'Masakan Panas', nameZh: '煮炒', category: 'cookedFood', hours: weekday('11:00', '22:00', [2]) },
  { number: 4, name: 'Noodles', nameZh: '面食', category: 'noodles', hours: weekday('07:00', '14:00', [1]) },
  { number: 5, name: 'Porridge', nameZh: '粥', category: 'porridge', hours: weekday('07:00', '13:00', [3]) },
  { number: 6, name: 'Pan Mee', nameZh: '板面', category: 'panMee', hours: weekday('07:30', '15:00', [4]) },
  { number: 7, name: 'Wantan Mee', nameZh: '云吞面', category: 'wantanMee', hours: weekday('07:00', '14:00', [1]) },
  { number: 8, name: 'Chicken Rice', nameZh: '鸡饭', category: 'chickenRice', hours: weekday('10:00', '20:00', [5]) },
  { number: 9, name: 'Soup', nameZh: '汤', category: 'soup', hours: weekday('11:00', '20:00', [0]) },
  { number: 10, name: 'China Cuisine', nameZh: '中国菜', category: 'chinese', hours: weekday('11:00', '21:00', [3]) },
  { number: 11, name: 'Bamboo Noodles', nameZh: '手工竹升面', category: 'noodles', hours: weekday('07:00', '15:00') },
].map((s, i) => ({
  type: 'normal',
  description: '',
  descriptionZh: '',
  phone: '',
  photo: '',
  override: null,
  ownerUid: '',
  ownerEmail: '',
  mixedRice: s.type === 'mixedRice'
    ? {
      note: '',
      prices: [],
    }
    : null,
  block: [
    { x: 2.5, y: 2, w: 7, h: 2 },
    { x: 2.5, y: 9, w: 3, h: 12 },
    { x: 11.5, y: 13.5, w: 3, h: 3 },
    { x: 16.5, y: 1.5, w: 9, h: 3 },
    { x: 11.5, y: 18, w: 3, h: 4 },
    { x: 17, y: 18, w: 3, h: 4 },
    { x: 17, y: 13, w: 3, h: 4 },
    { x: 23.5, y: 18.5, w: 3, h: 3 },
    { x: 23.5, y: 15, w: 3, h: 3 },
    { x: 23.5, y: 11.5, w: 3, h: 3 },
    { x: 23.5, y: 8, w: 3, h: 3 },
  ][i],
  ...s,
}));

// Example dishes so the website looks complete for a first demonstration.
// Prices and dishes are only examples: stall owners replace them.
const m = (name, nameZh, price, pic, description, extra = {}) =>
  ({ name, nameZh, price, pic, description, available: true, section: '', ...extra });

const SAMPLE = {};

export function sampleItems(stallNumber) {
  return [];
}
