/* ==========================================================
   KIKO'S — interacciones
   Lámpara de cobre de entrada; vaso de un litro en WebGL que
   refracta el rótulo y cuyo cóctel se agita al arrastrarlo;
   posavasos que se arrastran y se giran (la carta); sobre de
   cromos que se rasga y álbum que se llena (las fotos); campo
   de fútbol en el que el balón elige el vídeo (los reels).
   ========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const STATIC = /[?&]static\b/.test(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC;
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const motion = hasGSAP && !reduced;
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const IMG = (f) => 'assets/img/' + f;
const VID = (f) => 'assets/video/' + f;
const play = (v) => { if (!v) return; const p = v.play(); if (p) p.catch(() => {}); };
const fine = matchMedia('(pointer: fine)').matches;

/* ----------------------------------------------------------
   IDIOMAS · castellano por defecto, ?lang=xx, se recuerda
   ---------------------------------------------------------- */
const I18N = window.KK_I18N || { langs: [{ c: 'es', n: 'Castellano', loc: 'es-ES' }], ui: { es: {} } };
const LANGS = I18N.langs, CODES = LANGS.map((l) => l.c), LANG_KEY = 'kikos-lang';
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
let lang = [new URLSearchParams(location.search).get('lang'), store.get(LANG_KEY)].find((c) => CODES.includes(c)) || 'es';
const t = (k, vars) => {
  let s = (I18N.ui[lang] && I18N.ui[lang][k]) ?? (I18N.ui.es && I18N.ui.es[k]) ?? k;
  if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
};
const loc = () => (LANGS.find((l) => l.c === lang) || LANGS[0]).loc;
const fmtDate = (iso) => { try { return new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T12:00:00')); } catch (e) { return iso; } };
const onLang = [];
function paintSwitches() {
  const cur = LANGS.find((l) => l.c === lang);
  $$('[data-lang-switch]').forEach((box) => {
    box.innerHTML = `<button class="lang__btn" type="button" aria-expanded="false" aria-label="${t('lang.change')} (${cur.n})"><i class="ph-bold ph-globe-simple" aria-hidden="true"></i><span>${cur.c.toUpperCase()}</span><i class="ph-bold ph-caret-down" aria-hidden="true"></i></button>
      <ul class="lang__menu" hidden>${LANGS.map((l) => `<li><button type="button" lang="${l.c}" data-set-lang="${l.c}"${l.c === lang ? ' aria-current="true"' : ''}><b>${l.c.toUpperCase()}</b>${l.n}</button></li>`).join('')}</ul>`;
  });
  $$('[data-lang-list]').forEach((box) => {
    box.innerHTML = `<span>${t('lang.label')}</span>` + LANGS.map((l) => `<button type="button" lang="${l.c}" data-set-lang="${l.c}"${l.c === lang ? ' aria-current="true"' : ''}>${l.n}</button>`).join('');
  });
}
function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  const md = $('#metaDesc'); if (md) md.setAttribute('content', t('meta.desc'));
  $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  $$('[data-i18n-attr]').forEach((el) => el.dataset.i18nAttr.split(';').forEach((p) => {
    const [a, k] = p.split(':'); if (a && k) el.setAttribute(a.trim(), t(k.trim()));
  }));
  paintSwitches();
  onLang.forEach((f) => f());
}
function setLang(c) {
  if (!CODES.includes(c) || c === lang) return;
  lang = c;
  store.set(LANG_KEY, c);
  try {
    const u = new URL(location.href);
    if (c === 'es') u.searchParams.delete('lang'); else u.searchParams.set('lang', c);
    history.replaceState(history.state, '', u);
  } catch (e) {}
  applyLang();
  if (hasGSAP) ScrollTrigger.refresh();
}
const closeLangMenus = () => $$('.lang__menu:not([hidden])').forEach((m) => { m.hidden = true; m.previousElementSibling.setAttribute('aria-expanded', 'false'); });
document.addEventListener('click', (e) => {
  const sw = e.target.closest('.lang__btn');
  if (sw) {
    const m = sw.nextElementSibling, open = m.hidden;
    closeLangMenus(); m.hidden = !open; sw.setAttribute('aria-expanded', String(open));
    if (open) { const c = m.querySelector('[aria-current]'); if (c) c.focus(); }
    return;
  }
  const set = e.target.closest('[data-set-lang]');
  if (set) {
    const box = set.closest('[data-lang-switch]');
    closeLangMenus(); setLang(set.dataset.setLang);
    if (box) { const b = box.querySelector('.lang__btn'); if (b) b.focus(); }
    return;
  }
  if (!e.target.closest('.lang__menu')) closeLangMenus();
});
document.addEventListener('keydown', (e) => {
  const m = $('.lang__menu:not([hidden])');
  if (!m) return;
  const items = $$('button', m), i = items.indexOf(document.activeElement);
  if (e.key === 'Escape') { closeLangMenus(); m.previousElementSibling.focus(); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
});
document.addEventListener('focusin', (e) => { const m = $('.lang__menu:not([hidden])'); if (m && !m.parentNode.contains(e.target)) closeLangMenus(); });
applyLang();

/* ----------------------------------------------------------
   DATOS
   ---------------------------------------------------------- */
// colores del cóctel: fondo, superficie, piel y pulpa de la rodaja, transparencia
const FLAVORS = [
  { a: [214, 38, 30],  b: [255, 176, 46],  rind: [236, 128, 22], flesh: [255, 184, 76],  clear: .55 },
  { a: [118, 170, 52], b: [226, 240, 176], rind: [70, 140, 38],  flesh: [196, 226, 118], clear: .62 },
  { a: [232, 219, 194], b: [255, 249, 236], rind: [214, 160, 40], flesh: [255, 222, 110], clear: .1 },
  { a: [118, 14, 56],  b: [226, 56, 106],  rind: [168, 16, 54],  flesh: [240, 92, 128], clear: .38 }
];

const CROMOS = [
  { img: 'fachada.jpg', t: 'cr.1', c: 'cat.casa', holo: true },
  { img: 'cocteles.jpg', t: 'cr.2', c: 'cat.coc', holo: true },
  { img: 'paella.jpg', t: 'cr.3', c: 'cat.cocina' },
  { img: 'iced-caramel.jpg', t: 'cr.4', c: 'cat.man' },
  { img: 'nachos.jpg', t: 'cr.5', c: 'cat.cocina' },
  { img: 'grada.jpg', t: 'cr.6', c: 'cat.mun' },
  { img: 'tostada.jpg', t: 'cr.7', c: 'cat.man' },
  { img: 'mojito.jpg', t: 'cr.8', c: 'cat.ter' },
  { img: 'costillas.jpg', t: 'cr.9', c: 'cat.cocina' },
  { img: 'terraza-mundial.jpg', t: 'cr.10', c: 'cat.mun', holo: true },
  { img: 'acai.jpg', t: 'cr.11', c: 'cat.man' },
  { img: 'barra.jpg', t: 'cr.12', c: 'cat.casa' },
  { img: 'ensalada.jpg', t: 'cr.13', c: 'cat.cocina' },
  { img: 'strawberry-iced.jpg', t: 'cr.14', c: 'cat.man' },
  { img: 'crepe-terraza.jpg', t: 'cr.15', c: 'cat.ter' },
  { img: 'fiesta.jpg', t: 'cr.16', c: 'cat.mun', holo: true }
];

// reels de @kikos_lloret (fecha de publicación) y un vídeo de cliente en Google; t = clave de texto
const CLIPS = [
  { id: 'DZ_KMNdo-oR', t: 'clip.1', d: '2026-06-24', tags: '#fifaworldcup #cocktails #shots', c1: '#7C5CFF', c2: '#E39B55', x: 23, y: 24 },
  { id: 'DaYx6WvIilN', t: 'clip.2', d: '2026-07-04', tags: '#worldcup2026 #match #lloretdemar', c1: '#4D6BFF', c2: '#A9BBFF', x: 20, y: 52 },
  { id: 'Dadt5PZo00L', t: 'clip.3', d: '2026-07-06', tags: '#spainvsportugal #fifaworldcup', c1: '#C8102E', c2: '#046A38', x: 24, y: 80 },
  { id: 'DadzerEoLb1', t: 'clip.4', d: '2026-07-06', tags: '#spainvsportugal #kikosbar', c1: '#FFC400', c2: '#046A38', x: 45, y: 31 },
  { id: 'DallupeIsy_', t: 'clip.5', d: '2026-07-09', tags: '#franciavsmarruecos #fifaworldcup', c1: '#0055A4', c2: '#C1272D', x: 44, y: 69 },
  { id: 'Da06LFUoS22', t: 'clip.6', d: '2026-07-15', tags: '#argentinavsengland #worldcup', c1: '#74ACDF', c2: '#F4F4F4', x: 62, y: 50 },
  { id: 'Da_TK0KIsY0', t: 'clip.7', d: '2026-07-19', tags: '#spainvsargentina #fifaworldcup', c1: '#C8102E', c2: '#74ACDF', x: 74, y: 22 },
  { id: 'DbAu27uIdGW', t: 'clip.8', d: '2026-07-20', tags: '#fifaworldcup #lloretdemar #cocktails', c1: '#FFC400', c2: '#C8102E', x: 76, y: 78 },
  { id: 'maps', t: 'clip.9', d: null, tags: null, c1: '#E39B55', c2: '#F3EDE3', x: 87, y: 50 }
];

/* ----------------------------------------------------------
   SCROLL SUAVE + NAV
   ---------------------------------------------------------- */
let lenis = null;
if (motion && window.Lenis) {
  lenis = new Lenis({ lerp: .1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const nav = $('#nav'), burger = $('#burger'), drawer = $('#drawer');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('is-solid', y > 40);
  nav.classList.toggle('is-hidden', y > 700 && y > lastY && !drawer.classList.contains('is-open'));
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
const setDrawer = (open) => {
  drawer.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  if (lenis) open ? lenis.stop() : lenis.start();
};
burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  setDrawer(false);
  if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}));

/* ----------------------------------------------------------
   ABIERTO / CERRADO (hora de Lloret)
   ---------------------------------------------------------- */
const madridMinutes = () => {
  try {
    const parts = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = (k) => +parts.find((p) => p.type === k).value;
    return g('hour') * 60 + g('minute');
  } catch (e) { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
};
const paintLive = () => {
  const m = madridMinutes();
  const open = m >= 600 || m < 90;
  const txt = t(open ? 'live.open' : 'live.closed');
  $$('[data-live]').forEach((el) => {
    el.classList.toggle('is-open', open);
    el.classList.toggle('is-closed', !open);
    $('[data-live-text]', el).textContent = txt;
  });
};
paintLive();
setInterval(paintLive, 60000);
onLang.push(paintLive);

/* ----------------------------------------------------------
   PORTADA · EL VASO DE UN LITRO (WebGL)
   ---------------------------------------------------------- */
const FRAG = `
precision highp float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform vec3 uGlass;
uniform float uH, uTime, uLevel, uTilt, uWave, uPour, uDpr, uClear;
uniform vec3 uA, uB, uRind, uFlesh;
uniform vec4 uI0, uI1, uI2;

vec3 S(vec2 q) { return texture2D(uScene, clamp(q / uRes, vec2(.001), vec2(.999))).rgb; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sdBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float iceD(vec2 p, vec4 ic) { vec2 q = p - ic.xy; float c = cos(ic.w), s = sin(ic.w); q = vec2(c * q.x + s * q.y, -s * q.x + c * q.y); return sdBox(q, vec2(ic.z), ic.z * .3); }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h); }

vec3 ice(vec3 c, vec2 p, vec4 ic, float x, float cx, float ys, float px) {
  float d = iceD(p, ic);
  if (d > px) return c;
  vec3 k = S(vec2(cx + x * .7 + 5. * px, p.y - 3. * px)) * .5 + vec3(.4, .42, .47);
  float under = step(ys, p.y);
  k = mix(k, k * mix(uB, uA, .3) * 1.25 + .04, under * .5);
  k += smoothstep(-3. * px, 0., d) * .32;
  k += smoothstep(-ic.z * .5, -ic.z * .9, d) * .06;
  return mix(c, k, smoothstep(.6 * px, -.6 * px, d) * .9);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float px = uDpr;
  float cx = uGlass.x, yB = uGlass.y, wt = uGlass.z, H = uH, yT = yB - H;
  float wb = wt * .78, rr = wb * .24;
  float t = clamp((yB - p.y) / H, 0., 1.);
  float w = mix(wb, wt, t);
  float dB = p.y - (yB - rr);
  if (dB > 0.) w = w - rr + sqrt(max(rr * rr - dB * dB, 0.));
  float x = p.x - cx;
  float u = clamp(x / max(w, 1.), -1., 1.);
  float nz = sqrt(max(1. - u * u, 0.));
  float ry = wt * .12;
  float eT = clamp(x / wt, -1., 1.);
  float eS = sqrt(max(1. - eT * eT, 0.));
  float rimBack = yT - ry * eS;
  float bt = H * .075;
  float floorY = yB - bt;

  float yL = floorY - uLevel * (floorY - (yT + ry * 2.4));
  float ws = sin(x / wt * 3.1 + uTime * 5.2) * .6 + sin(x / wt * 5.3 - uTime * 3.7) * .4;
  float ys = yL + uTilt * x + uWave * wt * .075 * ws;
  float ryS = w * .11;
  float sBack = ys - ryS * nz, sFront = ys + ryS * nz;
  float liqOn = step(.01, uLevel);
  vec3 lmid = mix(uA, uB, .45);

  float edgeX = w - abs(x);
  float inside = smoothstep(0., 1.2 * px, edgeX) * step(rimBack, p.y) * step(p.y, yB);

  // luz del cóctel sobre la barra
  vec2 gd = vec2(x / (wt * 1.6), (p.y - yB - 2. * px) / (wt * .22));
  float g = exp(-dot(gd, gd) * 1.5) * step(yB - 2. * px, p.y) * uLevel;
  vec4 outc = vec4(lmid * g * .6, g * .6);

  // chorro al servir
  float sx = cx + wt * .12 + sin(p.y * .045 / px + uTime * 22.) * 1.2 * px;
  float sw = (2.2 + 1.8 * uPour) * px * step(.02, uPour);
  float stream = smoothstep(sw, sw - 1.2 * px, abs(p.x - sx)) * step(p.y, ys) * step(.02, uPour);
  vec3 scol = mix(uB, uA, .25) * 1.08;

  vec3 c = vec3(0.);
  if (inside > 0.) {
    vec3 empty = S(vec2(cx + x * .9, p.y)) * 1.03 + vec3(.015, .02, .035);
    empty *= 1. - .18 * pow(abs(u), 5.);
    c = empty;

    if (liqOn > .5 && p.y > sBack - px && p.y < floorY) {
      float depth = clamp((p.y - ys) / max(floorY - ys, 1.), 0., 1.);
      vec3 liq = mix(uB, uA, smoothstep(0., 1., depth));
      vec3 bg = S(vec2(cx - x * .5, ys + (p.y - ys) * .62));
      vec3 lc = liq * (.58 + .42 * nz) * (1. - uClear * .45) + bg * liq * 1.35 * uClear;
      lc += liq * .22 * pow(nz, 5.);
      lc *= .72 + .28 * nz;
      vec2 q = vec2(p.x, p.y + uTime * 46. * px);
      vec2 cell = floor(q / (15. * px));
      vec2 f = fract(q / (15. * px)) - .5;
      float h = hash(cell);
      if (h > .82 && p.y > sFront) {
        vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) - .5;
        float rb = .1 + .13 * hash(cell + 1.3);
        float db = length(f - o * .5) - rb;
        lc += smoothstep(.07, 0., abs(db)) * .32 * (1. - depth * .4);
      }
      if (p.y < sFront) lc = mix(lc, liq * 1.16 + .06, .55);
      lc += smoothstep(2.2 * px, 0., abs(p.y - sFront)) * .4;
      c = mix(c, lc, smoothstep(sBack - .5 * px, sBack + 1. * px, p.y));
    }
    c = mix(c, scol, stream * .9);
    c = ice(c, p, uI0, x, cx, ys, px);
    c = ice(c, p, uI1, x, cx, ys, px);
    c = ice(c, p, uI2, x, cx, ys, px);

    float th = wt * .05 + 1.5 * px;
    float wall = smoothstep(th, 0., edgeX);
    c = mix(c, c * .82 + vec3(.18, .19, .22), wall * .85);
    c += vec3(.3) * smoothstep(.09, 0., abs(u + .7)) * (.4 + .6 * t);
    c += vec3(.15) * smoothstep(.035, 0., abs(u - .64));

    if (p.y > floorY) {
      float kb = (p.y - floorY) / bt;
      vec3 b = S(vec2(cx + x * .7, yB + 4. * px + (p.y - floorY) * 1.5)) * .7 + vec3(.16, .17, .21);
      b = mix(b, b * lmid * 1.6, .35 * liqOn * (1. - kb));
      b += smoothstep(2. * px, 0., abs(p.y - floorY)) * .35;
      b += smoothstep(.75, 1., kb) * .12;
      b *= 1. - .2 * pow(abs(u), 3.);
      c = b;
    }
    float er = abs(length(vec2(x / wt, (p.y - yT) / ry)) - 1.) * ry;
    c += smoothstep(1.8 * px, 0., er) * (p.y > yT ? .55 : .28);
    outc = mix(outc, vec4(c, 1.), inside);
  }
  if (p.y < yT && inside < .5) outc = mix(outc, vec4(scol, 1.), stream);

  // pajita: se ve partida bajo el líquido
  vec2 sa = vec2(cx + wt * .5, yT - H * .15), sb = vec2(cx - wt * .36, floorY - 8. * px);
  float sr = 5. * px;
  vec2 pp = p;
  float below = liqOn * step(ys, p.y) * step(.5, inside);
  if (below > .5) pp.x = cx + x / 1.22;
  float ds = sdSeg(pp, sa, sb);
  if (ds < sr + px) {
    float k = 1. - ds / sr;
    vec3 st = vec3(.05, .05, .07) + vec3(.16) * smoothstep(.5, .95, k);
    if (below > .5) st = mix(st, lmid * .5, .45);
    else if (inside > .5) st = mix(st, vec3(.2, .21, .25), .15);
    outc = mix(outc, vec4(st, 1.), smoothstep(0., 1.2 * px, sr - ds));
  }

  // rodaja en el borde
  vec2 gc = vec2(cx + wt * .66, yT + ry * .2);
  float R = wt * .36;
  float dg = length(p - gc);
  if (dg < R + px) {
    float ang = atan(p.y - gc.y, p.x - gc.x);
    vec3 col = uFlesh * (.8 + .2 * smoothstep(0., .25, abs(sin(ang * 4.))));
    col = mix(col, vec3(1., .97, .9), smoothstep(R * .06, 0., dg - R * .1) * .7);
    col = mix(col, vec3(1., .96, .88), smoothstep(R * .07, 0., abs(dg - R * .84)));
    if (dg > R * .87) col = uRind;
    col *= .86 + .14 * (1. - dg / R);
    outc = mix(outc, vec4(col, 1.), smoothstep(R, R - 1.2 * px, dg));
  }
  gl_FragColor = outc;
}`;
const VERT = 'attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0., 1.); }';

const Hero = (() => {
  const hero = $('#litro'), bgc = $('#heroBg'), glc = $('#heroGl');
  const word = $('#heroTitle .hero__word');
  const bctx = bgc.getContext('2d');
  const scene = document.createElement('canvas');
  const sctx = scene.getContext('2d');
  let W = 0, H = 0, dpr = 1, gl = null, U = {}, tex = null, running = false, raf = 0, last = 0, time = 0, visible = true;
  const G = { cx: 0, yB: 0, wt: 0, h: 0 };
  const st = { off: 0, v: 0, lastV: 0, acc: 0, target: 0, hover: 0, drag: false, grab: 0, tilt: 0, vt: 0, wave: .05, level: STATIC || reduced ? .8 : 0, fill: .8, filling: false, pour: 0, pourT: 0, drain: 0 };
  const col = { from: FLAVORS[0], to: FLAVORS[0], k: 1 };

  // ---------- fondo y escena (lo que se ve a través del vaso)
  function layout() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    [bgc, glc, scene].forEach((c) => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    const mobile = W < 761;
    G.h = mobile ? Math.min(H * .38, 340) : Math.min(H * .6, 590);
    G.wt = G.h * (mobile ? .25 : .235);
    G.cx = W / 2;
    // en móvil el vaso queda bajo el rótulo; en escritorio, delante
    G.yB = mobile ? H * .3 + 14 + G.h : H * .47 + G.h * .5;
  }
  function paintBg() {
    const c = bctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#0B0A16'; c.fillRect(0, 0, W, H);
    let g = c.createRadialGradient(W * .16, H * .08, 0, W * .16, H * .08, Math.max(W, H) * .6);
    g.addColorStop(0, 'rgba(124,92,255,.34)'); g.addColorStop(1, 'rgba(124,92,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(W * .86, H * .72, 0, W * .86, H * .72, Math.max(W, H) * .45);
    g.addColorStop(0, 'rgba(227,155,85,.17)'); g.addColorStop(1, 'rgba(227,155,85,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // listones de madera de la fachada
    const sh = H * .46;
    g = c.createLinearGradient(0, 0, 0, sh);
    g.addColorStop(0, 'rgba(227,155,85,.12)'); g.addColorStop(1, 'rgba(227,155,85,0)');
    c.fillStyle = g;
    for (let x = (W % 18) / 2; x < W; x += 18) c.fillRect(x, 0, 1.2, sh);
    // la barra
    const y = G.yB;
    g = c.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#1C1838'); g.addColorStop(.22, '#120F27'); g.addColorStop(1, '#0B0A16');
    c.fillStyle = g; c.fillRect(0, y, W, H - y);
    g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(227,155,85,0)'); g.addColorStop(.5, 'rgba(255,194,122,.7)'); g.addColorStop(1, 'rgba(227,155,85,0)');
    c.fillStyle = g; c.fillRect(0, y - 1, W, 1.5);
  }
  function paintScene() {
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.drawImage(bgc, 0, 0);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hr = hero.getBoundingClientRect();
    const cs = getComputedStyle(word);
    sctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    sctx.fillStyle = '#F3EDE3';
    sctx.textBaseline = 'alphabetic';
    sctx.textAlign = 'left';
    const m = sctx.measureText('K');
    const fs = parseFloat(cs.fontSize);
    const asc = m.fontBoundingBoxAscent || fs * .82, desc = m.fontBoundingBoxDescent || fs * .22;
    $$('span', word).forEach((sp) => {
      const r = sp.getBoundingClientRect();
      sctx.fillText(sp.textContent, r.left - hr.left, r.top - hr.top + (r.height - (asc + desc)) / 2 + asc);
    });
    $$('.hero__script', hero).forEach((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      sctx.save();
      sctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      sctx.translate(r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2);
      sctx.rotate(-6 * Math.PI / 180);
      sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
      sctx.fillStyle = '#C9D4FF';
      sctx.shadowColor = 'rgba(77,107,255,.9)'; sctx.shadowBlur = 24 * dpr;
      sctx.fillText(el.textContent, 0, 0);
      sctx.shadowBlur = 6 * dpr;
      sctx.fillText(el.textContent, 0, 0);
      sctx.restore();
    });
    if (gl) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
    }
  }

  // ---------- WebGL
  function initGL() {
    try { gl = glc.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) { gl = null; }
    if (!gl) return false;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { gl = null; return false; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aP');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uScene', 'uRes', 'uGlass', 'uH', 'uTime', 'uLevel', 'uTilt', 'uWave', 'uPour', 'uDpr', 'uClear', 'uA', 'uB', 'uRind', 'uFlesh', 'uI0', 'uI1', 'uI2']
      .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uScene, 0);
    return true;
  }

  // ---------- física del líquido
  const mixC = (k) => {
    const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const f = (key) => col.from[key].map((v, i) => lerp(v, col.to[key][i], e) / 255);
    return { a: f('a'), b: f('b'), rind: f('rind'), flesh: f('flesh'), clear: lerp(col.from.clear, col.to.clear, e) };
  };
  function step(dt) {
    time += dt;
    const maxOff = Math.min(W * .32, 340);
    const prev = st.off;
    if (st.drag) {
      st.off = lerp(st.off, st.target, 1 - Math.exp(-dt * 26));
      st.v = (st.off - prev) / Math.max(dt, 1e-3);
    } else {
      const goal = clamp(st.hover, -maxOff, maxOff);
      st.v += (-(st.off - goal) * 70 - st.v * 10) * dt;
      st.off += st.v * dt;
    }
    const acc = (st.v - st.lastV) / Math.max(dt, 1e-3);
    st.lastV = st.v;
    st.acc = lerp(st.acc, acc, .5);
    st.vt += (-st.tilt * 90 - st.vt * 4.2 - st.acc * .0026) * dt;
    st.tilt = clamp(st.tilt + st.vt * dt, -.42, .42);
    st.wave = clamp(st.wave * Math.exp(-dt * 1.3) + Math.abs(st.acc) * dt * .00008, .035, 1);
    // servir
    if (st.filling) {
      st.level = Math.min(st.fill, st.level + dt * .44);
      st.pour = Math.min(1, st.pour + dt * 5);
      st.wave = Math.max(st.wave, .22);
      if (st.level >= st.fill) st.filling = false;
    } else if (st.pourT > 0) {
      st.pourT -= dt; st.pour = Math.min(1, st.pour + dt * 6); st.wave = Math.max(st.wave, .3);
    } else st.pour = Math.max(0, st.pour - dt * 3);
    if (col.k < 1) col.k = Math.min(1, col.k + dt * 1.6);
  }
  function render() {
    if (!gl) return;
    const lvl = st.level * (1 - st.drain * .62);
    const c = mixC(col.k);
    const cx = (G.cx + st.off) * dpr, yB = G.yB * dpr, wt = G.wt * dpr, h = G.h * dpr;
    gl.viewport(0, 0, glc.width, glc.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, glc.width, glc.height);
    gl.uniform3f(U.uGlass, cx, yB, wt);
    gl.uniform1f(U.uH, h);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uLevel, lvl);
    gl.uniform1f(U.uTilt, st.tilt);
    gl.uniform1f(U.uWave, st.wave);
    gl.uniform1f(U.uPour, st.pour);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uClear, c.clear);
    gl.uniform3fv(U.uA, c.a); gl.uniform3fv(U.uB, c.b); gl.uniform3fv(U.uRind, c.rind); gl.uniform3fv(U.uFlesh, c.flesh);
    // hielos flotando en la superficie
    const bt = h * .075, floorY = yB - bt, ry = wt * .12, yT = yB - h;
    const yL = floorY - lvl * (floorY - (yT + ry * 2.4));
    const s = wt * .16;
    [-.44, .06, .5].forEach((o, i) => {
      const x = cx + o * wt * .78 + Math.sin(time * .6 + i * 2.1) * wt * .05;
      const y = yL + st.tilt * (x - cx) + s * .18 + Math.sin(time * 1.8 + i * 1.3) * 1.8 * dpr;
      const a = Math.atan(st.tilt) + Math.sin(time * .9 + i * 1.7) * .18 + i * .45;
      gl.uniform4f(U['uI' + i], x, lvl > .14 ? y : -9999, s, a);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function loop(now) {
    const dt = clamp((now - last) / 1000, .001, .05);
    last = now;
    step(dt);
    render();
    raf = running ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (running || reduced || !gl) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

  // ---------- interacción
  function hit(e) {
    const r = glc.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const cx = G.cx + st.off;
    return Math.abs(x - cx) < G.wt * 1.35 && y > G.yB - G.h - 50 && y < G.yB + 20;
  }
  glc.addEventListener('pointerdown', (e) => {
    if (!hit(e)) return;
    st.drag = true;
    st.grab = e.clientX - st.off;
    st.target = st.off;
    glc.classList.add('is-drag');
    try { glc.setPointerCapture(e.pointerId); } catch (_) {}
    hideHint();
  });
  glc.addEventListener('pointermove', (e) => {
    if (st.drag) {
      const maxOff = Math.min(W * .32, 340);
      st.target = clamp(e.clientX - st.grab, -maxOff, maxOff);
      if (reduced) { st.off = st.target; render(); }
    } else if (e.pointerType === 'mouse') {
      glc.style.cursor = hit(e) ? 'grab' : 'default';
    }
  });
  const end = () => { st.drag = false; glc.classList.remove('is-drag'); if (reduced) { st.off = 0; render(); } };
  glc.addEventListener('pointerup', end);
  glc.addEventListener('pointercancel', end);
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || st.drag) return;
    st.hover = (e.clientX - W / 2) * .045;
  });
  hero.addEventListener('pointerleave', () => { st.hover = 0; });
  const hint = $('.litro__hint');
  let hinted = false;
  function hideHint() { if (hinted) return; hinted = true; hint.style.transition = 'opacity .6s'; hint.style.opacity = '.35'; }

  // sabores
  $$('#chips button').forEach((b) => b.addEventListener('click', () => {
    const f = FLAVORS[+b.dataset.flavor];
    $$('#chips button').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
    if (col.to === f) return;
    const now = mixC(col.k);
    col.from = { a: now.a.map((v) => v * 255), b: now.b.map((v) => v * 255), rind: now.rind.map((v) => v * 255), flesh: now.flesh.map((v) => v * 255), clear: now.clear };
    col.to = f; col.k = reduced ? 1 : 0;
    st.pourT = .7; st.wave = Math.max(st.wave, .45);
    if (reduced) render();
  }));

  // ---------- arranque
  let resizeT = 0;
  function rebuild() { layout(); if (!W || !H) return; paintBg(); paintScene(); render(); }
  function boot() {
    const ok = initGL();
    if (!ok) hero.classList.add('no-gl');
    rebuild();
    window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(rebuild, 160); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(hero);
    } else start();
    if (reduced && gl) render();
    if (motion) {
      ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (s) => { st.drain = s.progress; if (!running) render(); } });
    }
  }
  return {
    boot,
    pour() { if (reduced) return; st.level = 0; st.filling = true; },
    repaint: paintScene
  };
})();

/* ----------------------------------------------------------
   ENTRADA: la lámpara se enciende y sube el telón
   ---------------------------------------------------------- */
const lamp = $('#lamp');
const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
function heroIntro() {
  if (!motion) return;
  gsap.from('.hero__word > span', { yPercent: 112, duration: 1.15, ease: 'expo.out', stagger: .06 });
  $$('.hero__script').forEach((el, i) => {
    gsap.set(el, { opacity: 0 });
    gsap.to(el, { delay: .55 + i * .3, keyframes: [{ opacity: 1, duration: .07 }, { opacity: .15, duration: .06 }, { opacity: 1, duration: .09 }, { opacity: .45, duration: .05 }, { opacity: 1, duration: .25 }] });
  });
  gsap.from('.hero__ui > *, .hero__down', { opacity: 0, y: 18, duration: .9, stagger: .1, delay: .7, ease: 'power3.out' });
}
fontsReady.then(() => {
  // en móvil el tamaño del título depende de la fuente: medir cuando ya está cargada
  Hero.boot();
  if (!motion) { lamp.remove(); Hero.pour(); return; }
  if (lenis) lenis.stop();
  const lines = $$('.lamp__line', lamp);
  lines.forEach((l) => { const L = l.getTotalLength(); l.style.strokeDasharray = L; l.style.strokeDashoffset = L; });
  const tl = gsap.timeline();
  tl.to(lines, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .08 })
    .add(() => lamp.classList.add('is-lit'), '-=.05')
    .to(lamp, { yPercent: -100, duration: .9, ease: 'expo.inOut', delay: .45 })
    .add(() => { heroIntro(); Hero.pour(); }, '-=.45')
    .add(() => { lamp.remove(); if (lenis) lenis.start(); });
});

/* ----------------------------------------------------------
   APARICIONES
   ---------------------------------------------------------- */
if (motion) {
  const words = new Map();
  const splitWords = () => $$('[data-words]').forEach((el) => {
    const prev = words.get(el);
    if (prev) { prev.scrollTrigger && prev.scrollTrigger.kill(); prev.kill(); }
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    words.set(el, gsap.fromTo($$('.w', el), { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true } }));
  });
  splitWords();
  onLang.push(splitWords);
  $$('.reveal').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(22% 8% 22% 8% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: true } });
    const img = $('img', el);
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.fade').forEach((el) => gsap.from(el, { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('.sec-head').forEach((el) => gsap.from(el.children, { opacity: 0, y: 34, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } }));
}

/* ----------------------------------------------------------
   CARTA · POSAVASOS
   ---------------------------------------------------------- */
(() => {
  const mesa = $('#mesa');
  const isDesk = () => matchMedia('(min-width: 761px)').matches;
  let z = 10;
  const items = $$('.coaster', mesa).map((el) => ({ el, x: 0, y: 0, r: +el.dataset.r || 0, vx: 0, vy: 0, drag: false, moved: 0, sx: 0, sy: 0, lt: 0, block: false }));
  const hint = document.createElement('p');
  hint.className = 'mesa__hint';
  mesa.appendChild(hint);
  const paintText = () => {
    hint.textContent = t(fine ? 'carta.hintFine' : 'carta.hintTouch');
    items.forEach((it) => it.el.setAttribute('aria-label', t('co.aria', { n: t(it.el.dataset.name) })));
  };
  paintText();
  onLang.push(paintText);
  const quiet = () => { hint.style.opacity = '0'; };

  const apply = (it) => { it.el.style.transform = `translate3d(${it.x}px, ${it.y}px, 0) rotate(${it.r}deg)`; };
  const bounds = (it) => {
    const d = it.el.offsetWidth, W = mesa.clientWidth, H = mesa.clientHeight;
    return { minX: -d * .12, maxX: W - d * .88, minY: -d * .12, maxY: H - d * .88 };
  };
  function place() {
    if (!isDesk()) { items.forEach((it) => { it.el.style.transform = ''; }); return; }
    const W = mesa.clientWidth, H = mesa.clientHeight;
    items.forEach((it) => {
      const d = it.el.offsetWidth;
      it.x = +it.el.dataset.x * W - d / 2;
      it.y = +it.el.dataset.y * H - d / 2;
      const b = bounds(it);
      it.x = clamp(it.x, b.minX, b.maxX); it.y = clamp(it.y, b.minY, b.maxY);
      apply(it);
    });
  }
  const flip = (it) => {
    const on = !it.el.classList.contains('is-flipped');
    it.el.classList.toggle('is-flipped', on);
    it.el.setAttribute('aria-pressed', String(on));
    it.el.style.zIndex = ++z;
    quiet();
  };
  let raf = 0, last = 0;
  function glide(now) {
    const dt = clamp((now - last) / 1000, .001, .04); last = now;
    let moving = false;
    items.forEach((it) => {
      if (it.drag || (Math.abs(it.vx) < 4 && Math.abs(it.vy) < 4)) return;
      moving = true;
      const b = bounds(it);
      it.x += it.vx * dt; it.y += it.vy * dt;
      if (it.x < b.minX || it.x > b.maxX) { it.x = clamp(it.x, b.minX, b.maxX); it.vx *= -.45; }
      if (it.y < b.minY || it.y > b.maxY) { it.y = clamp(it.y, b.minY, b.maxY); it.vy *= -.45; }
      const k = Math.exp(-dt * 3.6);
      it.vx *= k; it.vy *= k;
      it.r += it.vx * dt * .05;
      apply(it);
    });
    raf = moving ? requestAnimationFrame(glide) : 0;
  }
  items.forEach((it) => {
    const el = it.el;
    el.addEventListener('pointerdown', (e) => {
      if (!isDesk() || e.button > 0) return;
      it.drag = true; it.moved = 0; it.vx = it.vy = 0;
      it.sx = e.clientX - it.x; it.sy = e.clientY - it.y; it.lt = performance.now();
      el.style.zIndex = ++z;
      el.classList.add('is-drag');
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener('pointermove', (e) => {
      if (!it.drag) return;
      const now = performance.now(), dt = Math.max(.008, (now - it.lt) / 1000); it.lt = now;
      const b = bounds(it);
      const nx = clamp(e.clientX - it.sx, b.minX, b.maxX), ny = clamp(e.clientY - it.sy, b.minY, b.maxY);
      it.vx = lerp(it.vx, (nx - it.x) / dt, .5); it.vy = lerp(it.vy, (ny - it.y) / dt, .5);
      it.moved += Math.abs(nx - it.x) + Math.abs(ny - it.y);
      it.r = clamp(it.r + (nx - it.x) * .04, -40, 40);
      it.x = nx; it.y = ny;
      apply(it);
      if (it.moved > 6) quiet();
    });
    const up = () => {
      if (!it.drag) return;
      it.drag = false;
      el.classList.remove('is-drag');
      it.block = it.moved > 6;
      if (it.block && !reduced && !raf) { last = performance.now(); raf = requestAnimationFrame(glide); }
      if (!it.block) { it.vx = it.vy = 0; }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', () => { if (it.block) { it.block = false; return; } flip(it); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(it); } });
  });
  place();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(place, 150); });
  if (motion) {
    gsap.from(items.map((i) => i.el), { '--k': 1.35, opacity: 0, duration: .9, ease: 'back.out(1.6)', stagger: .12, scrollTrigger: { trigger: mesa, start: 'top 72%' } });
  }
})();

/* ----------------------------------------------------------
   CROMOS · SOBRE, MAZO Y ÁLBUM
   ---------------------------------------------------------- */
(() => {
  const sec = $('#cromos'), sobre = $('#sobre'), strip = $('#sobreStrip'), handle = $('#sobreHandle');
  const deck = $('#deck'), gridEl = $('#albumGrid'), albumEl = $('.album', sec);
  const N = CROMOS.length;
  const pad = (n) => String(n).padStart(2, '0');
  let active = 0, open = false;
  const seen = new Set();

  const cards = CROMOS.map((c, i) => {
    const f = document.createElement('figure');
    f.className = 'card' + (c.holo ? ' is-holo' : '');
    f.innerHTML = `<div class="card__img" style="background-image:url('${IMG(c.img)}')"><span class="card__holo"></span><span class="card__glare"></span></div>
      <figcaption><span class="card__n">${pad(i + 1)}</span><span class="card__t"></span></figcaption>`;
    f.style.setProperty('--s', '.62');
    f.style.setProperty('--y', '30px');
    f.style.opacity = '0';
    deck.appendChild(f);
    return f;
  });
  const slots = CROMOS.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.textContent = i + 1;
    b.addEventListener('click', () => { if (!open) openPack(true); go(i); });
    gridEl.appendChild(b);
    return b;
  });

  const paintText = () => {
    cards.forEach((f, i) => {
      const c = CROMOS[i];
      f.setAttribute('aria-roledescription', t('card.role'));
      if (c.holo) f.dataset.holo = t('card.brill');
      $('.card__t', f).innerHTML = `${t(c.t)}<small>${t(c.c)}</small>`;
      slots[i].setAttribute('aria-label', t('slot.aria', { n: i + 1, t: t(c.t) }));
    });
  };
  paintText();
  onLang.push(paintText);

  function see(i) {
    slots.forEach((s, k) => s.classList.toggle('is-current', k === i && open));
    if (seen.has(i)) return;
    seen.add(i);
    const s = slots[i];
    s.style.backgroundImage = `url('${IMG(CROMOS[i].img)}')`;
    s.classList.add('is-on');
    $('#albumN').textContent = seen.size;
    if (seen.size === N) albumEl.classList.add('is-complete');
  }
  function layout() {
    const cw = cards[0].offsetWidth || 280;
    cards.forEach((el, i) => {
      let d = i - active;
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      let x = 0, y = 0, r = 0, s = 1, o = 1, zz = 50;
      if (d > 0) { const k = Math.min(d, 4); x = k * cw * .17; y = -k * 6; r = k * 4.5; s = 1 - k * .06; o = d > 3 ? 0 : 1 - d * .16; zz = 50 - d; }
      if (d < 0) { x = -cw * .78; y = 14; r = -11; s = .88; o = d === -1 ? .3 : 0; zz = 40 + d; }
      el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px');
      el.style.setProperty('--r', r + 'deg'); el.style.setProperty('--s', s);
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      el.style.opacity = o; el.style.zIndex = zz;
      el.classList.toggle('is-active', d === 0);
      el.setAttribute('aria-hidden', String(d !== 0));
    });
    $('#deckN').textContent = pad(active + 1);
  }
  function go(i) { active = (i + N) % N; layout(); see(active); }

  function openPack(fast) {
    if (open) return;
    open = true;
    sec.classList.add('is-open');
    sobre.classList.add('is-open');
    deck.classList.add('is-ready');
    deck.tabIndex = 0;
    if (!motion || fast) {
      sobre.style.display = 'none';
      go(active);
      return;
    }
    const tl = gsap.timeline();
    tl.to(sobre, { '--p': 1, duration: .3, ease: 'power2.out' })
      .to(strip, { x: 140, y: -180, rotation: 38, opacity: 0, duration: .75, ease: 'power2.in' })
      .to('.sobre__body', { y: 40, scale: .96, duration: .25, ease: 'power2.out' }, '-=.5')
      .add(() => {
        cards.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i, 5) * .07}s`; });
        go(0);
        setTimeout(() => cards.forEach((el) => { el.style.transitionDelay = ''; }), 1200);
      }, '-=.2')
      .to('.sobre__body', { y: 320, opacity: 0, duration: .8, ease: 'power3.in' }, '-=.1')
      .add(() => { sobre.style.display = 'none'; });
  }

  // rasgar la tira
  let pulling = false, sx = 0, moved = 0;
  handle.addEventListener('pointerdown', (e) => {
    if (open) return;
    pulling = true; sx = e.clientX; moved = 0;
    sobre.classList.add('is-pulling');
    try { handle.setPointerCapture(e.pointerId); } catch (_) {}
  });
  handle.addEventListener('pointermove', (e) => {
    if (!pulling) return;
    moved = Math.max(moved, Math.abs(e.clientX - sx));
    const p = clamp((e.clientX - sx) / (sobre.offsetWidth * .8), 0, 1);
    sobre.style.setProperty('--p', p);
    if (p > .62) { pulling = false; openPack(); }
  });
  const release = () => {
    if (!pulling) return;
    pulling = false;
    sobre.classList.remove('is-pulling');
    if (moved < 6) { openPack(); return; }
    if (motion) gsap.to(sobre, { '--p': 0, duration: .4, ease: 'back.out(2)' }); else sobre.style.setProperty('--p', 0);
  };
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);
  handle.addEventListener('click', (e) => { if (e.detail === 0) openPack(); });
  $('.sobre__body').addEventListener('click', () => openPack());

  // pasar cromos
  $('#deckPrev').addEventListener('click', () => go(active - 1));
  $('#deckNext').addEventListener('click', () => go(active + 1));
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
  });
  let dx = 0, dsx = 0, ddrag = false;
  deck.addEventListener('pointerdown', (e) => {
    if (!open) return;
    ddrag = true; dsx = e.clientX; dx = 0;
    cards[active].classList.add('is-drag');
  });
  deck.addEventListener('pointermove', (e) => {
    const el = cards[active];
    if (ddrag) {
      dx = e.clientX - dsx;
      el.style.setProperty('--x', dx + 'px');
      el.style.setProperty('--r', dx * .04 + 'deg');
      return;
    }
    if (!open || e.pointerType !== 'mouse' || reduced) return;
    const r = el.getBoundingClientRect();
    const mx = clamp((e.clientX - r.left) / r.width, 0, 1), my = clamp((e.clientY - r.top) / r.height, 0, 1);
    el.classList.add('is-tilt');
    el.style.setProperty('--mx', mx * 100 + '%'); el.style.setProperty('--my', my * 100 + '%');
    el.style.setProperty('--rx', (.5 - my) * 16 + 'deg'); el.style.setProperty('--ry', (mx - .5) * 20 + 'deg');
  });
  const dend = () => {
    if (!ddrag) return;
    ddrag = false;
    cards[active].classList.remove('is-drag');
    if (dx < -60) go(active + 1); else if (dx > 60) go(active - 1); else layout();
  };
  deck.addEventListener('pointerup', dend);
  deck.addEventListener('pointercancel', dend);
  deck.addEventListener('pointerleave', () => {
    dend();
    const el = cards[active];
    el.classList.remove('is-tilt');
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
  });
  window.addEventListener('resize', () => { if (open) layout(); });

  if (reduced) openPack(true);
  if (motion) gsap.from(sobre, { y: 120, rotation: -8, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: sec, start: 'top 55%' } });
})();

/* ----------------------------------------------------------
   PARTIDOS · EL BALÓN ELIGE EL VÍDEO
   ---------------------------------------------------------- */
(() => {
  const campo = $('#campo'), wrap = $('#players'), balon = $('#balon');
  const aimLine = $('#aimLine'), aimDot = $('#aimDot'), golEl = $('#gol');
  const video = $('#pVideo'), frame = $('.pantalla__frame'), soundBtn = $('#pSound');
  const hintEl = $('.campo__hint', campo);
  let cur = -1, sound = false, inView = false;

  const players = CLIPS.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'player';
    b.style.left = c.x + '%'; b.style.top = c.y + '%';
    b.style.setProperty('--c1', c.c1); b.style.setProperty('--c2', c.c2);
    b.innerHTML = `<img src="${IMG('poster/' + c.id + '.jpg')}" alt="" loading="lazy"><span class="player__lab"></span>`;
    b.addEventListener('click', () => select(i, true));
    wrap.appendChild(b);
    return b;
  });

  const paintCap = () => {
    if (cur < 0) return;
    const c = CLIPS[cur];
    $('#pDate').textContent = c.d ? 'Instagram · ' + fmtDate(c.d) : t('part.maps');
    $('#pTitle').textContent = t(c.t);
    $('#pTags').textContent = c.tags || t('part.mapsTags');
  };
  const paintText = () => {
    players.forEach((b, i) => {
      const name = t(CLIPS[i].t);
      b.setAttribute('aria-label', t('player.aria', { t: name }));
      $('.player__lab', b).textContent = name.split(' · ')[0];
    });
    paintCap();
  };
  function select(i, user) {
    if (i === cur) { if (video.paused) play(video); return; }
    cur = i;
    const c = CLIPS[i];
    players.forEach((p, k) => p.classList.toggle('is-on', k === i));
    paintCap();
    frame.style.backgroundImage = `url('${IMG('poster/' + c.id + '.jpg')}')`;
    frame.classList.add('is-switch');
    setTimeout(() => {
      video.poster = IMG('poster/' + c.id + '.jpg');
      video.src = VID(c.id + '.mp4');
      video.muted = !sound;
      if (inView || user) play(video);
      frame.classList.remove('is-switch');
    }, reduced ? 0 : 220);
  }
  $('#pPrev').addEventListener('click', () => select((cur - 1 + CLIPS.length) % CLIPS.length, true));
  $('#pNext').addEventListener('click', () => select((cur + 1) % CLIPS.length, true));
  soundBtn.addEventListener('click', () => {
    sound = !sound;
    video.muted = !sound;
    soundBtn.setAttribute('aria-pressed', String(sound));
    $('i', soundBtn).className = 'ph-bold ' + (sound ? 'ph-speaker-high' : 'ph-speaker-slash');
    if (sound) play(video);
  });

  // balón
  let W = 0, H = 0, R = 0, bx = 0, by = 0, vx = 0, vy = 0, rot = 0, drag = false, pullX = 0, pullY = 0, raf = 0, last = 0, lockGoal = false;
  const lastHit = new Map();
  const measure = () => {
    const oW = W, oH = H;
    W = campo.clientWidth; H = campo.clientHeight; R = balon.offsetWidth / 2;
    if (oW) { bx *= W / oW; by *= H / oH; } else { bx = W * .07; by = H * .5; }
    draw();
  };
  const draw = () => { balon.style.transform = `translate3d(${bx - R}px, ${by - R}px, 0) rotate(${rot}deg)`; };
  const setAim = (on) => {
    if (!on) { aimLine.setAttribute('x2', 0); aimLine.setAttribute('x1', 0); aimLine.setAttribute('y1', 0); aimLine.setAttribute('y2', 0); aimDot.setAttribute('r', 0); return; }
    const len = Math.hypot(pullX, pullY);
    const k = 2.4;
    aimLine.setAttribute('x1', bx); aimLine.setAttribute('y1', by);
    aimLine.setAttribute('x2', bx - pullX * k); aimLine.setAttribute('y2', by - pullY * k);
    aimDot.setAttribute('cx', bx + pullX); aimDot.setAttribute('cy', by + pullY);
    aimDot.setAttribute('r', clamp(len * .12, 4, 16));
  };
  function goal() {
    if (lockGoal) return;
    lockGoal = true;
    golEl.textContent = t('part.goal');
    golEl.classList.remove('is-on'); void golEl.offsetWidth; golEl.classList.add('is-on');
    select(CLIPS.findIndex((c) => c.id === 'DbAu27uIdGW'), true);
    vx = vy = 0;
    setTimeout(() => { bx = W * .07; by = H * .5; draw(); lockGoal = false; }, 1300);
  }
  function tick(now) {
    const dt = clamp((now - last) / 1000, .001, .033); last = now;
    const steps = 3;
    for (let s = 0; s < steps; s++) {
      const h = dt / steps;
      bx += vx * h; by += vy * h;
      const mouthTop = H * .41, mouthBot = H * .59;
      if (bx > W - R) {
        if (by > mouthTop && by < mouthBot) { goal(); break; }
        bx = W - R; vx = -Math.abs(vx) * .72;
      }
      if (bx < R) { bx = R; vx = Math.abs(vx) * .72; }
      if (by < R) { by = R; vy = Math.abs(vy) * .72; }
      if (by > H - R) { by = H - R; vy = -Math.abs(vy) * .72; }
      players.forEach((p, i) => {
        const pr = p.offsetWidth / 2;
        const px = CLIPS[i].x / 100 * W, py = CLIPS[i].y / 100 * H;
        const dx = bx - px, dy = by - py, d = Math.hypot(dx, dy);
        if (d < pr + R && d > 0) {
          const nx = dx / d, ny = dy / d;
          bx = px + nx * (pr + R); by = py + ny * (pr + R);
          const vn = vx * nx + vy * ny;
          if (vn < 0) { vx -= 2 * vn * nx; vy -= 2 * vn * ny; vx *= .8; vy *= .8; }
          const t = performance.now();
          if (t - (lastHit.get(i) || 0) > 500) {
            lastHit.set(i, t);
            p.classList.remove('is-hit'); void p.offsetWidth; p.classList.add('is-hit');
            select(i, true);
          }
        }
      });
    }
    const k = Math.exp(-dt * 1.15);
    vx *= k; vy *= k;
    rot += Math.hypot(vx, vy) * dt * 2.2 * (vx >= 0 ? 1 : -1);
    draw();
    if (Math.hypot(vx, vy) > 6 && !drag) raf = requestAnimationFrame(tick); else { raf = 0; vx = vy = 0; }
  }
  balon.addEventListener('pointerdown', (e) => {
    drag = true; vx = vy = 0; pullX = pullY = 0;
    cancelAnimationFrame(raf); raf = 0;
    balon.classList.add('is-drag');
    try { balon.setPointerCapture(e.pointerId); } catch (_) {}
    if (hintEl) hintEl.style.opacity = '0';
  });
  balon.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = campo.getBoundingClientRect();
    let x = e.clientX - r.left - bx, y = e.clientY - r.top - by;
    const L = Math.hypot(x, y), M = Math.min(W * .2, 170);
    if (L > M) { x *= M / L; y *= M / L; }
    pullX = x; pullY = y;
    setAim(true);
  });
  const shoot = () => {
    if (!drag) return;
    drag = false;
    balon.classList.remove('is-drag');
    setAim(false);
    const L = Math.hypot(pullX, pullY);
    if (L < 10) {
      // toque sin tirar: un pase suave hacia el jugador más cercano por delante
      const t = CLIPS.map((c, i) => ({ i, dx: c.x / 100 * W - bx, dy: c.y / 100 * H - by })).filter((o) => o.dx > 0).sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy))[0];
      if (!t) return;
      const d = Math.hypot(t.dx, t.dy);
      vx = t.dx / d * 520; vy = t.dy / d * 520;
    } else {
      const power = (W / 700) * 9.5;
      vx = -pullX * power; vy = -pullY * power;
    }
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  balon.addEventListener('pointerup', shoot);
  balon.addEventListener('pointercancel', () => { drag = false; balon.classList.remove('is-drag'); setAim(false); });
  balon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select((cur + 1) % CLIPS.length, true);
    }
  });

  paintText();
  onLang.push(paintText);
  measure();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 120); });
  select(0, false);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => {
      inView = en[0].isIntersecting;
      if (inView) { if (video.src) play(video); } else video.pause();
    }, { threshold: .35 }).observe(frame);
  }
  if (motion) {
    gsap.from(players, { scale: 0, opacity: 0, duration: .7, ease: 'back.out(2)', stagger: .06, scrollTrigger: { trigger: campo, start: 'top 75%' }, clearProps: 'transform,opacity' });
  }
})();

/* ----------------------------------------------------------
   MAPA (se carga solo si se pide) y rótulo del pie
   ---------------------------------------------------------- */
$('#mapaLoad').addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.title = t('vis.mapTitle');
  f.src = 'https://maps.google.com/maps?q=Kikos%20bar%20restaurant%2C%20Passeig%20d%27Agust%C3%AD%20Font%206%2C%20Lloret%20de%20Mar&z=17&output=embed&hl=' + lang;
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer-when-downgrade';
  $('#mapa').replaceChildren(f);
});
const neon = $('.foot__neon');
if (!reduced && 'IntersectionObserver' in window) {
  new IntersectionObserver((en) => neon.classList.toggle('is-flicker', en[0].isIntersecting)).observe(neon);
}
if (hasGSAP) window.addEventListener('load', () => ScrollTrigger.refresh());
})();
