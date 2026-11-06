/* =========================================================
   PARKET ART – skripte
   ---------------------------------------------------------
   KONTAKT PODACI: promijenite ovdje i automatski se
   ažuriraju na cijeloj stranici.
   ========================================================= */
const CONFIG = {
  phoneDisplay: '+385 XX XXX XXXX',  // kako se broj prikazuje
  phoneIntl: '385000000000',         // samo znamenke, bez + (za tel: i WhatsApp)
  email: 'info@parket-art.hr',
  whatsappText: 'Pozdrav! Zanima me ponuda za pod.',
  // Opcionalno: endpoint za slanje obrasca (npr. Formspree: https://formspree.io/f/xxxx).
  // Ako je prazno, obrazac otvara e-mail program s ispunjenim upitom.
  formEndpoint: ''
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 300 }) : cb => setTimeout(cb, 16);
const loadImage = src => new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = src; });

/* =========================================================
   Proceduralne teksture materijala
   ========================================================= */
const Tex = (() => {
  const rng = seed => {
    let s = Math.floor(seed * 9973) % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  };
  const hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(1)},${clamp(s, 0, 100).toFixed(1)}%,${clamp(l, 0, 100).toFixed(1)}%,${a})`;
  const PAL = {
    oak:   { h: [24, 33], s: [40, 56], l: [33, 50] },
    light: { h: [28, 36], s: [38, 50], l: [44, 58] },
    raw:   { h: [30, 38], s: [26, 38], l: [60, 72] },
    vinyl: { h: [30, 37], s: [18, 28], l: [60, 70] }
  };

  function plankSprite(L, W, pal, r, sc) {
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(L * sc));
    c.height = Math.max(2, Math.round(W * sc));
    const g = c.getContext('2d');
    g.scale(sc, sc);
    const h = lerp(pal.h[0], pal.h[1], r()), s = lerp(pal.s[0], pal.s[1], r()), l = lerp(pal.l[0], pal.l[1], r());
    const lg = g.createLinearGradient(0, 0, L, 0);
    lg.addColorStop(0, hsl(h, s, l + (r() - .5) * 8));
    lg.addColorStop(.5, hsl(h, s, l));
    lg.addColorStop(1, hsl(h, s, l + (r() - .5) * 8));
    g.fillStyle = lg;
    g.fillRect(0, 0, L, W);
    const n = Math.max(7, Math.round(W / 1.2));
    for (let i = 0; i < n; i++) {
      const y0 = r() * W, amp = .3 + r() * 1.3, fr = .008 + r() * .035, ph = r() * 6.3;
      g.beginPath();
      for (let x = 0; x <= L; x += 3) {
        const y = y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * fr * 3.3 + ph * 2) * amp * .3;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      const dark = r() < .75;
      g.strokeStyle = dark ? hsl(h, s + 6, l - 17, .08 + r() * .2) : hsl(h, s - 10, l + 14, .05 + r() * .12);
      g.lineWidth = .3 + r() * .9;
      g.stroke();
    }
    if (r() < .4) {
      const cx = r() * L, cy = W / 2 + (r() - .5) * W * .3;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.ellipse(cx, cy, W * .7 + k * W * .35, W * .1 + k * W * .07, 0, 0, Math.PI * 2);
        g.strokeStyle = hsl(h, s, l - 15, .13);
        g.lineWidth = .6;
        g.stroke();
      }
    }
    if (r() < .14) {
      const kx = r() * L, ky = W * (.3 + r() * .4), kr = W * (.08 + r() * .08);
      g.fillStyle = hsl(h, s, l - 24, .55);
      g.beginPath(); g.ellipse(kx, ky, kr * 2, kr, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(255,240,220,.12)';
    g.fillRect(0, 0, L, .7); g.fillRect(0, 0, .7, W);
    g.fillStyle = 'rgba(25,12,4,.5)';
    g.fillRect(0, W - .9, L, .9); g.fillRect(L - .9, 0, .9, W);
    return c;
  }

  const sprites = (pal, L, W, n, seed, sc) => {
    const r = rng(seed);
    return Array.from({ length: n }, () => plankSprite(L, W, PAL[pal], r, sc));
  };

  // Riblja kost: rešetka a = (W, W), b = (L, -L), zarotirana za 45°
  function hbLayout(w, h, W, L, rand) {
    const th = Math.PI / 4, c = Math.cos(th), s = Math.sin(th);
    const R = Math.hypot(w, h) / 2 + L;
    const ni = Math.ceil(R / (W * Math.SQRT2)) + 1, nj = Math.ceil(R / (L * Math.SQRT2)) + 1;
    const out = [];
    const push = (x, y, rot) => {
      const sx = w / 2 + x * c - y * s, sy = h / 2 + x * s + y * c;
      if (sx < -L || sx > w + L || sy < -L || sy > h + L) return;
      out.push({ x: sx, y: sy, r: rot + th, k: (rand() * 1e6) | 0, f: rand() < .5 });
    };
    for (let i = -ni; i <= ni; i++) {
      for (let j = -nj; j <= nj; j++) {
        const tx = i * W + j * L, ty = i * W - j * L;
        push(tx + L / 2, ty + W / 2, 0);
        push(tx + W / 2, ty + W + L / 2, Math.PI / 2);
      }
    }
    return out;
  }

  function herringbone(g, w, h, W, seed, sc, pal = 'oak', ratio = 6) {
    const L = W * ratio;
    const spr = sprites(pal, L, W, 14, seed * 7 + 3, sc);
    for (const p of hbLayout(w, h, W, L, rng(seed))) {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      if (p.f) g.scale(-1, 1);
      g.drawImage(spr[p.k % spr.length], -L / 2, -W / 2, L, W);
      g.restore();
    }
  }

  function chevron(g, w, h, W, seed, sc) {
    const r = rng(seed);
    const C = W * 3.6, Hp = W * 1.25, L = C * 1.7;
    const spr = sprites('oak', L, Hp, 14, seed * 5 + 1, sc);
    for (let k = 0, x0 = -C * .3; x0 < w; k++, x0 += C) {
      const up = k % 2 === 0;
      for (let y = -C - Hp; y < h + Hp; y += Hp) {
        const ytl = up ? y + C : y, ytr = up ? y : y + C;
        const path = () => { g.beginPath(); g.moveTo(x0, ytl); g.lineTo(x0 + C, ytr); g.lineTo(x0 + C, ytr + Hp); g.lineTo(x0, ytl + Hp); g.closePath(); };
        g.save();
        path(); g.clip();
        g.translate(x0 + C / 2, (ytl + ytr) / 2 + Hp / 2);
        g.rotate(up ? -Math.PI / 4 : Math.PI / 4);
        g.drawImage(spr[(r() * spr.length) | 0], -L / 2, -Hp / 2, L, Hp);
        g.restore();
        path();
        g.strokeStyle = 'rgba(30,15,5,.45)'; g.lineWidth = .8; g.stroke();
      }
    }
  }

  function planks(g, w, h, W, L, seed, sc, pal = 'oak') {
    const r = rng(seed);
    const spr = sprites(pal, L, W, 14, seed * 3 + 1, sc);
    for (let y = 0; y < h; y += W) {
      let x = -r() * L;
      while (x < w) {
        const len = L * (.55 + r() * .45);
        const sp = spr[(r() * spr.length) | 0];
        g.drawImage(sp, 0, 0, sp.width * len / L, sp.height, x, y, len, W);
        g.fillStyle = 'rgba(30,15,5,.5)';
        g.fillRect(x + len - .9, y, .9, W);
        x += len;
      }
    }
  }

  function basket(g, w, h, W, seed, sc) {
    const r = rng(seed);
    const n = 4, S = W * n;
    const spr = sprites('oak', S, W, 14, seed * 11 + 2, sc);
    for (let y = 0, j = 0; y < h; y += S, j++) {
      for (let x = 0, i = 0; x < w; x += S, i++) {
        const horiz = (i + j) % 2 === 0;
        for (let k = 0; k < n; k++) {
          const sp = spr[(r() * spr.length) | 0];
          if (horiz) g.drawImage(sp, x, y + k * W, S, W);
          else { g.save(); g.translate(x + k * W + W / 2, y + S / 2); g.rotate(Math.PI / 2); g.drawImage(sp, -S / 2, -W / 2, S, W); g.restore(); }
        }
      }
    }
  }

  let noise = null;
  function noiseTile() {
    if (noise) return noise;
    noise = document.createElement('canvas');
    noise.width = noise.height = 128;
    const g = noise.getContext('2d');
    const id = g.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 26;
    }
    g.putImageData(id, 0, 0);
    return noise;
  }
  const grain = (g, w, h) => { g.fillStyle = g.createPattern(noiseTile(), 'repeat'); g.fillRect(0, 0, w, h); };

  function blob(g, x, y, rad, rgb, a) {
    const rg = g.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, `rgba(${rgb},${a})`);
    rg.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = rg;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  function microcement(g, w, h, seed, base, light = .14, dark = .11) {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const M = Math.max(w, h);
    for (let i = 0; i < 70; i++) {
      const isLight = r() < .5;
      blob(g, r() * w, r() * h, (.06 + r() * .32) * M, isLight ? '255,255,255' : '60,55,48', isLight ? light : dark);
    }
    for (let i = 0; i < 30; i++) {
      g.beginPath();
      g.ellipse(r() * w, r() * h, M * (.05 + r() * .2), M * (.01 + r() * .05), r() * Math.PI, 0, Math.PI * (.4 + r() * .8));
      g.strokeStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(60,50,40,.06)';
      g.lineWidth = 4 + r() * 16;
      g.stroke();
    }
    grain(g, w, h);
  }

  function epoxy(g, w, h, seed) {
    const r = rng(seed);
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#4c5259'); bg.addColorStop(1, '#2c3035');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cols = ['#e6e0d6', '#a39a8f', '#6d655c', '#cfc6b8', '#3b3631', '#f4efe7', '#8a7f72'];
    const n = Math.round(w * h / 50);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, s = .8 + r() * 2.6, rot = r() * 6.28, pts = 3 + ((r() * 3) | 0);
      g.fillStyle = cols[(r() * cols.length) | 0];
      g.beginPath();
      for (let k = 0; k < pts; k++) {
        const a = rot + k / pts * 6.28, rr = s * (.6 + r() * .6);
        k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.fill();
    }
    blob(g, w * .72, h * .28, Math.max(w, h) * .45, '255,255,255', .12);
    gloss(g, w, h, .2);
  }

  function gloss(g, w, h, a) {
    const lg = g.createLinearGradient(0, 0, w, h);
    lg.addColorStop(0, `rgba(255,248,235,${a * .25})`);
    lg.addColorStop(.36, 'rgba(255,248,235,0)');
    lg.addColorStop(.5, `rgba(255,248,235,${a})`);
    lg.addColorStop(.64, 'rgba(255,248,235,0)');
    lg.addColorStop(1, `rgba(20,10,0,${a * .7})`);
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
  }

  function wear(g, w, h, seed) {
    const r = rng(seed * 13 + 5);
    g.save();
    g.globalCompositeOperation = 'saturation';
    g.globalAlpha = .72;
    g.fillStyle = 'hsl(35,10%,50%)'; g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(140,128,108,.34)'; g.fillRect(0, 0, w, h);
    const M = Math.max(w, h);
    for (let i = 0; i < 6; i++) blob(g, r() * w, r() * h, M * (.15 + r() * .25), '205,192,168', .22);
    for (let i = 0; i < 7; i++) blob(g, r() * w, r() * h, M * (.03 + r() * .08), '40,28,14', .34);
    g.lineCap = 'round';
    const n = Math.round(w * h / 1300);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, len = 6 + r() * 40, a = r() * Math.PI;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.strokeStyle = r() < .7 ? 'rgba(232,222,200,.3)' : 'rgba(40,28,15,.32)';
      g.lineWidth = .4 + r() * .9; g.stroke();
    }
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, M * .75);
    vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,.45)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    grain(g, w, h);
    g.restore();
  }

  function rawFinish(g, w, h, seed) {
    const r = rng(seed * 17 + 9);
    g.save();
    g.fillStyle = 'rgba(255,250,240,.16)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = r() * w, y = r() * h, rad = 8 + r() * 26;
      g.beginPath(); g.arc(x, y, rad, r() * 6, r() * 6 + 1.5 + r() * 2);
      g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = .6; g.stroke();
    }
    grain(g, w, h);
    g.restore();
  }

  function lacquer(g, w, h) {
    g.save();
    g.globalCompositeOperation = 'overlay';
    g.fillStyle = 'rgba(185,110,45,.2)'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    gloss(g, w, h, .26);
    blob(g, w * .3, h * .2, Math.max(w, h) * .35, '255,245,225', .12);
    g.restore();
  }

  function render(type, w, h, seed) {
    const cv = document.createElement('canvas');
    const sc = Math.min(DPR, 1.75);
    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    const g = cv.getContext('2d');
    g.scale(sc, sc);
    const W = clamp(w / 26, 12, 24), WL = clamp(w / 17, 16, 34), WS = clamp(w / 22, 14, 30);
    switch (type) {
      case 'herringbone': herringbone(g, w, h, W, seed, sc); gloss(g, w, h, .12); break;
      case 'herringbone-lg': herringbone(g, w, h, WL, seed, sc, 'oak', 7); gloss(g, w, h, .14); break;
      case 'before': herringbone(g, w, h, WS, seed, sc); wear(g, w, h, seed); break;
      case 'raw': herringbone(g, w, h, WS, seed, sc, 'raw'); rawFinish(g, w, h, seed); break;
      case 'after': herringbone(g, w, h, WS, seed, sc); lacquer(g, w, h); break;
      case 'split': {
        herringbone(g, w, h, W, seed, sc);
        g.save();
        g.beginPath(); g.moveTo(0, 0); g.lineTo(w * .58, 0); g.lineTo(w * .42, h); g.lineTo(0, h); g.closePath(); g.clip();
        wear(g, w, h, seed);
        g.restore();
        g.save();
        g.beginPath(); g.moveTo(w * .58, 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(w * .42, h); g.closePath(); g.clip();
        lacquer(g, w, h);
        g.restore();
        break;
      }
      case 'chevron': chevron(g, w, h, W, seed, sc); gloss(g, w, h, .12); break;
      case 'chevron-lg': chevron(g, w, h, WL * .9, seed, sc); gloss(g, w, h, .14); break;
      case 'planks': planks(g, w, h, W * 1.15, W * 9, seed, sc); gloss(g, w, h, .14); break;
      case 'planks-lg': planks(g, w, h, WL * 1.3, WL * 10, seed, sc, 'light'); gloss(g, w, h, .16); break;
      case 'basket': basket(g, w, h, WL * .75, seed, sc); gloss(g, w, h, .14); break;
      case 'vinyl': planks(g, w, h, W * 1.7, W * 13, seed, sc, 'vinyl'); gloss(g, w, h, .16); break;
      case 'microcement': microcement(g, w, h, seed, '#bdb8ae'); break;
      case 'microcement-lg': microcement(g, w, h, seed, '#b9b3a8'); break;
      case 'estrih': microcement(g, w, h, seed, '#57564f', .07, .16); break;
      case 'epoxy': epoxy(g, w, h, seed); break;
    }
    return cv;
  }

  // Fotografija izrezana na zadanu veličinu (object-fit: cover)
  function photo(img, w, h) {
    const cv = document.createElement('canvas');
    const sc = Math.min(DPR, 1.75);
    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    const g = cv.getContext('2d');
    const k = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
    g.drawImage(img, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh);
    return cv;
  }

  return { rng, sprites, hbLayout, render, photo };
})();

/* =========================================================
   Pokretanje
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  applyContacts();
  initNav();
  initHero();
  initTextures();
  initIntro();
  initScrollFx();
  initServices();
  initSlogovi();
  initSander();
  initForm();
  initRevealFallback();
});

function applyContacts() {
  document.querySelectorAll('[data-phone]').forEach(a => a.href = `tel:+${CONFIG.phoneIntl}`);
  document.querySelectorAll('[data-phone-text]').forEach(el => el.textContent = CONFIG.phoneDisplay);
  document.querySelectorAll('[data-email]').forEach(a => a.href = `mailto:${CONFIG.email}`);
  document.querySelectorAll('[data-email-text]').forEach(el => el.textContent = CONFIG.email);
  document.querySelectorAll('[data-whatsapp]').forEach(a =>
    a.href = `https://wa.me/${CONFIG.phoneIntl}?text=${encodeURIComponent(CONFIG.whatsappText)}`);
  const now = new Date();
  document.getElementById('year').textContent = now.getFullYear();
  document.getElementById('form-date').textContent = `${now.getDate()}. ${now.getMonth() + 1}. ${now.getFullYear()}.`;

  // Poveznice usluga unaprijed odabiru uslugu u obrascu
  document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {
    const radio = document.querySelector(`.chips input[value="${a.dataset.service}"]`);
    if (radio) radio.checked = true;
  }));
}

/* ---------- Navigacija ---------- */
function initNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggle = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

  const links = [...nav.querySelectorAll('a')];
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean).forEach(s => io.observe(s));
}

/* ---------- Hero: kredna linija, pa parket od nje prema van ---------- */
function initHero() {
  const hero = document.querySelector('.hero');
  const stage = document.getElementById('hero-stage');
  const cv = document.getElementById('hero-canvas');
  const glow = document.getElementById('hero-glow');
  const g = cv.getContext('2d');
  const sc = Math.min(DPR, 1.5);
  let w = 0, h = 0, W = 22, L = 154, planks = [], spr = [], sub = null, chalk = null, lineX = 0, raf = 0, start = 0, dust = [], snapped = false;

  loadImage('img/hero.jpg').then(img => {
    hero.querySelector('.hero__photo').style.backgroundImage = `url("${img.src}")`;
    hero.classList.add('has-photo');
  }).catch(() => {});

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const T_PULL = .15, T_SNAP = .42;

  function setup() {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    W = w < 700 ? 15 : 21; L = W * 7;
    spr = Tex.sprites('oak', L, W, 18, 7, sc);
    sub = Tex.render('estrih', w, h, 3);
    const rand = Tex.rng(11);
    planks = Tex.hbLayout(w, h, W, L, rand);
    const spine0 = w / 2 - W / (2 * Math.SQRT2), period = L * Math.SQRT2;
    const target = w < 700 ? w * .55 : w * .66;
    lineX = spine0 + Math.round((target - spine0) / period) * period;
    planks.forEach(p => { p.d = .62 + Math.abs(p.x - lineX) / w * 1.7 + (p.y / h) * .22 + rand() * .16; });

    // Kredni trag (plava, hrapava linija)
    chalk = document.createElement('canvas');
    chalk.width = Math.round(40 * sc); chalk.height = Math.round(h * sc);
    const cg = chalk.getContext('2d');
    cg.scale(sc, sc);
    const cr = Tex.rng(5);
    for (let k = 0; k < 7; k++) {
      cg.beginPath();
      for (let y = 0; y <= h; y += 6) {
        const x = 20 + (cr() - .5) * 1.6;
        y ? cg.lineTo(x, y) : cg.moveTo(x, y);
      }
      cg.strokeStyle = `rgba(70,115,255,${.12 + cr() * .25})`;
      cg.lineWidth = .8 + cr() * 2.2;
      cg.stroke();
    }
    cg.fillStyle = 'rgba(80,125,255,.12)';
    cg.fillRect(14, 0, 12, h);
  }

  function emitDust() {
    for (let i = 0; i < (w < 700 ? 140 : 260); i++) {
      dust.push({ x: lineX + (Math.random() - .5) * 5, y: Math.random() * h, vx: (Math.random() - .5) * 3.2, vy: (Math.random() - .5) * .8 - .3, life: 1, s: .8 + Math.random() * 2.2 });
    }
  }

  function draw(t, dt = 1) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(sc, 0, 0, sc, 0, 0);
    g.drawImage(sub, 0, 0, w, h);

    if (t >= T_SNAP) g.drawImage(chalk, lineX - 20, 0, 40, h);

    // napeta špaga prije i tijekom "pucanja"
    if (t > T_PULL && t < T_SNAP + .5) {
      let bow;
      if (t < T_SNAP) bow = -18 * easeOut((t - T_PULL) / (T_SNAP - T_PULL));
      else { const k = t - T_SNAP; bow = -18 * Math.cos(k * 46) * Math.exp(-k * 9); }
      const a = t < T_SNAP ? .9 : clamp(1 - (t - T_SNAP) / .5, 0, 1) * .9;
      g.beginPath(); g.moveTo(lineX, -10); g.quadraticCurveTo(lineX + bow * 2, h / 2, lineX, h + 10);
      g.strokeStyle = `rgba(245,245,240,${a})`; g.lineWidth = 1.2; g.stroke();
    }
    if (!snapped && t >= T_SNAP) { snapped = true; emitDust(); }

    let done = true;
    for (const p of planks) {
      let e = (t - p.d) / .72;
      if (e <= 0) { done = false; continue; }
      if (e < 1) done = false; else e = 1;
      const a = easeOut(e), s = (.62 + .38 * easeBack(e)) * sc, rot = p.r + (1 - a) * .45;
      const cs = Math.cos(rot) * s, sn = Math.sin(rot) * s, fx = p.f ? -1 : 1;
      g.globalAlpha = a;
      g.setTransform(cs * fx, sn * fx, -sn, cs, p.x * sc, (p.y - (1 - a) * 26) * sc);
      g.drawImage(spr[p.k % spr.length], -L / 2, -W / 2, L, W);
    }
    g.globalAlpha = 1;

    if (dust.length) {
      g.setTransform(sc, 0, 0, sc, 0, 0);
      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i];
        d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= .95; d.vy = d.vy * .95 + .02 * dt; d.life -= .016 * dt;
        if (d.life <= 0) { dust.splice(i, 1); continue; }
        g.fillStyle = `rgba(120,160,255,${d.life * .8})`;
        g.fillRect(d.x, d.y, d.s, d.s);
      }
      done = false;
    }
    return done;
  }

  const finish = () => { dust = []; draw(99); hero.classList.add('is-laid'); };
  let last = 0;
  const loop = now => {
    if (!start) start = last = now;
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    if (draw((now - start) / 1000, dt)) { hero.classList.add('is-laid'); return; }
    raf = requestAnimationFrame(loop);
  };

  setup();
  if (reduceMotion) finish(); else raf = requestAnimationFrame(loop);

  let lastW = w, rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (Math.abs(cv.clientWidth - lastW) < 2) return;
      cancelAnimationFrame(raf);
      setup(); finish(); lastW = w;
    }, 200);
  });

  if (reduceMotion) { glow.style.display = 'none'; return; }

  // Svjetlo koje prati pokazivač i dubina pri skrolanju
  let tx = 0, ty = 0, cx = 0, cy = 0, gx = innerWidth * .7, gy = innerHeight * .35, gtx = gx, gty = gy, pointer = false, visible = true;
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
    gtx = e.clientX - r.left; gty = e.clientY - r.top; pointer = true;
  });
  hero.addEventListener('pointerleave', () => { pointer = false; tx = ty = 0; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(hero);
  function tick(now) {
    if (!visible) return;
    if (!pointer) {
      const a = now * .00032;
      gtx = hero.clientWidth * (.64 + .2 * Math.sin(a));
      gty = hero.clientHeight * (.4 + .15 * Math.cos(a * 1.3));
    }
    cx = lerp(cx, tx, .05); cy = lerp(cy, ty, .05);
    gx = lerp(gx, gtx, .07); gy = lerp(gy, gty, .07);
    const sy = Math.min(scrollY, hero.offsetHeight);
    stage.style.transform = `translate3d(${(-cx * 16).toFixed(2)}px, ${(sy * .18 - cy * 10).toFixed(2)}px, 0)`;
    glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
    requestAnimationFrame(tick);
  }
}

/* ---------- Teksture (lijeno iscrtavanje, prave fotografije ako postoje) ---------- */
function paintTex(el) {
  const w = el.clientWidth, h = el.clientHeight;
  if (!w || !h || el.dataset.painted) return !!el.dataset.painted;
  el.dataset.painted = '1';
  const cv = Tex.render(el.dataset.tex, w, h, +el.dataset.seed || 1);
  el.appendChild(cv);
  requestAnimationFrame(() => requestAnimationFrame(() => cv.classList.add('is-ready')));
  if (el.dataset.img) loadImage(el.dataset.img).then(img => {
    el.innerHTML = ''; el.classList.add('is-photo'); el.style.backgroundImage = `url("${img.src}")`;
  }).catch(() => {});
  return true;
}
function initTextures() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    idle(() => { if (paintTex(e.target)) io.unobserve(e.target); });
  }), { rootMargin: '700px 0px' });
  document.querySelectorAll('.tex[data-tex]').forEach(el => { if (!el.closest('.svc-preview')) io.observe(el); });
}

/* ---------- Uvodni tekst se "upisuje" dok skrolate ---------- */
let introWords = [];
function initIntro() {
  const el = document.getElementById('intro-text');
  if (!el || reduceMotion) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="wd">${w}</span>`).join(' ');
  introWords = [...el.querySelectorAll('.wd')];
}

/* ---------- Efekti vezani uz skrol ---------- */
function initScrollFx() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const steps = document.getElementById('steps');
  const stepEls = [...steps.children];
  const intro = document.getElementById('intro-text');
  const dock = document.querySelector('.dock');
  const hero = document.querySelector('.hero');
  let lastY = scrollY, ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    header.classList.toggle('is-scrolled', y > 30);
    if (!nav.classList.contains('is-open')) {
      if (y > 600 && y - lastY > 6) header.classList.add('is-hidden');
      else if (lastY - y > 6 || y < 600) header.classList.remove('is-hidden');
    }
    lastY = y;
    dock && dock.classList.toggle('is-on', y > hero.offsetHeight * .6);

    const r = steps.getBoundingClientRect();
    const p = clamp((vh * .75 - r.top) / (r.height + vh * .1), 0, 1);
    steps.style.setProperty('--p', p.toFixed(3));
    stepEls.forEach((s, i) => s.classList.toggle('is-on', p >= (i / stepEls.length) + .02));

    if (introWords.length) {
      const ir = intro.getBoundingClientRect();
      const ip = clamp((vh * .82 - ir.top) / (ir.height + vh * .25), 0, 1);
      const k = Math.round(ip * introWords.length * 1.08);
      introWords.forEach((wd, i) => wd.classList.toggle('on', i < k));
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- Usluge: pregled materijala prati pokazivač ---------- */
function initServices() {
  const pv = document.getElementById('svc-preview');
  if (!finePointer || !pv) return;
  const rows = [...document.querySelectorAll('.svc')];
  const items = [...pv.querySelectorAll('.tex')];
  let x = 0, y = 0, tx = 0, ty = 0, on = false, raf = 0, painted = false;
  const loop = () => {
    x = lerp(x, tx, .16); y = lerp(y, ty, .16);
    pv.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${clamp((tx - x) * .05, -7, 7).toFixed(2)}deg)`;
    if (on || Math.abs(tx - x) > .5 || Math.abs(ty - y) > .5) raf = requestAnimationFrame(loop);
  };
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', e => {
      if (!painted) { items.forEach(paintTex); painted = true; }
      if (!on) { x = tx = e.clientX; y = ty = e.clientY; }
      items.forEach((t, k) => t.classList.toggle('is-on', k === i));
      on = true; pv.classList.add('is-on');
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    });
    row.addEventListener('pointerleave', () => { on = false; pv.classList.remove('is-on'); });
  });
}

/* ---------- Slogovi: vodoravni prikaz vezan uz skrol ---------- */
function initSlogovi() {
  const sec = document.getElementById('slogovi');
  const sticky = document.getElementById('slog-sticky');
  const track = document.getElementById('slog-track');
  const bar = document.getElementById('slog-bar');
  const panels = [...track.children];
  if (reduceMotion) return;
  sec.classList.add('is-pinned');
  let dist = 0, lastW = 0;
  const layout = () => {
    track.style.transform = '';
    dist = Math.max(0, track.scrollWidth - track.clientWidth);
    sec.style.height = `${dist + sticky.offsetHeight}px`;
    lastW = innerWidth;
    update();
  };
  const update = () => {
    const top = sec.getBoundingClientRect().top;
    const p = dist ? clamp(-top / dist, 0, 1) : 0;
    track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    const vw = innerWidth;
    panels.forEach(pn => {
      const r = pn.getBoundingClientRect();
      const off = (r.left + r.width / 2 - vw / 2) / vw;
      const t = pn.querySelector('.tex');
      if (t) t.style.transform = `translate3d(${(off * -40).toFixed(1)}px,0,0)`;
    });
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 2) layout(); });
  layout();
  document.fonts && document.fonts.ready.then(layout);
}

/* ---------- Brušenje: interaktivna obnova ---------- */
function initSander() {
  const box = document.getElementById('sander');
  if (!box) return;
  const fx = document.getElementById('sander-fx');
  const layers = {
    after: box.querySelector('[data-layer="after"]'),
    raw: box.querySelector('[data-layer="raw"]'),
    worn: box.querySelector('[data-layer="worn"]')
  };
  const pctEl = document.getElementById('sand-pct');
  const stateEl = document.getElementById('sand-state');
  const meter = document.getElementById('sand-meter');
  const autoBtn = document.getElementById('sand-auto');
  const resetBtn = document.getElementById('sand-reset');
  const hint = document.getElementById('sand-hint');
  if (!finePointer) hint.textContent = 'Prstom: povlačite lijevo-desno';

  const sc = Math.min(DPR, 1.75);
  let w = 0, h = 0, R = 30, worn, wg, backup, mask, mg, fg, built = false, done = false;
  let last = null, cursor = null, down = false, dirty = false, running = false, lastCov = 0, auto = null, particles = [];
  let photos = null;

  Promise.all([loadImage('img/prije.jpg'), loadImage('img/poslije.jpg')]).then(p => { photos = p; if (built) build(); }).catch(() => {});

  function build() {
    w = box.clientWidth; h = box.clientHeight;
    if (!w || !h) return;
    const seed = 21;
    const put = (el, cv) => { el.innerHTML = ''; el.appendChild(cv); };
    if (photos) {
      put(layers.after, Tex.photo(photos[1], w, h));
      put(layers.raw, Tex.photo(photos[1], w, h));
      worn = Tex.photo(photos[0], w, h);
    } else {
      put(layers.after, Tex.render('after', w, h, seed));
      put(layers.raw, Tex.render('raw', w, h, seed));
      worn = Tex.render('before', w, h, seed);
    }
    put(layers.worn, worn);
    wg = worn.getContext('2d');
    backup = document.createElement('canvas');
    backup.width = worn.width; backup.height = worn.height;
    backup.getContext('2d').drawImage(worn, 0, 0);
    mask = document.createElement('canvas');
    mask.width = 120; mask.height = Math.max(1, Math.round(120 * h / w));
    mg = mask.getContext('2d');
    fx.width = Math.round(w * sc); fx.height = Math.round(h * sc);
    fg = fx.getContext('2d');
    R = Math.max(24, w * .07);
    built = true;
    reset(true);
  }

  function stamp(x, y) {
    wg.setTransform(sc, 0, 0, sc, 0, 0);
    wg.globalCompositeOperation = 'destination-out';
    const gr = wg.createRadialGradient(x, y, R * .25, x, y, R);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.7, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    wg.fillStyle = gr;
    wg.beginPath(); wg.arc(x, y, R, 0, Math.PI * 2); wg.fill();
    wg.globalCompositeOperation = 'source-over';
    mg.fillStyle = '#fff';
    mg.beginPath(); mg.arc(x / w * mask.width, y / h * mask.height, R / w * mask.width * .78, 0, Math.PI * 2); mg.fill();
    dirty = true;
  }
  function stroke(a, b, withDust = true) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(d / (R * .22)));
    for (let i = 1; i <= n; i++) stamp(lerp(a.x, b.x, i / n), lerp(a.y, b.y, i / n));
    if (withDust && !reduceMotion) emit(b.x, b.y, Math.min(10, 1 + d / 6), b.x - a.x, b.y - a.y);
  }
  function emit(x, y, n, dx, dy) {
    for (let i = 0; i < n && particles.length < 500; i++) {
      const ang = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      particles.push({ x: x + Math.cos(ang) * R * .8, y: y + Math.sin(ang) * R * .8, vx: Math.cos(ang) * sp - dx * .04, vy: Math.sin(ang) * sp - dy * .04 - .4, life: 1, s: .8 + Math.random() * 2 });
    }
  }
  function coverage() {
    const d = mg.getImageData(0, 0, mask.width, mask.height).data;
    let on = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 120) on++;
    return on / (d.length / 4);
  }
  function setState(c) {
    const pct = Math.round(c * 100);
    pctEl.textContent = `${done ? 100 : pct} %`;
    meter.style.transform = `scaleX(${done ? 1 : c.toFixed(3)})`;
    if (!done) stateEl.textContent = pct < 12 ? 'Stari lak' : 'Brušenje P36 → P120';
  }
  function lacquer() {
    done = true; auto = null;
    box.classList.add('is-lacquered');
    stateEl.textContent = 'Lakirano';
    setState(1);
    autoBtn.disabled = true;
  }
  function reset(first = false) {
    done = false; auto = null; particles = [];
    box.classList.remove('is-lacquered');
    autoBtn.disabled = false;
    wg.setTransform(1, 0, 0, 1, 0, 0);
    wg.globalCompositeOperation = 'source-over';
    wg.clearRect(0, 0, worn.width, worn.height);
    wg.drawImage(backup, 0, 0);
    mg.clearRect(0, 0, mask.width, mask.height);
    // jedan već izbrušen prolaz pokazuje što se događa
    stroke({ x: -R, y: h * .3 }, { x: w * (first ? .62 : .5), y: h * .3 }, false);
    lastCov = coverage(); setState(lastCov);
    start();
  }

  function frame(now) {
    if (auto) {
      const dt = Math.min(now - (auto.t || now), 50); auto.t = now;
      auto.d += auto.speed * dt;
      let rem = auto.d, pos = auto.path[auto.path.length - 1], seg = 0;
      for (seg = 0; seg < auto.path.length - 1; seg++) {
        const a = auto.path[seg], b = auto.path[seg + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
        if (rem <= len) { pos = { x: lerp(a.x, b.x, rem / len), y: lerp(a.y, b.y, rem / len) }; break; }
        rem -= len;
      }
      stroke(auto.pos, pos);
      auto.pos = pos;
      cursor = pos;
      if (seg >= auto.path.length - 1) { auto = null; cursor = null; }
    }
    if (dirty && (now - (frame.lc || 0) > 120)) {
      frame.lc = now; dirty = false;
      lastCov = coverage();
      if (!done) { setState(lastCov); if (lastCov >= .8) lacquer(); }
    }
    fg.setTransform(1, 0, 0, 1, 0, 0);
    fg.clearRect(0, 0, fx.width, fx.height);
    fg.setTransform(sc, 0, 0, sc, 0, 0);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vx *= .94; p.vy = p.vy * .94 + .05; p.life -= .025;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      fg.fillStyle = `rgba(238,218,184,${(p.life * .9).toFixed(2)})`;
      fg.fillRect(p.x, p.y, p.s, p.s);
    }
    if (cursor && !done) {
      fg.beginPath(); fg.arc(cursor.x, cursor.y, R, 0, Math.PI * 2);
      fg.strokeStyle = 'rgba(255,255,255,.85)'; fg.lineWidth = 1.5; fg.stroke();
      fg.beginPath(); fg.arc(cursor.x, cursor.y, R * .55, 0, Math.PI * 2);
      fg.strokeStyle = 'rgba(255,255,255,.35)'; fg.lineWidth = 1; fg.stroke();
      fg.beginPath();
      fg.moveTo(cursor.x - 6, cursor.y); fg.lineTo(cursor.x + 6, cursor.y);
      fg.moveTo(cursor.x, cursor.y - 6); fg.lineTo(cursor.x, cursor.y + 6);
      fg.strokeStyle = 'rgba(255,255,255,.9)'; fg.stroke();
    }
    if (particles.length || cursor || auto || dirty) requestAnimationFrame(frame);
    else running = false;
  }
  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

  const pos = e => { const r = fx.getBoundingClientRect(); return { x: (e.clientX - r.left) * w / r.width, y: (e.clientY - r.top) * h / r.height }; };
  fx.addEventListener('pointerdown', e => {
    if (!built || done) return;
    down = true; auto = null; last = pos(e);
    if (e.pointerType !== 'mouse') fx.setPointerCapture(e.pointerId);
    stamp(last.x, last.y); start();
  });
  fx.addEventListener('pointermove', e => {
    if (!built) return;
    const p = pos(e);
    if (e.pointerType === 'mouse') cursor = p;
    if (!done && (e.pointerType === 'mouse' || down)) { if (last) stroke(last, p); last = p; }
    start();
  });
  const up = () => { down = false; };
  fx.addEventListener('pointerup', up);
  fx.addEventListener('pointercancel', () => { down = false; last = null; });
  fx.addEventListener('pointerleave', () => { cursor = null; last = null; down = false; start(); });

  autoBtn.addEventListener('click', () => {
    if (!built || done) return;
    const path = [], step = R * 1.25;
    let dir = 1;
    for (let y = R * .6; y < h + R * .4; y += step, dir *= -1) {
      path.push({ x: dir > 0 ? -R : w + R, y });
      path.push({ x: dir > 0 ? w + R : -R, y });
    }
    let len = 0;
    for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    auto = { path, pos: path[0], d: 0, speed: len / 3400, t: 0 };
    start();
  });
  resetBtn.addEventListener('click', () => { if (built) reset(); });

  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !built) { idle(build); io.disconnect(); } }, { rootMargin: '600px 0px' });
  io.observe(box);
  let lastW = 0;
  addEventListener('resize', () => {
    if (!built || Math.abs(box.clientWidth - (lastW || w)) < 4) return;
    lastW = box.clientWidth; build();
  });
}

/* ---------- Obrazac ---------- */
function initForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const done = document.getElementById('form-done');
  const doneTitle = document.getElementById('form-done-title');
  const doneText = document.getElementById('form-done-text');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim();
      f.classList.remove('is-invalid');
      if (bad) { void f.offsetWidth; f.classList.add('is-invalid'); valid = false; }
    });
    if (!valid) { status.textContent = 'Ispunite polja označena zvjezdicom.'; return; }
    const data = Object.fromEntries(new FormData(form));

    if (CONFIG.formEndpoint) {
      try {
        const res = await fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error();
        doneTitle.textContent = 'Upit je poslan';
        doneText.textContent = 'Hvala. Javljamo se u roku od 24 sata.';
        done.hidden = false; form.reset();
      } catch { status.textContent = 'Slanje nije uspjelo. Nazovite nas ili pošaljite e-mail.'; }
      return;
    }
    const body = [
      `Usluga: ${data.usluga}`, `Ime i prezime: ${data.ime}`, `Telefon: ${data.telefon}`, `E-mail: ${data.email || '-'}`,
      `Lokacija: ${data.mjesto || '-'}`, `Površina: ${data.povrsina ? data.povrsina + ' m²' : '-'}`, '', data.poruka || ''
    ].join('\n');
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Upit za procjenu – ' + data.usluga)}&body=${encodeURIComponent(body)}`;
    done.hidden = false;
  });
  document.getElementById('form-again').addEventListener('click', () => { done.hidden = true; form.reset(); });
  form.querySelectorAll('input, textarea').forEach(f => f.addEventListener('input', () => f.classList.remove('is-invalid')));
}

/* ---------- Rezervne animacije za preglednike bez scroll-timelinea ---------- */
function initRevealFallback() {
  if (reduceMotion || (window.CSS && CSS.supports('animation-timeline: view()'))) return;
  const vh = innerHeight;
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.animate([{ opacity: 0, translate: '0 50px' }, { opacity: 1, translate: '0 0' }],
      { duration: 900, delay: (+e.target.dataset.stagger || 0) * 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  }), { rootMargin: '0px 0px 10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => { if (el.getBoundingClientRect().top > vh) io.observe(el); });
}
