// Starter data: the shop, its 10 stalls, a default floor plan
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
    cols: 20,
    rows: 12,
    extras: [
      { id: 'e1', type: 'entrance', x: 9, y: 11, w: 2, h: 1 },
      { id: 't1', type: 'table', x: 2, y: 4, w: 2, h: 1 },
      { id: 't2', type: 'table', x: 6, y: 4, w: 2, h: 1 },
      { id: 't3', type: 'table', x: 12, y: 4, w: 2, h: 1 },
      { id: 't4', type: 'table', x: 16, y: 4, w: 2, h: 1 },
      { id: 't5', type: 'table', x: 2, y: 7, w: 2, h: 1 },
      { id: 't6', type: 'table', x: 6, y: 7, w: 2, h: 1 },
      { id: 't7', type: 'table', x: 12, y: 7, w: 2, h: 1 },
      { id: 't8', type: 'table', x: 16, y: 7, w: 2, h: 1 },
      { id: 'p1', type: 'toilet', x: 19, y: 5, w: 1, h: 2 },
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
  // Stalls 1–5 along the top wall, 6–10 along the bottom wall.
  block: i < 5 ? { x: 1 + i * 4, y: 0, w: 3, h: 2 } : { x: 1 + (i - 5) * 4, y: 9, w: 3, h: 2 },
  ...s,
}));

export function sampleItems(stallNumber) {
  return [];
}
