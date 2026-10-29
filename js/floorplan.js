// 3D floor plan, shared by the customer page (view only) and the admin page
// (drag-and-drop editor). Built with three.js.
//
// Layout units are grid cells. Each object has { x, y, w, h } where x is the
// column, y the row, w the width in columns and h the depth in rows.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { t } from './i18n.js';

export const EXTRA_TYPES = {
  table: { height: 0.45, color: '#b08968', w: 2, h: 1 },
  entrance: { height: 0.06, color: '#22c55e', w: 2, h: 1, label: 'entrance' },
  wall: { height: 1.8, color: '#9ca3af', w: 4, h: 1 },
  toilet: { height: 1.3, color: '#93c5fd', w: 1, h: 2, label: 'toilet' },
  sink: { height: 0.9, color: '#cbd5e1', w: 1, h: 1, label: 'sink' },
  pillar: { height: 2.4, color: '#d6d3d1', w: 1, h: 1 },
};
const STORE_HEIGHT = 1.3;
const CLOSED_COLOR = '#a8a29e';

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Finds the first empty spot of size w×h, scanning row by row.
export function findFreeSpot(rects, cols, rows, w = 3, h = 2) {
  for (let y = 0; y + h <= rows; y++) {
    for (let x = 0; x + w <= cols; x++) {
      const r = { x, y, w, h };
      if (!rects.some((o) => overlaps(r, o))) return r;
    }
  }
  return { x: 0, y: 0, w, h };
}

function labelTexture(lines, { bg = 'rgba(255,255,255,0.94)', fg = '#1c1917', badge = null } = {}) {
  const scale = 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font1 = `600 ${26 * scale}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  const font2 = `${20 * scale}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.font = font1;
  const w1 = ctx.measureText(lines[0] || '').width;
  ctx.font = font2;
  const w2 = lines[1] ? ctx.measureText(lines[1]).width : 0;
  const badgeW = badge ? 44 * scale : 0;
  const pad = 14 * scale;
  canvas.width = Math.ceil(Math.max(w1 + badgeW, w2) + pad * 2);
  canvas.height = (lines[1] ? 78 : 50) * scale;
  ctx.fillStyle = bg;
  const r = 14 * scale;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, canvas.width, canvas.height, r);
  else ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();
  let x = pad;
  if (badge) {
    ctx.fillStyle = badge.color;
    ctx.beginPath();
    ctx.arc(x + 17 * scale, 25 * scale, 17 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${19 * scale}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.text, x + 17 * scale, 26 * scale);
    x += badgeW;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fg;
  ctx.font = font1;
  ctx.fillText(lines[0] || '', x, 26 * scale);
  if (lines[1]) {
    ctx.font = font2;
    ctx.fillStyle = '#57534e';
    ctx.fillText(lines[1], pad, 58 * scale);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect: canvas.width / canvas.height, rows: lines[1] ? 2 : 1 };
}

export function createFloorPlan(container, { editable = false, onSelect = () => {}, onChange = () => {}, onMessage = () => {} } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    container.innerHTML = '<p class="fp-fallback">3D is not supported on this device.</p>';
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.className = 'fp-canvas';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = 4;
  controls.maxDistance = 80;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6cfc4, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);
  let floorGroup = new THREE.Group();
  world.add(floorGroup);

  // Red map pin shown above the selected stall.
  const pin = new THREE.Group();
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), pinMat);
  head.position.y = 0.95;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 24), pinMat);
  tip.rotation.x = Math.PI;
  tip.position.y = 0.4;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  dot.position.set(0, 0.97, 0.36);
  pin.add(head, tip, dot);
  pin.visible = false;
  world.add(pin);

  let cols = 20;
  let rows = 12;
  let objects = []; // { key, kind, id, type, x, y, w, h, color, group, body }
  let selectedKey = null;
  let view = '3d';
  const camGoal = { target: null };
  const disposables = [];

  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function cellToWorld(x, y) {
    return new THREE.Vector3(x - cols / 2, 0, y - rows / 2);
  }

  function buildFloor() {
    world.remove(floorGroup);
    floorGroup.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    floorGroup = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(cols + 0.6, 0.2, rows + 0.6),
      new THREE.MeshStandardMaterial({ color: 0xf3ece0, roughness: 0.95 }),
    );
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    floorGroup.add(floor);
    const pts = [];
    for (let x = 0; x <= cols; x++) pts.push(x - cols / 2, 0.005, -rows / 2, x - cols / 2, 0.005, rows / 2);
    for (let y = 0; y <= rows; y++) pts.push(-cols / 2, 0.005, y - rows / 2, cols / 2, 0.005, y - rows / 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    floorGroup.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0xd6cbb8, transparent: true, opacity: editable ? 0.9 : 0.45,
    })));
    world.add(floorGroup);

    const size = Math.max(cols, rows);
    sun.position.set(size * 0.4, size, size * 0.6);
    const sc = sun.shadow.camera;
    sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.far = size * 4;
    sc.updateProjectionMatrix();
  }

  function makeObject(o) {
    const group = new THREE.Group();
    const height = o.kind === 'store' ? STORE_HEIGHT : EXTRA_TYPES[o.type]?.height ?? 1;
    const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.12, height, o.h - 0.12), mat);
    body.position.y = height / 2;
    body.castShadow = height > 0.2;
    body.receiveShadow = true;
    body.userData.key = o.key;
    group.add(body);

    if (o.kind === 'store') {
      // Darker counter strip on top for a little detail.
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(o.w - 0.05, 0.08, o.h - 0.05),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(o.color).multiplyScalar(0.7) }),
      );
      top.position.y = height + 0.04;
      top.userData.key = o.key;
      group.add(top);
    }

    if (o.label) {
      const { tex, aspect, rows: lr } = labelTexture(o.label, { badge: o.badge });
      const mat2 = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(mat2);
      const hgt = lr === 2 ? 0.95 : 0.6;
      sprite.scale.set(hgt * aspect, hgt, 1);
      sprite.position.y = height + 0.25 + hgt / 2;
      sprite.renderOrder = 10;
      sprite.userData.key = o.key;
      group.add(sprite);
      disposables.push(tex, mat2);
    }
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(body.geometry),
      new THREE.LineBasicMaterial({ color: 0xfacc15 }),
    );
    edges.position.copy(body.position);
    edges.scale.setScalar(1.04);
    edges.visible = false;
    group.add(edges);

    o.group = group;
    o.body = body;
    o.edges = edges;
    o.height = height;
    placeGroup(o);
    world.add(group);
  }

  function placeGroup(o) {
    const p = cellToWorld(o.x + o.w / 2, o.y + o.h / 2);
    o.group.position.set(p.x, 0, p.z);
  }

  function clearObjects() {
    for (const o of objects) {
      world.remove(o.group);
      o.group.traverse((c) => { c.geometry?.dispose(); if (c.material && !c.isSprite) c.material.dispose(); });
    }
    disposables.splice(0).forEach((d) => d.dispose());
    objects = [];
  }

  // stores: [{ id, number, label, sublabel, color, dim }]
  function setData(data) {
    const sizeChanged = data.cols !== cols || data.rows !== rows;
    cols = data.cols || 20;
    rows = data.rows || 12;
    clearObjects();
    buildFloor();
    const occupied = [];
    for (const e of data.extras || []) {
      const style = EXTRA_TYPES[e.type] || EXTRA_TYPES.table;
      const o = {
        key: `extra:${e.id}`, kind: 'extra', id: e.id, type: e.type,
        x: e.x, y: e.y, w: e.w, h: e.h, color: style.color,
        label: style.label ? [t(style.label)] : null,
      };
      objects.push(o);
      occupied.push(o);
    }
    for (const s of data.stores || []) {
      const b = s.block || findFreeSpot(occupied, cols, rows);
      const o = {
        key: `store:${s.id}`, kind: 'store', id: s.id, x: b.x, y: b.y, w: b.w, h: b.h,
        color: s.dim ? CLOSED_COLOR : s.color,
        label: [s.label, s.sublabel].filter(Boolean),
        badge: { text: String(s.number ?? '?'), color: s.dim ? '#78716c' : '#A8261B' },
      };
      objects.push(o);
      occupied.push(o);
    }
    objects.forEach(makeObject);
    if (sizeChanged) resetCamera();
    if (selectedKey && !objects.some((o) => o.key === selectedKey)) selectedKey = null;
    applySelection(false);
  }

  // Fits the whole floor in view, for both wide and narrow (phone) screens.
  function resetCamera() {
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const tanH = tanV * camera.aspect;
    // On a tall phone screen, look from the side so the long edge of the
    // hall runs up the screen and fills it better.
    const sideways = camera.aspect < 0.9 && cols > rows;
    const across = sideways ? rows : cols;
    const deep = sideways ? cols : rows;
    const dist = Math.max((across / 2 + 0.5) / tanH, (deep / 2 + 1.5) / tanV);
    if (view === 'top') camera.position.set(sideways ? 0.01 : 0, dist * 1.02, sideways ? 0 : 0.01);
    else if (sideways) camera.position.set(dist * 0.68, dist * 0.82, 0);
    else camera.position.set(0, dist * 0.82, dist * 0.68);
    controls.maxDistance = dist * 2;
    controls.target.set(0, 0, 0);
    camGoal.target = null;
    controls.update();
  }

  function setView(v) {
    view = v;
    controls.enableRotate = v !== 'top';
    resetCamera();
  }

  function applySelection(focus = true) {
    const sel = objects.find((o) => o.key === selectedKey);
    for (const o of objects) {
      o.edges.visible = editable && o === sel;
      o.body.material.emissive?.setHex(o === sel ? 0x332200 : 0x000000);
    }
    pin.visible = !!sel && !editable && sel.kind === 'store';
    if (sel && pin.visible) {
      const p = cellToWorld(sel.x + sel.w / 2, sel.y + sel.h / 2);
      pin.position.set(p.x, sel.height + 1.35, p.z);
    }
    if (sel && focus && !editable) {
      const p = cellToWorld(sel.x + sel.w / 2, sel.y + sel.h / 2);
      camGoal.target = p;
    }
  }

  function select(key, notify = true) {
    selectedKey = key;
    applySelection(true);
    if (notify) onSelect(key ? describeSelection() : null);
  }

  function describeSelection() {
    const o = objects.find((x) => x.key === selectedKey);
    return o && { key: o.key, kind: o.kind, id: o.id, type: o.type, x: o.x, y: o.y, w: o.w, h: o.h };
  }

  // --- pointer handling ----------------------------------------------------
  function setPointer(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  function pick(ev) {
    setPointer(ev);
    const hits = raycaster.intersectObjects(objects.map((o) => o.group), true);
    const hit = hits.find((h) => h.object.userData.key);
    return hit ? hit.object.userData.key : null;
  }
  function groundCell(ev) {
    setPointer(ev);
    const p = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(ground, p)) return null;
    return { gx: p.x + cols / 2, gy: p.z + rows / 2 };
  }

  let drag = null;
  let downAt = null;
  const el = renderer.domElement;

  el.addEventListener('pointerdown', (ev) => {
    downAt = { x: ev.clientX, y: ev.clientY };
    if (!editable) return;
    const key = pick(ev);
    if (!key) return;
    const o = objects.find((x) => x.key === key);
    const c = groundCell(ev);
    if (!o || !c) return;
    select(key);
    drag = { o, offX: c.gx - o.x, offY: c.gy - o.y, startX: o.x, startY: o.y };
    controls.enabled = false;
    el.setPointerCapture(ev.pointerId);
  });

  el.addEventListener('pointermove', (ev) => {
    if (!drag) {
      if (ev.pointerType === 'mouse') el.style.cursor = pick(ev) ? 'pointer' : '';
      return;
    }
    const c = groundCell(ev);
    if (!c) return;
    const o = drag.o;
    o.x = Math.max(0, Math.min(cols - o.w, Math.round(c.gx - drag.offX)));
    o.y = Math.max(0, Math.min(rows - o.h, Math.round(c.gy - drag.offY)));
    placeGroup(o);
    const bad = objects.some((p) => p !== o && overlaps(o, p));
    o.body.material.emissive.setHex(bad ? 0x7f1d1d : 0x332200);
  });

  el.addEventListener('pointerup', (ev) => {
    if (drag) {
      const o = drag.o;
      if (objects.some((p) => p !== o && overlaps(o, p))) {
        o.x = drag.startX;
        o.y = drag.startY;
        placeGroup(o);
        onMessage(t('overlap'));
      } else if (o.x !== drag.startX || o.y !== drag.startY) {
        onChange();
      }
      applySelection(false);
      onSelect(describeSelection());
      drag = null;
      controls.enabled = true;
      return;
    }
    // A tap (not a drag-to-rotate) selects in view mode.
    if (downAt && Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y) < 6) {
      const key = pick(ev);
      if (!editable || !key) select(key);
    }
    downAt = null;
  });

  // --- editing helpers -----------------------------------------------------
  function tryChange(o, next) {
    const test = { ...o, ...next };
    if (test.x < 0 || test.y < 0 || test.x + test.w > cols || test.y + test.h > rows || test.w < 1 || test.h < 1) return false;
    if (objects.some((p) => p !== o && overlaps(test, p))) { onMessage(t('overlap')); return false; }
    Object.assign(o, next);
    world.remove(o.group);
    makeObject(o);
    applySelection(false);
    onChange();
    onSelect(describeSelection());
    return true;
  }
  const selectedObj = () => objects.find((o) => o.key === selectedKey);

  function rotateSelected() {
    const o = selectedObj();
    if (!o) return;
    // Rotate around the block centre, then nudge back inside the grid.
    let x = Math.round(o.x + o.w / 2 - o.h / 2);
    let y = Math.round(o.y + o.h / 2 - o.w / 2);
    x = Math.max(0, Math.min(cols - o.h, x));
    y = Math.max(0, Math.min(rows - o.w, y));
    tryChange(o, { w: o.h, h: o.w, x, y });
  }
  function resizeSelected(dw, dh) {
    const o = selectedObj();
    if (o) tryChange(o, { w: o.w + dw, h: o.h + dh });
  }
  function addExtra(type) {
    const style = EXTRA_TYPES[type];
    const spot = findFreeSpot(objects, cols, rows, style.w, style.h);
    const id = `${type[0]}${Date.now().toString(36)}`;
    const o = { key: `extra:${id}`, kind: 'extra', id, type, ...spot, color: style.color, label: style.label ? [t(style.label)] : null };
    objects.push(o);
    makeObject(o);
    select(o.key);
    onChange();
  }
  function deleteSelected() {
    const o = selectedObj();
    if (!o || o.kind !== 'extra') return;
    world.remove(o.group);
    objects = objects.filter((x) => x !== o);
    select(null);
    onChange();
  }
  function getLayout() {
    const extras = [];
    const blocks = {};
    for (const o of objects) {
      const r = { x: o.x, y: o.y, w: o.w, h: o.h };
      if (o.kind === 'extra') extras.push({ id: o.id, type: o.type, ...r });
      else blocks[o.id] = r;
    }
    return { cols, rows, extras, blocks };
  }

  // --- render loop ---------------------------------------------------------
  function resize() {
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!userMoved) resetCamera();
  }
  let userMoved = false;
  controls.addEventListener('start', () => { userMoved = true; });
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  setView('3d');

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (document.hidden) return;
    const time = clock.getElapsedTime();
    if (pin.visible) {
      pin.rotation.y = time * 1.5;
      const sel = selectedObj();
      if (sel) pin.position.y = sel.height + 1.35 + Math.sin(time * 3) * 0.18;
    }
    if (camGoal.target) {
      const d = camGoal.target.clone().sub(controls.target);
      if (d.length() < 0.02) camGoal.target = null;
      else {
        d.multiplyScalar(0.08);
        controls.target.add(d);
        camera.position.add(d);
      }
    }
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    setData,
    select: (key) => select(key, false),
    getSelected: describeSelection,
    getLayout,
    addExtra,
    rotateSelected,
    resizeSelected,
    deleteSelected,
    setView,
    resetCamera,
    dispose() {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      clearObjects();
      renderer.dispose();
      el.remove();
    },
  };
}
