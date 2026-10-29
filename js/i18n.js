// Interface text in English, Chinese and Malay.
// Store and food names are typed by the owners themselves (with an optional
// Chinese name), so only the fixed interface text lives here.

const dict = {
  en: {
    centreName: 'Kim Seng Hawker Centre',
    ownerEmailHint: 'Gmail: the stall owner simply taps "Sign in with Google" — no password. Other email: they get an email link to set their own password.',
    sendSetPw: 'Send set-password email', setPwSent: 'Email sent — the stall owner sets their own password from the link.',
    verifyHint: 'If the manager added your email to a stall, verify your email first:', verifyEmail: 'Send verification email',
    verifySent: 'Verification email sent. Open the link, then come back.', iVerified: 'I have verified',
    notVerifiedYet: 'Not verified yet. Open the link in your email first.',
    stalls: 'Stalls', floorPlan: 'Floor Plan', open: 'Open', closed: 'Closed',
    openNow: 'Open now', closedNow: 'Closed now', allStalls: 'All stalls',
    search: 'Search stall…', stallNo: 'Stall', menu: 'Menu',
    soldOut: 'Sold out', available: 'Available', reviews: 'Reviews',
    noReviews: 'No reviews yet. Be the first!', writeReview: 'Write a review',
    yourReview: 'Your review', signInToReview: 'Sign in with Google to review',
    submit: 'Submit', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit',
    add: 'Add', back: 'Back', close: 'Close', signOut: 'Sign out', signIn: 'Sign in',
    showOnMap: 'Show on floor plan', viewMenu: 'View menu',
    openingHours: 'Opening hours', closesAt: 'Closes at {t}', opensAt: 'Opens at {t}',
    opensOn: 'Opens {d} {t}', closedToday: 'Closed today', closedUntil: 'Closed until {d}',
    centreClosed: 'Hawker centre is closed', byOwner: 'Announced by stall owner',
    tempNote: 'Note', dayOff: 'Closed',
    mixedRiceGuide: 'Price guide', mixedRiceDishes: 'Dishes usually cooked',
    mixedRiceNote: 'Dishes change every day. This list is only an estimate — please check at the stall.',
    kind_meat: 'Meat', kind_veg: 'Vegetable', kind_egg: 'Egg / Tofu', kind_fish: 'Fish / Seafood', kind_other: 'Others',
    tapStall: 'Tap a stall to see where it is', entrance: 'Entrance', table: 'Tables',
    wall: 'Wall', toilet: 'Toilet', sink: 'Sink', pillar: 'Pillar',
    reviewsCount: '{n} review(s)', ratingRequired: 'Please choose a star rating',
    reviewSaved: 'Thank you! Review saved.', reviewDeleted: 'Review deleted',
    deleteMyReview: 'Delete my review', other: 'Other', loading: 'Loading…',
    notFound: 'Stall not found', demoBanner: 'Demo mode — data is saved only in this browser.',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    cat_drinks: 'Beverages', cat_mixedRice: 'Mixed Rice', cat_cookedFood: 'Masakan Panas',
    cat_noodles: 'Noodles', cat_porridge: 'Porridge', cat_panMee: 'Pan Mee',
    cat_wantanMee: 'Wantan Mee', cat_chickenRice: 'Chicken Rice', cat_soup: 'Soup',
    cat_chinese: 'Chinese Cuisine', cat_dessert: 'Dessert', cat_other: 'Others',
    // Owner / admin
    ownerTitle: 'Stall Owner', adminTitle: 'Hawker Centre Admin',
    email: 'Email', password: 'Password', forgotPassword: 'Forgot password?',
    signInGoogle: 'Sign in with Google', resetSent: 'Password reset email sent.',
    status: 'Status', storeInfo: 'Stall info', today: 'Today',
    followSchedule: 'Follow schedule', openToday: 'Open now (today)',
    closeToday: 'Closed today', closeUntil: 'Closed until…', currently: 'Currently',
    noteOptional: 'Note for customers (optional)', saved: 'Saved', deleted: 'Deleted',
    name: 'Name', nameZh: 'Chinese name (optional)', description: 'Description',
    descriptionZh: 'Chinese description (optional)', phone: 'Phone (optional)',
    photo: 'Photo', changePhoto: 'Change photo', removePhoto: 'Remove photo',
    price: 'Price (RM)', section: 'Section (e.g. Noodles, Drinks)', addFood: 'Add food',
    editFood: 'Edit food', kind: 'Type', confirmDelete: 'Delete "{x}"? This cannot be undone.',
    noStoreLinked: 'This account is not linked to any stall yet.',
    giveIdToAdmin: 'Ask the hawker centre manager to link this account ID to your stall:',
    priceRow: 'e.g. 1 meat', addRow: 'Add row', chooseStall: 'Choose stall',
    changePassword: 'Change password', newPassword: 'New password (min 6 characters)',
    passwordChanged: 'Password changed',
    averageRating: 'Average rating', hoursHint: 'Leave both times empty for a day off. Closing after midnight is OK.',
    centre: 'Hawker centre', announcement: 'Announcement (shown at the top of the site)',
    addStall: 'Add stall', stallNumber: 'Stall / block number', category: 'Category',
    mixedRiceMode: 'Economy mixed rice stall (price guide + estimated dishes)',
    ownerAccount: 'Owner login', createLogin: 'Create login', linkById: 'Link existing account ID',
    ownerEmail: 'Owner email', ownerPassword: 'Starting password',
    unlink: 'Unlink', linkedTo: 'Linked to {x}', notLinked: 'No owner login yet',
    numberTaken: 'Number {n} is already used by another stall', qrCodes: 'QR codes',
    admins: 'Admins', adminEmails: 'Admin Google emails (one per line)',
    claimAdminTitle: 'First-time setup', claimAdminText: 'No admin exists yet. Make {x} the admin of this website?',
    claimAdminBtn: 'Yes, make me admin', notAdmin: '{x} is not an admin of this website.',
    starterStalls: 'Add the 10 starter stalls', starterDone: 'Starter stalls added',
    editorHelp: 'Drag blocks to move them. Select a block to rotate or resize it. Press Save when done.',
    addObject: 'Add', rotate: 'Rotate', wider: 'Wider', narrower: 'Narrower', longer: 'Longer', shorter: 'Shorter',
    saveLayout: 'Save layout', layoutSaved: 'Floor plan saved', gridSize: 'Grid size',
    columns: 'Columns', rows: 'Rows', topView: 'Top view', view3d: '3D view', overlap: 'Blocks cannot overlap',
    renumber: 'Renumber 1…N', unsaved: 'Unsaved changes',
    qrPoster: 'Poster', qrTables: 'Table cards', qrStores: 'Stall cards', siteUrl: 'Website address',
    print: 'Print', tableCount: 'How many tables', scanFor: 'Scan for stalls, menus & opening status',
    tableLabel: 'Table {n}', manageReviews: 'Reviews', ownerPage: 'Stall owner login', adminPage: 'Admin',
  },
  zh: {
    centreName: '金成小贩中心',
    ownerEmailHint: 'Gmail：档主直接按「用 Google 登录」，不用密码。其他电邮：档主会收到电邮链接，自己设定密码。',
    sendSetPw: '发送设定密码电邮', setPwSent: '电邮已发送 — 档主可通过链接自己设定密码。',
    verifyHint: '如果管理员已把你的电邮加到档口，请先验证电邮：', verifyEmail: '发送验证电邮',
    verifySent: '验证电邮已发送。打开链接后再回来。', iVerified: '我已验证',
    notVerifiedYet: '还没验证。请先打开电邮里的链接。',
    stalls: '档口', floorPlan: '平面图', open: '营业中', closed: '休息',
    openNow: '营业中', closedNow: '休息中', allStalls: '全部档口',
    search: '搜索档口…', stallNo: '档口', menu: '菜单',
    soldOut: '已售完', available: '有供应', reviews: '评价',
    noReviews: '暂无评价，来写第一个吧！', writeReview: '写评价',
    yourReview: '你的评价', signInToReview: '用 Google 登录后评价',
    submit: '提交', cancel: '取消', save: '保存', delete: '删除', edit: '编辑',
    add: '添加', back: '返回', close: '关闭', signOut: '登出', signIn: '登录',
    showOnMap: '在平面图显示', viewMenu: '看菜单',
    openingHours: '营业时间', closesAt: '{t} 打烊', opensAt: '{t} 开档',
    opensOn: '{d} {t} 开档', closedToday: '今天休息', closedUntil: '休息至 {d}',
    centreClosed: '小贩中心休息', byOwner: '档主通知',
    tempNote: '备注', dayOff: '休息',
    mixedRiceGuide: '价格参考', mixedRiceDishes: '常煮菜色',
    mixedRiceNote: '菜色每天不同，此列表仅供参考，请以档口实际为准。',
    kind_meat: '肉类', kind_veg: '蔬菜', kind_egg: '蛋 / 豆腐', kind_fish: '鱼 / 海鲜', kind_other: '其他',
    tapStall: '点击档口查看位置', entrance: '入口', table: '桌子',
    wall: '墙', toilet: '厕所', sink: '洗手盆', pillar: '柱子',
    reviewsCount: '{n} 条评价', ratingRequired: '请选择星级',
    reviewSaved: '谢谢！评价已保存。', reviewDeleted: '评价已删除',
    deleteMyReview: '删除我的评价', other: '其他', loading: '加载中…',
    notFound: '找不到档口', demoBanner: '演示模式 — 资料只保存在此浏览器。',
    days: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    cat_drinks: '饮料', cat_mixedRice: '经济饭', cat_cookedFood: '煮炒',
    cat_noodles: '面食', cat_porridge: '粥', cat_panMee: '板面',
    cat_wantanMee: '云吞面', cat_chickenRice: '鸡饭', cat_soup: '汤',
    cat_chinese: '中国菜', cat_dessert: '甜品', cat_other: '其他',
    ownerTitle: '档主', adminTitle: '小贩中心管理',
    email: '电邮', password: '密码', forgotPassword: '忘记密码？',
    signInGoogle: '用 Google 登录', resetSent: '重设密码电邮已发送。',
    status: '营业状态', storeInfo: '档口资料', today: '今天',
    followSchedule: '按营业时间', openToday: '现在营业（今天）',
    closeToday: '今天休息', closeUntil: '休息至…', currently: '目前',
    noteOptional: '给顾客的备注（可选）', saved: '已保存', deleted: '已删除',
    name: '名称', nameZh: '中文名（可选）', description: '介绍',
    descriptionZh: '中文介绍（可选）', phone: '电话（可选）',
    photo: '照片', changePhoto: '换照片', removePhoto: '移除照片',
    price: '价格 (RM)', section: '分类（例如：面、饮料）', addFood: '添加食物',
    editFood: '编辑食物', kind: '类型', confirmDelete: '删除「{x}」？此操作无法恢复。',
    noStoreLinked: '此账号还没有连接任何档口。',
    giveIdToAdmin: '请把这个账号 ID 交给小贩中心管理员，连接到你的档口：',
    priceRow: '例如：一肉', addRow: '加一行', chooseStall: '选择档口',
    changePassword: '更改密码', newPassword: '新密码（至少 6 个字）',
    passwordChanged: '密码已更改',
    averageRating: '平均评分', hoursHint: '两个时间都留空 = 当天休息。可以营业到午夜后。',
    centre: '小贩中心', announcement: '公告（显示在网站顶部）',
    addStall: '添加档口', stallNumber: '档口 / 方块编号', category: '类别',
    mixedRiceMode: '经济饭档（价格参考 + 预计菜色）',
    ownerAccount: '档主登录', createLogin: '创建登录', linkById: '连接现有账号 ID',
    ownerEmail: '档主电邮', ownerPassword: '初始密码',
    unlink: '取消连接', linkedTo: '已连接 {x}', notLinked: '还没有档主登录',
    numberTaken: '编号 {n} 已被其他档口使用', qrCodes: '二维码',
    admins: '管理员', adminEmails: '管理员 Google 电邮（每行一个）',
    claimAdminTitle: '首次设置', claimAdminText: '目前没有管理员。要把 {x} 设为本网站管理员吗？',
    claimAdminBtn: '是，设我为管理员', notAdmin: '{x} 不是本网站的管理员。',
    starterStalls: '添加 10 个初始档口', starterDone: '已添加初始档口',
    editorHelp: '拖动方块来移动。选中方块可旋转或调整大小。完成后按保存。',
    addObject: '添加', rotate: '旋转', wider: '加宽', narrower: '变窄', longer: '加长', shorter: '变短',
    saveLayout: '保存平面图', layoutSaved: '平面图已保存', gridSize: '网格大小',
    columns: '列', rows: '行', topView: '俯视', view3d: '3D', overlap: '方块不能重叠',
    renumber: '重新编号 1…N', unsaved: '有未保存的更改',
    qrPoster: '海报', qrTables: '桌卡', qrStores: '档口卡', siteUrl: '网站地址',
    print: '打印', tableCount: '桌子数量', scanFor: '扫码查看档口、菜单和营业状态',
    tableLabel: '{n} 号桌', manageReviews: '评价', ownerPage: '档主登录', adminPage: '管理',
  },
  ms: {
    centreName: 'Pusat Penjaja Kim Seng',
    ownerEmailHint: 'Gmail: pemilik gerai hanya tekan "Log masuk dengan Google" — tiada kata laluan. E-mel lain: mereka terima pautan e-mel untuk tetapkan kata laluan sendiri.',
    sendSetPw: 'Hantar e-mel tetapkan kata laluan', setPwSent: 'E-mel dihantar — pemilik gerai tetapkan kata laluan sendiri melalui pautan.',
    verifyHint: 'Jika pengurus telah menambah e-mel anda ke gerai, sahkan e-mel anda dahulu:', verifyEmail: 'Hantar e-mel pengesahan',
    verifySent: 'E-mel pengesahan dihantar. Buka pautan, kemudian kembali.', iVerified: 'Saya sudah sahkan',
    notVerifiedYet: 'Belum disahkan. Buka pautan dalam e-mel dahulu.',
    stalls: 'Gerai', floorPlan: 'Pelan Lantai', open: 'Buka', closed: 'Tutup',
    openNow: 'Buka sekarang', closedNow: 'Tutup sekarang', allStalls: 'Semua gerai',
    search: 'Cari gerai…', stallNo: 'Gerai', menu: 'Menu',
    soldOut: 'Habis', available: 'Ada', reviews: 'Ulasan',
    noReviews: 'Belum ada ulasan. Jadilah yang pertama!', writeReview: 'Tulis ulasan',
    yourReview: 'Ulasan anda', signInToReview: 'Log masuk dengan Google untuk mengulas',
    submit: 'Hantar', cancel: 'Batal', save: 'Simpan', delete: 'Padam', edit: 'Ubah',
    add: 'Tambah', back: 'Kembali', close: 'Tutup', signOut: 'Log keluar', signIn: 'Log masuk',
    showOnMap: 'Tunjuk di pelan lantai', viewMenu: 'Lihat menu',
    openingHours: 'Waktu operasi', closesAt: 'Tutup pada {t}', opensAt: 'Buka pada {t}',
    opensOn: 'Buka {d} {t}', closedToday: 'Tutup hari ini', closedUntil: 'Tutup sehingga {d}',
    centreClosed: 'Pusat penjaja ditutup', byOwner: 'Makluman pemilik gerai',
    tempNote: 'Nota', dayOff: 'Tutup',
    mixedRiceGuide: 'Panduan harga', mixedRiceDishes: 'Lauk yang biasa dimasak',
    mixedRiceNote: 'Lauk bertukar setiap hari. Senarai ini hanya anggaran — sila semak di gerai.',
    kind_meat: 'Daging', kind_veg: 'Sayur', kind_egg: 'Telur / Tauhu', kind_fish: 'Ikan / Makanan laut', kind_other: 'Lain-lain',
    tapStall: 'Tekan gerai untuk lihat lokasinya', entrance: 'Pintu masuk', table: 'Meja',
    wall: 'Dinding', toilet: 'Tandas', sink: 'Sinki', pillar: 'Tiang',
    reviewsCount: '{n} ulasan', ratingRequired: 'Sila pilih bintang',
    reviewSaved: 'Terima kasih! Ulasan disimpan.', reviewDeleted: 'Ulasan dipadam',
    deleteMyReview: 'Padam ulasan saya', other: 'Lain-lain', loading: 'Memuatkan…',
    notFound: 'Gerai tidak dijumpai', demoBanner: 'Mod demo — data hanya disimpan dalam pelayar ini.',
    days: ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
    cat_drinks: 'Minuman', cat_mixedRice: 'Nasi Campur', cat_cookedFood: 'Masakan Panas',
    cat_noodles: 'Mi', cat_porridge: 'Bubur', cat_panMee: 'Pan Mee',
    cat_wantanMee: 'Wantan Mee', cat_chickenRice: 'Nasi Ayam', cat_soup: 'Sup',
    cat_chinese: 'Masakan Cina', cat_dessert: 'Pencuci mulut', cat_other: 'Lain-lain',
    ownerTitle: 'Pemilik Gerai', adminTitle: 'Admin Pusat Penjaja',
    email: 'E-mel', password: 'Kata laluan', forgotPassword: 'Lupa kata laluan?',
    signInGoogle: 'Log masuk dengan Google', resetSent: 'E-mel set semula kata laluan dihantar.',
    status: 'Status', storeInfo: 'Maklumat gerai', today: 'Hari ini',
    followSchedule: 'Ikut jadual', openToday: 'Buka sekarang (hari ini)',
    closeToday: 'Tutup hari ini', closeUntil: 'Tutup sehingga…', currently: 'Sekarang',
    noteOptional: 'Nota untuk pelanggan (pilihan)', saved: 'Disimpan', deleted: 'Dipadam',
    name: 'Nama', nameZh: 'Nama Cina (pilihan)', description: 'Penerangan',
    descriptionZh: 'Penerangan Cina (pilihan)', phone: 'Telefon (pilihan)',
    photo: 'Gambar', changePhoto: 'Tukar gambar', removePhoto: 'Buang gambar',
    price: 'Harga (RM)', section: 'Bahagian (cth. Mi, Minuman)', addFood: 'Tambah makanan',
    editFood: 'Ubah makanan', kind: 'Jenis', confirmDelete: 'Padam "{x}"? Tindakan ini tidak boleh dibatalkan.',
    noStoreLinked: 'Akaun ini belum dipautkan ke mana-mana gerai.',
    giveIdToAdmin: 'Minta pengurus pusat penjaja memautkan ID akaun ini ke gerai anda:',
    priceRow: 'cth. 1 daging', addRow: 'Tambah baris', chooseStall: 'Pilih gerai',
    changePassword: 'Tukar kata laluan', newPassword: 'Kata laluan baru (min 6 aksara)',
    passwordChanged: 'Kata laluan ditukar',
    averageRating: 'Purata penilaian', hoursHint: 'Biarkan kedua-dua masa kosong untuk hari cuti. Tutup selepas tengah malam boleh.',
    centre: 'Pusat penjaja', announcement: 'Pengumuman (dipaparkan di atas laman)',
    addStall: 'Tambah gerai', stallNumber: 'Nombor gerai / blok', category: 'Kategori',
    mixedRiceMode: 'Gerai nasi campur (panduan harga + anggaran lauk)',
    ownerAccount: 'Log masuk pemilik', createLogin: 'Cipta log masuk', linkById: 'Pautkan ID akaun sedia ada',
    ownerEmail: 'E-mel pemilik', ownerPassword: 'Kata laluan permulaan',
    unlink: 'Nyahpaut', linkedTo: 'Dipautkan ke {x}', notLinked: 'Belum ada log masuk pemilik',
    numberTaken: 'Nombor {n} sudah digunakan oleh gerai lain', qrCodes: 'Kod QR',
    admins: 'Admin', adminEmails: 'E-mel Google admin (satu setiap baris)',
    claimAdminTitle: 'Persediaan kali pertama', claimAdminText: 'Belum ada admin. Jadikan {x} admin laman ini?',
    claimAdminBtn: 'Ya, jadikan saya admin', notAdmin: '{x} bukan admin laman ini.',
    starterStalls: 'Tambah 10 gerai permulaan', starterDone: 'Gerai permulaan ditambah',
    editorHelp: 'Seret blok untuk mengalihkannya. Pilih blok untuk putar atau ubah saiz. Tekan Simpan apabila siap.',
    addObject: 'Tambah', rotate: 'Putar', wider: 'Lebar', narrower: 'Sempit', longer: 'Panjang', shorter: 'Pendek',
    saveLayout: 'Simpan pelan', layoutSaved: 'Pelan lantai disimpan', gridSize: 'Saiz grid',
    columns: 'Lajur', rows: 'Baris', topView: 'Pandangan atas', view3d: '3D', overlap: 'Blok tidak boleh bertindih',
    renumber: 'Nombor semula 1…N', unsaved: 'Ada perubahan belum disimpan',
    qrPoster: 'Poster', qrTables: 'Kad meja', qrStores: 'Kad gerai', siteUrl: 'Alamat laman web',
    print: 'Cetak', tableCount: 'Berapa meja', scanFor: 'Imbas untuk gerai, menu & status buka',
    tableLabel: 'Meja {n}', manageReviews: 'Ulasan', ownerPage: 'Log masuk pemilik gerai', adminPage: 'Admin',
  },
};

export const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ms', label: 'BM' },
];

function initialLang() {
  try {
    const saved = localStorage.getItem('kimseng-lang');
    if (saved && dict[saved]) return saved;
  } catch { /* storage blocked */ }
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ms')) return 'ms';
  return 'en';
}

let lang = initialLang();
document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;

export function getLang() { return lang; }

export function setLang(code) {
  if (!dict[code] || code === lang) return;
  lang = code;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  try { localStorage.setItem('kimseng-lang', code); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('langchange'));
}

export function t(key, vars) {
  let s = dict[lang][key] ?? dict.en[key] ?? key;
  if (vars && typeof s === 'string') {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

// Picks the right language for owner-typed text that has an optional
// Chinese version (e.g. name / nameZh).
export function pick(obj, field = 'name') {
  if (!obj) return '';
  const zh = obj[`${field}Zh`];
  return lang === 'zh' ? (zh || obj[field] || '') : (obj[field] || zh || '');
}

// Secondary line: the other-language name, when it exists and differs.
export function pickAlt(obj, field = 'name') {
  if (!obj) return '';
  const main = pick(obj, field);
  const alt = lang === 'zh' ? obj[field] : obj[`${field}Zh`];
  return alt && alt !== main ? alt : '';
}

export function langSwitcher() {
  return `<div class="lang-switch" role="group" aria-label="Language">${LANGS.map((l) =>
    `<button type="button" data-lang="${l.code}" class="${l.code === lang ? 'active' : ''}">${l.label}</button>`).join('')}</div>`;
}

export function bindLangSwitcher(root = document) {
  root.querySelectorAll('[data-lang]').forEach((b) => {
    b.onclick = () => setLang(b.dataset.lang);
  });
}
