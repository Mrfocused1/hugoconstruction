/* Hugo Harrison — scroll-driven 3D hero: a gold steel frame rises beside a tower crane */
import * as THREE from '../vendor/three.module.min.js';

const hero = document.querySelector('[data-hero]');
const canvas = hero.querySelector('[data-hero-canvas]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

/* ---------- Headline: words darken as you scroll ---------- */
const words = [];
(function split(node) {
  [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = part;
        words.push(s);
        frag.appendChild(s);
      });
      node.replaceChild(frag, n);
    } else if (n.nodeType === 1) split(n);
  });
})(hero.querySelector('[data-hero-words]'));

const pctEl = hero.querySelector('[data-progress-num]');
const barEl = hero.querySelector('[data-progress-bar]');
const stepEls = [...hero.querySelectorAll('[data-step]')];
const cue = hero.querySelector('.hero__cue');

function scrollProgress() {
  const r = hero.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  return total > 0 ? clamp(-r.top / total) : 1;
}
function updateUI(p, pb) {
  const shown = Math.round(lerp(0.3, 1, clamp(p / 0.3)) * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < shown));
  const pct = Math.round(pb * 100);
  pctEl.textContent = String(pct).padStart(3, '0');
  barEl.style.width = pct + '%';
  const step = pb < 0.07 ? 0 : pb < 0.84 ? 1 : 2;
  stepEls.forEach((li, i) => li.classList.toggle('is-on', i === step));
  if (cue) cue.style.opacity = p > 0.02 ? 0 : 1;
}

/* ---------- 3D scene ---------- */
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { renderer = null; }
if (!renderer) hero.classList.add('no-webgl');

const isSmall = () => window.innerWidth < 900;
let scene, camera, anim = [], rig = () => {}, placeCamera = () => {};

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !isSmall();
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf1f0ec, 70, 190);
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);

  // Soft studio environment so the metal reads as metal
  scene.environment = (() => {
    const pm = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xbebbb4, side: THREE.BackSide }));
    room.scale.set(20, 12, 20); room.position.y = 4; env.add(room);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0x3a3833 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.9; env.add(floor);
    const panel = (w, h, pos, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 2, 0); env.add(m);
    };
    panel(10, 6, [0, 9.8, 0], 5); panel(6, 4, [9.8, 4, 3], 3); panel(5, 4, [-9.8, 5, -4], 1.6); panel(8, 3, [0, 3, 9.8], 1.2);
    const tex = pm.fromScene(env, 0.04).texture;
    pm.dispose();
    return tex;
  })();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6d0c4, 0.8));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sun.position.set(45, 70, 35);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 220 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  sun.target.position.set(0, 0, -4);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xe2e8ff, 0.6);
  fill.position.set(-40, 30, -25);
  scene.add(fill);

  const M = {
    gold: new THREE.MeshStandardMaterial({ color: 0xc8952f, metalness: 0.9, roughness: 0.3, fog: false }),
    crane: new THREE.MeshStandardMaterial({ color: 0xd6a33b, metalness: 0.65, roughness: 0.38, fog: false }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xdcd9d2, roughness: 0.95, metalness: 0, fog: false }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a2926, roughness: 0.55, metalness: 0.3, fog: false }),
    glass: new THREE.MeshStandardMaterial({ color: 0xc9d3d6, metalness: 0.2, roughness: 0.06, transparent: true, opacity: 0.38, depthWrite: false, fog: false }),
  };

  const UP = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mesh = (geo, mat, parent, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const strut = (a, b, t, mat, parent) => {
    const d = new THREE.Vector3().subVectors(b, a), len = d.length();
    const m = mesh(new THREE.BoxGeometry(t, len, t), mat, parent);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  };
  const add = (a, b, apply) => { anim.push({ a, b, apply, t: 0 }); apply(0); };

  // Ground: shadows only, plus a faint site grid that fades into the haze
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(240, 60, 0xd9d6cf, 0xe3e1db);
  grid.position.y = 0.01; scene.add(grid);

  // Building frame
  const B = { bx: 4, bz: 3, bay: 4, storeys: 6, h: 3.6, base: 0.6 };
  const W = B.bx * B.bay, D = B.bz * B.bay, x0 = -W / 2, z0 = -D / 2;
  const build = new THREE.Group(); scene.add(build);

  const found = mesh(new THREE.BoxGeometry(W + 2.4, B.base, D + 2.4).translate(0, B.base / 2, 0), M.concrete, build);
  add(0, 0.07, (t) => { found.scale.y = Math.max(0.001, t); found.visible = t > 0; });

  const colGeo = new THREE.BoxGeometry(0.42, B.h, 0.42).translate(0, B.h / 2, 0);
  const beamX = new THREE.BoxGeometry(B.bay, 0.46, 0.34).translate(B.bay / 2, 0, 0);
  const beamZ = new THREE.BoxGeometry(0.34, 0.46, B.bay).translate(0, 0, B.bay / 2);
  const slabGeo = new THREE.BoxGeometry(W + 0.7, 0.26, D + 0.7);
  const glassGeo = new THREE.PlaneGeometry(B.bay - 0.3, B.h - 0.55).translate(0, (B.h - 0.55) / 2, 0);

  for (let s = 0; s < B.storeys; s++) {
    const a0 = 0.07 + s * 0.125, len = 0.125, yb = B.base + s * B.h, yt = yb + B.h;
    let k = 0;
    for (let i = 0; i <= B.bx; i++) for (let j = 0; j <= B.bz; j++) {
      const c = mesh(colGeo, M.gold, build);
      c.position.set(x0 + i * B.bay, yb, z0 + j * B.bay);
      const st = a0 + len * 0.45 * (k++ / 19);
      add(st, st + len * 0.25, (t) => { c.scale.y = Math.max(0.001, t); c.visible = t > 0; });
    }
    k = 0;
    for (let j = 0; j <= B.bz; j++) for (let i = 0; i < B.bx; i++) {
      const m = mesh(beamX, M.gold, build);
      m.position.set(x0 + i * B.bay, yt - 0.23, z0 + j * B.bay);
      const st = a0 + len * (0.4 + 0.35 * (k++ / 15));
      add(st, st + len * 0.2, (t) => { m.scale.x = Math.max(0.001, t); m.visible = t > 0; });
    }
    k = 0;
    for (let i = 0; i <= B.bx; i++) for (let j = 0; j < B.bz; j++) {
      const m = mesh(beamZ, M.gold, build);
      m.position.set(x0 + i * B.bay, yt - 0.23, z0 + j * B.bay);
      const st = a0 + len * (0.45 + 0.35 * (k++ / 14));
      add(st, st + len * 0.2, (t) => { m.scale.z = Math.max(0.001, t); m.visible = t > 0; });
    }
    const slab = mesh(slabGeo, M.concrete, build);
    slab.position.set(0, yt + 0.13, 0);
    add(a0 + len * 0.8, a0 + len, (t) => {
      const e = smooth(t);
      slab.scale.set(lerp(0.85, 1, e), Math.max(0.001, e), lerp(0.85, 1, e));
      slab.visible = t > 0;
    });
    // Handover: glazing slides up on the two faces the camera sees
    for (let i = 0; i < B.bx; i++) {
      const g = mesh(glassGeo, M.glass, build, false);
      g.position.set(x0 + (i + 0.5) * B.bay, yb + 0.28, D / 2 + 0.25);
      const st = 0.84 + s * 0.018 + i * 0.004;
      add(st, st + 0.05, (t) => { g.scale.y = Math.max(0.001, t); g.visible = t > 0; });
    }
    for (let j = 0; j < B.bz; j++) {
      const g = mesh(glassGeo, M.glass, build, false);
      g.rotation.y = Math.PI / 2;
      g.position.set(W / 2 + 0.25, yb + 0.28, z0 + (j + 0.5) * B.bay);
      const st = 0.84 + s * 0.018 + j * 0.004;
      add(st, st + 0.05, (t) => { g.scale.y = Math.max(0.001, t); g.visible = t > 0; });
    }
  }

  // Tower crane
  const CR = { x: 15, z: -12, H: 40, s: 1.9 };
  const crane = new THREE.Group(); crane.position.set(CR.x, 0, CR.z); scene.add(crane);
  mesh(new THREE.BoxGeometry(5, 1, 5).translate(0, 0.5, 0), M.concrete, crane);
  const hs = CR.s / 2, corners = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]];
  corners.forEach(([x, z]) => strut(V(x, 1, z), V(x, CR.H, z), 0.18, M.crane, crane));
  for (let y = 1, n = 0; y < CR.H - 0.1; y += 2.6, n++) {
    const y2 = Math.min(CR.H, y + 2.6);
    for (let f = 0; f < 4; f++) {
      const [ax, az] = corners[f], [bx, bz] = corners[(f + 1) % 4], flip = (n + f) % 2;
      strut(V(flip ? ax : bx, y, flip ? az : bz), V(flip ? bx : ax, y2, flip ? bz : az), 0.08, M.crane, crane);
    }
  }

  const slew = new THREE.Group(); slew.position.y = CR.H; crane.add(slew);
  mesh(new THREE.BoxGeometry(2.8, 0.7, 2.8).translate(0, 0.35, 0), M.dark, slew);
  const JL = 36, jy = 0.7, jt = 2.3, jw = 0.75;
  const topY = (x) => jy + jt * (1 - 0.45 * clamp((-x - 0.5) / (JL - 2)));
  strut(V(0, jy, jw), V(-JL, jy, jw), 0.14, M.crane, slew);
  strut(V(0, jy, -jw), V(-JL, jy, -jw), 0.14, M.crane, slew);
  strut(V(-0.5, topY(-0.5), 0), V(-JL + 1.5, topY(-JL + 1.5), 0), 0.14, M.crane, slew);
  for (let xa = 0; xa > -JL + 1; xa -= 1.8) {
    const xb = xa - 0.9, xc = Math.max(-JL, xa - 1.8);
    [jw, -jw].forEach((z) => {
      strut(V(xa, jy, z), V(xb, topY(xb), 0), 0.07, M.crane, slew);
      strut(V(xb, topY(xb), 0), V(xc, jy, z), 0.07, M.crane, slew);
    });
    strut(V(xa, jy, -jw), V(xa, jy, jw), 0.07, M.crane, slew);
  }
  const CJ = 13;
  strut(V(0, jy, 0.9), V(CJ, jy, 0.9), 0.14, M.crane, slew);
  strut(V(0, jy, -0.9), V(CJ, jy, -0.9), 0.14, M.crane, slew);
  for (let x = 1.5; x <= CJ; x += 2.3) strut(V(x, jy, -0.9), V(x, jy, 0.9), 0.08, M.crane, slew);
  mesh(new THREE.BoxGeometry(3, 2.6, 2.4).translate(CJ - 1.6, jy - 1.0, 0), M.concrete, slew);
  const apex = V(0, 9, 0);
  corners.forEach(([x, z]) => strut(V(x, 0.7, z), apex, 0.12, M.crane, slew));
  strut(apex, V(-24, topY(-24), 0), 0.06, M.dark, slew);
  strut(apex, V(CJ - 0.5, jy + 0.2, 0), 0.06, M.dark, slew);
  mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7).translate(0.6, -0.6, 1.9), M.dark, slew);

  const trolley = mesh(new THREE.BoxGeometry(1.2, 0.45, 1.7), M.dark, slew);
  const cable = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6).translate(0, -0.5, 0), M.dark, slew, false);
  const hook = new THREE.Group(); slew.add(hook);
  mesh(new THREE.BoxGeometry(0.9, 1.1, 0.55).translate(0, -0.55, 0), M.dark, hook);
  const hk = mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 20, Math.PI * 1.5), M.crane, hook);
  hk.position.set(0, -1.5, 0); hk.rotation.z = Math.PI * 0.75;
  const load = new THREE.Group(); hook.add(load);
  mesh(new THREE.BoxGeometry(B.bay * 1.5, 0.46, 0.34), M.gold, load).position.y = -4.4;
  strut(V(0, -1.8, 0), V(-2.6, -4.2, 0), 0.04, M.dark, load);
  strut(V(0, -1.8, 0), V(2.6, -4.2, 0), 0.04, M.dark, load);

  const slewBase = Math.atan2(-CR.z, CR.x);        // points the jib over the building
  rig = (p, time) => {
    const working = p > 0.07 && p < 0.84;
    slew.rotation.y = slewBase + 0.28 * Math.sin(p * Math.PI * 2.4) + (reduce ? 0 : 0.015 * Math.sin(time * 0.4));
    const reach = lerp(12, 24, 0.5 + 0.5 * Math.sin(p * Math.PI * 3.2));
    trolley.position.set(-reach, jy - 0.3, 0);
    const s = clamp(Math.floor((p - 0.07) / 0.125), 0, B.storeys - 1);
    const hookWorld = working ? B.base + (s + 1) * B.h + 6.5 : 30;
    const hookLocal = hookWorld - CR.H, top = jy - 0.55;
    hook.position.set(-reach, hookLocal, 0);
    cable.position.set(-reach, top, 0);
    cable.scale.y = Math.max(0.1, top - hookLocal);
    load.visible = working;
  };

  const target = new THREE.Vector3();
  placeCamera = (p, time) => {
    const small = isSmall(), e = smooth(p);
    const az = lerp(0.95, 0.38, e) + (reduce ? 0 : 0.035 * Math.sin(time * 0.12));
    const el = lerp(0.09, 0.3, e);
    const r = (small ? 1.55 : 1) * lerp(78, 96, e);
    target.set(small ? 5 : 2, lerp(15, 19, p), small ? -5 : -3);
    camera.position.set(
      target.x + r * Math.cos(el) * Math.sin(az),
      target.y + r * Math.sin(el),
      target.z + r * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(target);
  };
}

/* ---------- Render loop ---------- */
let w0 = 0, h0 = 0;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w === w0 && h === h0) return;
  w0 = w; h0 = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let raf = 0, lastFrame = 0, visible = true;
function frame() {
  raf = 0;
  lastFrame = performance.now();
  const p = reduce ? 1 : scrollProgress();
  const pb = reduce ? 1 : clamp(p / 0.92);          // the build finishes just before the pin releases
  updateUI(p, pb);
  if (renderer) {
    resize();
    for (const a of anim) {
      const t = clamp((pb - a.a) / (a.b - a.a));
      if (t !== a.t) { a.t = t; a.apply(t); }
    }
    const time = lastFrame / 1000;
    rig(pb, time);
    placeCamera(pb, time);
    renderer.render(scene, camera);
  }
  if (visible && renderer && !reduce) raf = requestAnimationFrame(frame);   // keeps the gentle idle drift going
}
function kick() { if (!raf) raf = requestAnimationFrame(frame); }

new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { rootMargin: '120px' }).observe(hero);
window.addEventListener('scroll', kick, { passive: true });
window.addEventListener('resize', kick);
// Fallback for browsers that throttle animation frames on a visible page
setInterval(() => {
  if (visible && document.visibilityState === 'visible' && performance.now() - lastFrame > 150) frame();
}, 100);
frame();
