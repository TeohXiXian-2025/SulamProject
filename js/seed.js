// Starter data from the Kim Seng floor plan supplied by Digital Niaga.

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
    // The reference plan is approximately 28 by 24 units; its stall sizes
    // and positions are approximate, but the arrangement follows the plan.
    cols: 28,
    rows: 24,
    extras: [
      { id: 'wall-north', type: 'wall', x: 0, y: 0, w: 28, h: 0.3 },
      { id: 'wall-west', type: 'wall', x: 0, y: 0.3, w: 0.3, h: 23.4 },
      { id: 'wall-east-north', type: 'wall', x: 27.7, y: 0.3, w: 0.3, h: 4.2 },
      { id: 'wall-east-south', type: 'wall', x: 27.7, y: 7.5, w: 0.3, h: 16.2 },
      { id: 'wall-south-west', type: 'wall', x: 0, y: 23.7, w: 4.5, h: 0.3 },
      { id: 'wall-south-east', type: 'wall', x: 24, y: 23.7, w: 4, h: 0.3 },
      { id: 'entrance-east', type: 'entrance', x: 26.7, y: 5.3, w: 1.3, h: 1 },
      { id: 'entrance-south', type: 'entrance', x: 7, y: 23, w: 2, h: 1 },
      { id: 'beverage-counter', type: 'counter', x: 11.5, y: 1.5, w: 3, h: 3 },
      { id: 'toilet', type: 'toilet', x: 10.9, y: 0.4, w: 2.2, h: 1.1 },
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
  { number: 1, name: 'Kim Seng Beverage Station', nameZh: '金城茶水', category: 'drinks', hours: weekday('06:30', '22:00') },
  { number: 2, name: 'Kim Seng Mixed Rice', nameZh: '金城杂菜饭', category: 'mixedRice', type: 'mixedRice', hours: weekday('10:30', '15:00', [0]) },
  { number: 3, name: 'Kim Seng Pau Station', nameZh: '金城包点', category: 'other', hours: weekday('11:00', '22:00', [2]) },
  { number: 4, name: 'Kim Seng Stir-fry Stall', nameZh: '金城大炒', category: 'cookedFood', hours: weekday('07:00', '14:00', [1]) },
  { number: 5, name: 'Gui Zhou Flavor', nameZh: '中国贵州风味', category: 'chinese', hours: weekday('07:00', '13:00', [3]) },
  { number: 6, name: 'Broth Noodle', nameZh: '等一等猪肉粉', category: 'noodles', hours: weekday('07:30', '15:00', [4]) },
  { number: 7, name: 'Ah Sai Chicken Rice', nameZh: '港式烧腊', category: 'chickenRice', hours: weekday('07:00', '14:00', [1]) },
  { number: 8, name: 'Sarawak Kuching Kolo Mee Stall', nameZh: '砂劳越手工客家面', category: 'noodles', hours: weekday('10:00', '20:00', [5]) },
  { number: 9, name: 'Pan Mee Stall', nameZh: '不一样的板面', category: 'panMee', hours: weekday('11:00', '20:00', [0]) },
  { number: 10, name: 'Porridge Stall', nameZh: '粥品', category: 'porridge', hours: weekday('11:00', '21:00', [3]) },
  { number: 11, name: 'Handmade Bamboo Noodles', nameZh: '发练记手工竹升面', category: 'noodles', hours: weekday('07:00', '15:00') },
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

// The live project still has the original 10-stall starter map. Only offer a
// one-time migration when that map is untouched; never overwrite an edited map.
export function kimSengLayoutMigration(centre, stores) {
  const floor = centre?.floor;
  const oldExtras = [
    { id: 'e1', type: 'entrance', x: 9, y: 11, w: 2, h: 1 },
    ...[[2, 4], [6, 4], [12, 4], [16, 4], [2, 7], [6, 7], [12, 7], [16, 7]]
      .map(([x, y], i) => ({ id: `t${i + 1}`, type: 'table', x, y, w: 2, h: 1 })),
    { id: 'p1', type: 'toilet', x: 19, y: 5, w: 1, h: 2 },
  ];
  const sameRect = (a, b) => a && ['x', 'y', 'w', 'h'].every((key) => a[key] === b[key]);
  if (floor?.cols !== 20 || floor.rows !== 12 || floor.extras?.length !== oldExtras.length
    || !floor.extras.every((extra, i) => extra.id === oldExtras[i].id
      && extra.type === oldExtras[i].type && sameRect(extra, oldExtras[i]))
    || stores?.length !== 10) return null;

  const oldNames = ['Beverage', 'Economy Mixed Rice', 'Masakan Panas', 'Noodles', 'Porridge',
    'Pan Mee', 'Wantan Mee', 'Chicken Rice', 'Soup', 'China Cuisine'];
  const oldNamesZh = ['饮料', '经济饭', '煮炒', '面食', '粥', '板面', '云吞面', '鸡饭', '汤', '中国菜'];
  const oldCategories = ['drinks', 'mixedRice', 'cookedFood', 'noodles', 'porridge',
    'panMee', 'wantanMee', 'chickenRice', 'soup', 'chinese'];
  const patches = {};
  for (let i = 0; i < 10; i++) {
    const current = stores.find((store) => Number(store.number) === i + 1);
    const expected = i < 5
      ? { x: 1 + i * 4, y: 0, w: 3, h: 2 }
      : { x: 1 + (i - 5) * 4, y: 9, w: 3, h: 2 };
    if (!current || !sameRect(current.block, expected)) return null;
    const starter = STARTER_STORES[i];
    patches[current.id] = { block: starter.block };
    if (current.name === oldNames[i]) patches[current.id].name = starter.name;
    if (current.nameZh === oldNamesZh[i]) patches[current.id].nameZh = starter.nameZh;
    if (current.category === oldCategories[i]) patches[current.id].category = starter.category;
  }
  return { floor: DEFAULT_CENTRE.floor, patches, newStore: STARTER_STORES[10] };
}
