// Starter data: the 10 stalls of Kim Seng and a default floor plan.
// The admin can load these with one click and then edit everything.

const weekday = (open, close, offDays = []) =>
  [0, 1, 2, 3, 4, 5, 6].map((d) => (offDays.includes(d) ? null : { open, close }));

export const DEFAULT_CENTRE = {
  name: 'Kim Seng Hawker Centre',
  nameZh: '金成小贩中心',
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
    ? { prices: [
      { label: '1 meat + 2 veg', labelZh: '一肉两菜', price: 7 },
      { label: '2 meat + 1 veg', labelZh: '两肉一菜', price: 9 },
      { label: 'Extra veg', labelZh: '加菜', price: 1.5 },
      { label: 'Extra meat', labelZh: '加肉', price: 3 },
    ] }
    : null,
  // Stalls 1–5 along the top wall, 6–10 along the bottom wall.
  block: i < 5 ? { x: 1 + i * 4, y: 0, w: 3, h: 2 } : { x: 1 + (i - 5) * 4, y: 9, w: 3, h: 2 },
  ...s,
}));

// A few example foods so the demo is not empty.
export const DEMO_ITEMS = {
  1: [
    { name: 'Kopi O', nameZh: '咖啡乌', price: 1.8, section: 'Hot', sectionZh: '热' },
    { name: 'Teh Tarik', nameZh: '拉茶', price: 2.2, section: 'Hot', sectionZh: '热' },
    { name: 'Iced Milo', nameZh: '冰美禄', price: 3.2, section: 'Cold', sectionZh: '冷' },
    { name: 'Barley', nameZh: '薏米水', price: 2, section: 'Cold', sectionZh: '冷', available: false },
  ],
  2: [
    { name: 'Sweet & sour pork', nameZh: '咕咾肉', kind: 'meat' },
    { name: 'Curry chicken', nameZh: '咖喱鸡', kind: 'meat' },
    { name: 'Stir-fried cabbage', nameZh: '炒包菜', kind: 'veg' },
    { name: 'Long beans', nameZh: '炒长豆', kind: 'veg' },
    { name: 'Steamed egg', nameZh: '蒸蛋', kind: 'egg' },
    { name: 'Fried fish', nameZh: '炸鱼', kind: 'fish' },
  ],
  4: [
    { name: 'Curry mee', nameZh: '咖喱面', price: 9 },
    { name: 'Fried kuey teow', nameZh: '炒粿条', price: 8.5 },
  ],
  8: [
    { name: 'Roasted chicken rice', nameZh: '烧鸡饭', price: 8 },
    { name: 'Steamed chicken rice', nameZh: '白斩鸡饭', price: 8 },
    { name: 'Char siu rice', nameZh: '叉烧饭', price: 9 },
  ],
};
