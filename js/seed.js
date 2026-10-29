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
      prices: [
        { label: '1 meat + 2 veg', labelZh: '一肉两菜', price: 7 },
        { label: '2 meat + 1 veg', labelZh: '两肉一菜', price: 9 },
        { label: 'Extra veg', labelZh: '加菜', price: 1.5 },
        { label: 'Extra meat', labelZh: '加肉', price: 3 },
      ],
    }
    : null,
  // Stalls 1–5 along the top wall, 6–10 along the bottom wall.
  block: i < 5 ? { x: 1 + i * 4, y: 0, w: 3, h: 2 } : { x: 1 + (i - 5) * 4, y: 9, w: 3, h: 2 },
  ...s,
}));

// Example dishes so the website looks complete for a first demonstration.
// Prices and dishes are only examples: stall owners replace them.
const m = (name, nameZh, price, pic, description, extra = {}) =>
  ({ name, nameZh, price, pic, description, available: true, section: '', ...extra });

const SAMPLE = {
  1: [
    m('Kopi O', '咖啡乌', 1.8, 'kopiHot', 'Strong local black coffee with sugar.', { section: 'Hot', sectionZh: '热饮' }),
    m('Teh Tarik', '拉茶', 2.2, 'tehHot', 'Pulled milk tea, smooth and frothy.', { section: 'Hot', sectionZh: '热饮' }),
    m('Kopi Peng', '咖啡冰', 2.8, 'kopi', 'Iced coffee with condensed milk.', { section: 'Cold', sectionZh: '冷饮' }),
    m('Milo Dinosaur', '美禄恐龙', 4.5, 'milo', 'Iced Milo topped with extra Milo powder.', { section: 'Cold', sectionZh: '冷饮' }),
    m('Barley', '薏米水', 2.0, 'barley', 'Homemade barley drink, lightly sweet.', { section: 'Cold', sectionZh: '冷饮', available: false }),
  ],
  2: [
    m('Sweet & sour pork', '咕咾肉', null, 'sweetSour', '', { kind: 'meat' }),
    m('Curry chicken', '咖喱鸡', null, 'curry', '', { kind: 'meat' }),
    m('Fried fish', '炸鱼', null, 'fish', '', { kind: 'fish' }),
    m('Stir-fried cabbage', '炒包菜', null, 'veg', '', { kind: 'veg' }),
    m('Long beans', '炒长豆', null, 'beans', '', { kind: 'veg' }),
    m('Steamed egg', '蒸蛋', null, 'egg', '', { kind: 'egg' }),
    m('Braised tofu', '卤豆腐', null, 'tofu', '', { kind: 'egg' }),
  ],
  3: [
    m('Kung pao chicken', '宫保鸡丁', 12, 'wok', 'Wok-fried chicken with dried chilli and cashew.'),
    m('Sweet & sour fish', '酸甜鱼', 18, 'fish', 'Crispy fish fillet in tangy sweet and sour sauce.'),
    m('Egg fried rice', '蛋炒饭', 7.5, 'friedRice', 'Fragrant wok-fried rice with egg and spring onion.'),
    m('Kangkung belacan', '马来风光', 8, 'kangkung', 'Water spinach fried with spicy shrimp paste.', { available: false }),
  ],
  4: [
    m('Curry mee', '咖喱面', 9, 'curryMee', 'Yellow noodles in rich coconut curry with tofu puff.'),
    m('Fried kuey teow', '炒粿条', 8.5, 'kueyTeow', 'Flat rice noodles fried with prawns, cockles and egg.'),
    m('Hokkien mee', '福建面', 9, 'hokkien', 'Thick noodles braised in dark soy sauce.'),
  ],
  5: [
    m('Fish porridge', '鱼片粥', 8, 'porridge', 'Smooth rice porridge with fresh fish slices and ginger.'),
    m('Century egg pork porridge', '皮蛋瘦肉粥', 7, 'centuryEgg', 'Classic porridge with century egg and minced pork.'),
  ],
  6: [
    m('Chilli pan mee (dry)', '辣椒板面', 9, 'panMeeDry', 'Hand-made noodles with fried chilli, egg and anchovies.'),
    m('Soup pan mee', '汤板面', 8, 'panMeeSoup', 'Torn noodles in anchovy soup with sweet potato leaves.'),
  ],
  7: [
    m('Wantan mee (dry)', '干捞云吞面', 8, 'wantanMee', 'Springy egg noodles with char siu and wantan.'),
    m('Char siu wantan mee', '叉烧云吞面', 9, 'charSiu', 'Extra char siu with dumpling soup on the side.'),
  ],
  8: [
    m('Roasted chicken rice', '烧鸡饭', 8, 'roastChicken', 'Crispy-skin roast chicken on rice cooked in chicken broth, with cucumber and chilli sauce.'),
    m('Steamed chicken rice', '白斩鸡饭', 8, 'steamChicken', 'Smooth poached chicken with soy-sesame sauce and ginger paste.'),
    m('Char siu rice', '叉烧饭', 9, 'charSiu', 'Honey-glazed barbecued pork on fragrant rice.', { available: false }),
  ],
  9: [
    m('ABC soup', '罗宋汤', 7, 'soup', 'Home-style soup with potato, carrot, tomato and pork ribs.'),
    m('Herbal chicken soup', '药材鸡汤', 12, 'herbalSoup', 'Slow-cooked chicken with Chinese herbs and red dates.'),
  ],
  10: [
    m('Mapo tofu', '麻婆豆腐', 10, 'mapoTofu', 'Soft tofu in spicy Sichuan bean sauce.'),
    m('Sweet & sour pork', '咕咾肉', 14, 'sweetSour', 'Crispy pork with pineapple, peppers and onion.'),
  ],
};

export function sampleItems(stallNumber) {
  return (SAMPLE[stallNumber] || []).map(({ pic, ...it }, i) => ({ ...it, photo: art(pic), createdAt: i }));
}
