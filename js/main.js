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
const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 400 }) : cb => setTimeout(cb, 16);

/* =========================================================
   Proceduralne teksture: parket, mikrocement, epoksid, vinil
   ========================================================= */
const Tex = (() => {
  const rng = seed => {
    let s = Math.floor(seed * 9973) % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  };
  const hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(1)},${clamp(s, 0, 100).toFixed(1)}%,${clamp(l, 0, 100).toFixed(1)}%,${a})`;
  const PAL = {
    oak:   { h: [24, 34], s: [42, 58], l: [34, 50] },
    light: { h: [28, 36], s: [40, 52], l: [44, 58] },
    vinyl: { h: [30, 37], s: [20, 30], l: [60, 70] }
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
    if (r() < .4) { // "katedralna" šara
      const cx = r() * L, cy = W / 2 + (r() - .5) * W * .3;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.ellipse(cx, cy, W * .7 + k * W * .35, W * .1 + k * W * .07, 0, 0, Math.PI * 2);
        g.strokeStyle = hsl(h, s, l - 15, .13);
        g.lineWidth = .6;
        g.stroke();
      }
    }
    if (r() < .15) { // čvor
      const kx = r() * L, ky = W * (.3 + r() * .4), kr = W * (.08 + r() * .08);
      g.fillStyle = hsl(h, s, l - 24, .55);
      g.beginPath(); g.ellipse(kx, ky, kr * 2, kr, 0, 0, Math.PI * 2); g.fill();
    }
    // fuge
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

  // Riblja kost: rešetka a=(W,W), b=(L,-L), zatim rotacija 45°
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

  function herringbone(g, w, h, W, seed, sc, pal = 'oak') {
    const L = W * 5;
    const spr = sprites(pal, L, W, 12, seed * 7 + 3, sc);
    const lay = hbLayout(w, h, W, L, rng(seed));
    for (const p of lay) {
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
    const spr = sprites('oak', L, Hp, 12, seed * 5 + 1, sc);
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
    const spr = sprites(pal, L, W, 12, seed * 3 + 1, sc);
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

  function microcement(g, w, h, seed, base) {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const M = Math.max(w, h);
    for (let i = 0; i < 70; i++) {
      const light = r() < .5;
      blob(g, r() * w, r() * h, (.06 + r() * .32) * M, light ? '255,255,255' : '70,60,50', light ? .14 : .11);
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
    g.globalAlpha = .7;
    g.fillStyle = 'hsl(35,10%,50%)'; g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(150,136,115,.32)'; g.fillRect(0, 0, w, h);
    const M = Math.max(w, h);
    for (let i = 0; i < 6; i++) blob(g, r() * w, r() * h, M * (.15 + r() * .25), '210,196,172', .22);
    for (let i = 0; i < 6; i++) blob(g, r() * w, r() * h, M * (.03 + r() * .08), '45,30,15', .32);
    g.lineCap = 'round';
    const n = Math.round(w * h / 1400);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, len = 6 + r() * 40, a = r() * Math.PI;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.strokeStyle = r() < .7 ? 'rgba(235,225,205,.3)' : 'rgba(40,28,15,.3)';
      g.lineWidth = .4 + r() * .9; g.stroke();
    }
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, M * .75);
    vg.addColorStop(0, 'rgba(30,20,10,0)'); vg.addColorStop(1, 'rgba(30,20,10,.45)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
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
    const W = clamp(w / 26, 12, 24);
    switch (type) {
      case 'herringbone': herringbone(g, w, h, W, seed, sc); gloss(g, w, h, .12); break;
      case 'herringbone-lg': herringbone(g, w, h, clamp(w / 18, 16, 30), seed, sc); gloss(g, w, h, .14); break;
      case 'before': herringbone(g, w, h, clamp(w / 24, 14, 28), seed, sc); wear(g, w, h, seed); break;
      case 'after': herringbone(g, w, h, clamp(w / 24, 14, 28), seed, sc); lacquer(g, w, h); break;
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
        g.beginPath(); g.moveTo(w * .58, 0); g.lineTo(w * .42, h);
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.stroke();
        break;
      }
      case 'chevron': chevron(g, w, h, W, seed, sc); gloss(g, w, h, .12); break;
      case 'planks': planks(g, w, h, W * 1.15, W * 9, seed, sc); gloss(g, w, h, .14); break;
      case 'after-planks': planks(g, w, h, W * 1.15, W * 9, seed, sc, 'light'); lacquer(g, w, h); break;
      case 'vinyl': planks(g, w, h, W * 1.7, W * 13, seed, sc, 'vinyl'); gloss(g, w, h, .16); break;
      case 'microcement': microcement(g, w, h, seed, '#bdb5ab'); break;
      case 'microcement-warm': microcement(g, w, h, seed, '#cbbba5'); break;
      case 'epoxy': epoxy(g, w, h, seed); break;
    }
    return cv;
  }

  return { rng, sprites, hbLayout, render };
})();

/* =========================================================
   Pokretanje
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  applyContacts();
  initHeaderNav();
  initHero();
  initTextures();
  initMarquee();
  initScrollFx();
  initTilt();
  initMagnetic();
  initBeforeAfter();
  initGallery();
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
  document.getElementById('year').textContent = new Date().getFullYear();

  // Poveznice "Zatražite ponudu" unaprijed odabiru uslugu u obrascu
  const select = document.getElementById('f-usluga');
  document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {
    const opt = [...select.options].find(o => o.text === a.dataset.service);
    if (opt) select.value = opt.value;
  }));
}

/* ---------- Header i navigacija ---------- */
function initHeaderNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggleNav = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
  };
  burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

  const links = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean).forEach(s => io.observe(s));
}

/* ---------- Hero: parket se slaže dasku po dasku ---------- */
function initHero() {
  const hero = document.querySelector('.hero');
  const bg = document.getElementById('hero-bg');
  const cv = document.getElementById('hero-canvas');
  const glow = document.getElementById('hero-glow');
  const g = cv.getContext('2d');
  const sc = Math.min(DPR, 1.5);
  let planks = [], spr = [], W = 26, L = 130, w = 0, h = 0, raf = 0, start = 0;

  // Ako postoji prava fotografija img/hero.jpg, prikazuje se umjesto animacije
  const photo = new Image();
  photo.onload = () => {
    hero.querySelector('.hero__photo').style.backgroundImage = `url("${photo.src}")`;
    hero.classList.add('has-photo');
  };
  photo.src = 'img/hero.jpg';

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

  function setup() {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    W = w < 700 ? 20 : 26; L = W * 5;
    spr = Tex.sprites('oak', L, W, 16, 7, sc);
    const rand = Tex.rng(11);
    planks = Tex.hbLayout(w, h, W, L, rand);
    planks.forEach(p => {
      const nx = p.x / w, ny = p.y / h;
      p.d = (nx * .8 + (1 - ny) * .35) * 1.35 + rand() * .3;
    });
  }

  function draw(t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    let done = true;
    for (const p of planks) {
      let e = (t - p.d) / .8;
      if (e <= 0) { done = false; continue; }
      if (e < 1) done = false; else e = 1;
      const a = easeOut(e), s = (.6 + .4 * easeBack(e)) * sc, rot = p.r + (1 - a) * .5;
      const cs = Math.cos(rot) * s, sn = Math.sin(rot) * s, fx = p.f ? -1 : 1;
      g.globalAlpha = a;
      g.setTransform(cs * fx, sn * fx, -sn, cs, p.x * sc, (p.y - (1 - a) * 22) * sc);
      g.drawImage(spr[p.k % spr.length], -L / 2, -W / 2, L, W);
    }
    g.globalAlpha = 1;
    return done;
  }

  const finish = () => { draw(Infinity); hero.classList.add('is-laid'); };
  const loop = now => {
    if (!start) start = now;
    if (draw((now - start) / 1000)) { hero.classList.add('is-laid'); return; }
    raf = requestAnimationFrame(loop);
  };

  setup();
  if (reduceMotion) finish(); else raf = requestAnimationFrame(loop);

  let lastW = w, lastH = h, rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (Math.abs(cv.clientWidth - lastW) < 2 && Math.abs(cv.clientHeight - lastH) < 150) return;
      cancelAnimationFrame(raf);
      setup(); finish();
      lastW = w; lastH = h;
    }, 200);
  });

  if (reduceMotion) { glow.style.display = 'none'; return; }

  // Svjetlo koje prati pokazivač + lagani paralaksa efekt
  let tx = 0, ty = 0, cx = 0, cy = 0, gx = innerWidth * .7, gy = innerHeight * .35, gtx = gx, gty = gy;
  let pointerActive = false, visible = true, ambient = 0;
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - .5;
    ty = (e.clientY - r.top) / r.height - .5;
    gtx = e.clientX - r.left; gty = e.clientY - r.top;
    pointerActive = true;
  });
  hero.addEventListener('pointerleave', () => { pointerActive = false; tx = ty = 0; });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) requestAnimationFrame(tick);
  }).observe(hero);

  function tick(now) {
    if (!visible) return;
    if (!pointerActive) {
      ambient = now * .00035;
      gtx = hero.clientWidth * (.62 + .22 * Math.sin(ambient));
      gty = hero.clientHeight * (.38 + .16 * Math.cos(ambient * 1.3));
    }
    cx = lerp(cx, tx, .06); cy = lerp(cy, ty, .06);
    gx = lerp(gx, gtx, .08); gy = lerp(gy, gty, .08);
    const sy = Math.min(scrollY, hero.offsetHeight);
    bg.style.transform = `translate3d(${(-cx * 22).toFixed(2)}px, ${(-cy * 14 + sy * .28).toFixed(2)}px, 0) scale(1.04)`;
    glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
    requestAnimationFrame(tick);
  }

  // Brojači u statistici
  setTimeout(() => {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count, from = target > 1000 ? target - 25 : 0, t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, 1100);
}

/* ---------- Teksture (lijeno iscrtavanje) ---------- */
function initTextures() {
  const paint = el => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h || el.dataset.painted) return false;
    const cv = Tex.render(el.dataset.tex, w, h, +el.dataset.seed || 1);
    el.appendChild(cv);
    el.dataset.painted = '1';
    requestAnimationFrame(() => requestAnimationFrame(() => cv.classList.add('is-ready')));
    return true;
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    idle(() => { if (paint(e.target)) io.unobserve(e.target); });
  }), { rootMargin: '600px 0px' });
  document.querySelectorAll('.tex[data-tex]').forEach(el => io.observe(el));
}

/* ---------- Traka s materijalima (ubrzava se uz skrol) ---------- */
function initMarquee() {
  const track = document.getElementById('marquee');
  if (!track || reduceMotion) return;
  let x = 0, boost = 0, dir = 1, half = 0, last = 0, visible = false, lastY = scrollY;
  const measure = () => { half = track.scrollWidth / 2; };
  measure();
  document.fonts && document.fonts.ready.then(measure);
  addEventListener('resize', measure);
  addEventListener('scroll', () => {
    const dy = scrollY - lastY; lastY = scrollY;
    if (Math.abs(dy) > 0) dir = dy > 0 ? 1 : -1;
    boost = Math.min(boost + Math.abs(dy) * .25, 14);
  }, { passive: true });
  const tick = now => {
    if (!visible) return;
    const dt = last ? Math.min(now - last, 50) / 16.67 : 1; last = now;
    x -= (0.55 + boost) * dir * dt;
    boost *= .92;
    if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = 0; requestAnimationFrame(tick); }
  }).observe(track.parentElement);
}

/* ---------- Efekti vezani uz skrol ---------- */
function initScrollFx() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const steps = document.getElementById('steps');
  const stepEls = [...steps.children];
  const par = document.getElementById('about-parallax');
  let lastY = scrollY, ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;

    header.classList.toggle('is-scrolled', y > 40);
    if (!nav.classList.contains('is-open')) {
      if (y > 500 && y - lastY > 6) header.classList.add('is-hidden');
      else if (lastY - y > 6 || y < 500) header.classList.remove('is-hidden');
    }
    lastY = y;

    const r = steps.getBoundingClientRect();
    const p = clamp((vh * .78 - r.top) / (r.height + vh * .15), 0, 1);
    steps.style.setProperty('--p', p.toFixed(3));
    stepEls.forEach((s, i) => s.classList.toggle('is-on', p >= (i / (stepEls.length - 1)) * .9 + .03));

    if (!reduceMotion && par) {
      const pr = par.parentElement.getBoundingClientRect();
      const off = (pr.top + pr.height / 2 - vh / 2) / vh;
      par.style.transform = `translate3d(0, ${(off * -60).toFixed(1)}px, 0)`;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- 3D nagib kartica ---------- */
function initTilt() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('pointerenter', () => { card.style.transition = 'transform .15s ease-out, box-shadow .6s, border-color .3s'; });
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      card.style.transform = `perspective(900px) rotateX(${((.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - .5) * 9).toFixed(2)}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transition = ''; card.style.transform = ''; });
  });
}

/* ---------- Magnetni gumbi ---------- */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll('.btn--magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      btn.style.translate = `${(dx * .22).toFixed(1)}px ${(dy * .35).toFixed(1)}px`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.translate = '0 0'; });
  });
}

/* ---------- Klizač prije / poslije ---------- */
function initBeforeAfter() {
  const ba = document.getElementById('ba');
  const range = document.getElementById('ba-range');
  if (!ba) return;
  let pos = 50, dragging = false, intro = 0, touched = false;
  const set = v => {
    pos = clamp(v, 0, 100);
    ba.style.setProperty('--pos', `${pos}%`);
    range.value = Math.round(pos);
  };
  const fromEvent = e => { const r = ba.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
  const stopIntro = () => { touched = true; cancelAnimationFrame(intro); };

  ba.addEventListener('pointerdown', e => {
    stopIntro(); dragging = true;
    ba.setPointerCapture(e.pointerId);
    ba.classList.add('is-dragging');
    fromEvent(e);
  });
  ba.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
  const end = () => { dragging = false; ba.classList.remove('is-dragging'); };
  ba.addEventListener('pointerup', end);
  ba.addEventListener('pointercancel', end);
  range.addEventListener('input', () => { stopIntro(); set(+range.value); });

  // Kratka demonstracija kad klizač uđe u vidno polje
  if (reduceMotion) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || touched) return;
    io.disconnect();
    const keys = [[0, 50], [.9, 78], [1.9, 24], [2.8, 50]];
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    let t0 = 0;
    const step = now => {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      let k = keys.findIndex(([kt]) => kt > t);
      if (k === -1) { set(50); return; }
      const [ta, va] = keys[k - 1], [tb, vb] = keys[k];
      set(lerp(va, vb, ease((t - ta) / (tb - ta))));
      intro = requestAnimationFrame(step);
    };
    setTimeout(() => { if (!touched) intro = requestAnimationFrame(step); }, 400);
  }, { threshold: .6 });
  io.observe(ba);
}

/* ---------- Galerija: prave fotografije, filter, lightbox ---------- */
function initGallery() {
  const items = [...document.querySelectorAll('.gallery__item')];
  items.forEach(item => {
    const img = new Image();
    img.onload = () => {
      const tex = item.querySelector('.tex');
      tex.removeAttribute('data-tex');
      tex.innerHTML = '';
      tex.classList.add('is-photo');
      tex.style.backgroundImage = `url("${item.dataset.img}")`;
      item.classList.add('has-photo');
    };
    img.src = item.dataset.img;
  });

  // Prije/poslije: prave fotografije ako postoje (img/prije.jpg, img/poslije.jpg)
  [['img/prije.jpg', '.ba__layer--before .tex'], ['img/poslije.jpg', '.ba__layer:not(.ba__layer--before) .tex']].forEach(([src, sel]) => {
    const img = new Image();
    img.onload = () => {
      const tex = document.querySelector(sel);
      tex.innerHTML = ''; tex.classList.add('is-photo'); tex.style.backgroundImage = `url("${src}")`;
    };
    img.src = src;
  });

  const filters = [...document.querySelectorAll('.filter')];
  const apply = f => items.forEach(it => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    const f = btn.dataset.filter;
    if (document.startViewTransition && !reduceMotion) {
      items.forEach((it, i) => { it.style.viewTransitionName = `g${i}`; });
      const vt = document.startViewTransition(() => apply(f));
      vt.finished.finally(() => items.forEach(it => { it.style.viewTransitionName = ''; }));
    } else apply(f);
  }));

  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('.lightbox__caption');
  items.forEach(it => it.addEventListener('click', () => {
    if (!it.classList.contains('has-photo')) return;
    lbImg.src = it.dataset.img;
    lbImg.alt = it.querySelector('figcaption').textContent.trim();
    lbCap.textContent = lbImg.alt;
    lb.hidden = false;
  }));
  const close = () => { lb.hidden = true; lbImg.src = ''; };
  lb.addEventListener('click', e => { if (e.target !== lbImg) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });
}

/* ---------- Kontakt obrazac ---------- */
function initForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const done = document.getElementById('form-done');
  const doneText = document.getElementById('form-done-text');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.className = 'form__status';
    status.textContent = '';
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim();
      f.classList.remove('is-invalid');
      if (bad) { void f.offsetWidth; f.classList.add('is-invalid'); valid = false; }
    });
    if (!valid) {
      status.textContent = 'Molimo ispunite obavezna polja označena zvjezdicom.';
      status.classList.add('err');
      return;
    }
    const data = Object.fromEntries(new FormData(form));

    if (CONFIG.formEndpoint) {
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error();
        done.querySelector('h3').textContent = 'Hvala, upit je poslan!';
        doneText.textContent = 'Javit ćemo vam se u roku od 24 sata.';
        done.hidden = false;
        form.reset();
      } catch {
        status.textContent = 'Slanje nije uspjelo. Molimo nazovite nas ili pošaljite e-mail.';
        status.classList.add('err');
      }
      return;
    }

    const body = [
      `Ime i prezime: ${data.ime}`,
      `Telefon: ${data.telefon}`,
      `E-mail: ${data.email || '-'}`,
      `Mjesto: ${data.mjesto || '-'}`,
      `Usluga: ${data.usluga}`,
      `Površina: ${data.povrsina ? data.povrsina + ' m²' : '-'}`,
      '',
      data.poruka || ''
    ].join('\n');
    window.location.href =
      `mailto:${CONFIG.email}?subject=${encodeURIComponent('Upit s web stranice – ' + data.usluga)}&body=${encodeURIComponent(body)}`;
    done.hidden = false;
  });

  document.getElementById('form-again').addEventListener('click', () => { done.hidden = true; form.reset(); });
  form.querySelectorAll('input, select, textarea').forEach(f => f.addEventListener('input', () => f.classList.remove('is-invalid')));
}

/* ---------- Rezervne animacije za preglednike bez scroll-timelinea ---------- */
function initRevealFallback() {
  if (reduceMotion || (window.CSS && CSS.supports('animation-timeline: view()'))) return;
  const vh = innerHeight;
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.animate(
      [{ opacity: 0, translate: '0 50px', scale: '.97' }, { opacity: 1, translate: '0 0', scale: '1' }],
      { duration: 900, delay: (+e.target.dataset.stagger || 0) * 110, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }
    );
  }), { rootMargin: '0px 0px 10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => { if (el.getBoundingClientRect().top > vh) io.observe(el); });
}
