/* ==========================================================================
   Dental Centar Kubica — interakcije
   Bez vanjskih biblioteka. Sve animacije poštuju "prefers-reduced-motion".
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     KONFIGURACIJA — ovdje se mijenjaju kontakt podaci i slanje upita
     ------------------------------------------------------------------ */
  const CONFIG = {
    phone: '+385992900381',
    phoneDisplay: '099 290 0381',
    email: 'info@dentalcentarkubica.hr',
    // WhatsApp broj (bez +). Ostavite prazno ako ordinacija ne koristi WhatsApp.
    whatsapp: '385992900381',
    // Endpoint za izravno slanje upita (npr. Formspree, Web3Forms ili vlastiti poslužitelj koji
    // prosljeđuje poruku na mobitel). Ako je prazno, upit se šalje e-mailom/WhatsAppom.
    formEndpoint: '',
    // Fotografije doktora (format 16:11), npr. { karlo: 'img/karlo.jpg', elena: 'img/elena.jpg' }
    photos: { karlo: '', elena: '' },
    mapsEmbed: 'https://www.google.com/maps?q=Maruli%C4%87eva+ulica+3,+52100+Pula&output=embed',
    mapsDir: 'https://www.google.com/maps/dir/?api=1&destination=Maruli%C4%87eva+ulica+3%2C+52100+Pula',
    tour: 'https://tourmkr.com/F1upMBrVET',
    timeZone: 'Europe/Zagreb',
    // radno vrijeme u minutama od ponoći; 0 = nedjelja
    hours: { 0: null, 1: [480, 900], 2: [480, 1200], 3: [480, 900], 4: [480, 1200], 5: [480, 900], 6: null }
  };

  /* ------------------------------------------------------------------
     Pomoćne funkcije
     ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const f = (n) => Math.round(n * 100) / 100;
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    injectDefs();
    initStatus();
    initHeader();
    initSplit();
    initReveal();
    initCompare();
    initServices();
    initProsth();
    initGuide();
    initPortraits();
    initFaq();
    initMap();
    initForm();
    initDock();
    initAssistant();
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------
     SVG gradijenti (dijeljeni)
     ------------------------------------------------------------------ */
  function injectDefs() {
    const s = svgEl('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false', style: 'position:absolute;width:0;height:0' });
    const defs = svgEl('defs', {}, s);
    const grad = (id, stops) => {
      const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      stops.forEach(([o, c, op = 1]) => svgEl('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, g));
    };
    grad('enamel', [[0, '#fffdf8'], [1, '#ece4d4']]);
    grad('enamel-mark', [[0, '#f1f7f3'], [1, '#cfe2d8']]);
    grad('fenamel', [[0, '#fbf8f2'], [.6, '#f2ebde'], [1, '#ddd0b8']]);
    grad('ftint', [[0, '#ffffff', .55], [.45, '#ffffff', 0], [1, '#6e5530', .16]]);
    grad('gumU-d', [[0, '#c98b80', 0], [.5, '#b9776c', .55], [.62, '#b9776c', .9], [1, '#b9776c', .9]]);
    grad('gumL-d', [[0, '#b9776c', .9], [.42, '#b9776c', .9], [.6, '#b9776c', .5], [1, '#c98b80', 0]]);
    grad('gumU-l', [[0, '#eab3a6', 0], [.48, '#e4a395', .6], [.62, '#df9a8b', 1], [1, '#df9a8b', 1]]);
    grad('gumL-l', [[0, '#df9a8b', 1], [.42, '#df9a8b', 1], [.62, '#e4a395', .55], [1, '#eab3a6', 0]]);
    const rad = (id, stops) => {
      const g = svgEl('radialGradient', { id, cx: .5, cy: .5, r: .5 }, defs);
      stops.forEach(([o, c, op = 1]) => svgEl('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, g));
    };
    rad('mouth-d', [[0, '#020403', .95], [.7, '#020403', .8], [1, '#020403', 0]]);
    rad('mouth-l', [[0, '#3a1f1d', 1], [.72, '#4a2724', .9], [1, '#6b3a35', 0]]);
    grad('p-enamel', [[0, '#fffdf8'], [1, '#efe6d6']]);
    grad('p-dentin', [[0, '#f3e9d6'], [1, '#e6d6b9']]);
    const gx = svgEl('linearGradient', { id: 'p-titan', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    [[0, '#8e9aa4'], [.45, '#d3dbe1'], [1, '#7f8b95']].forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, gx));
    document.body.prepend(s);
  }

  /* ------------------------------------------------------------------
     RADNO VRIJEME — "Otvoreno do 18:00" (vrijeme u Sarajevu)
     ------------------------------------------------------------------ */
  const DAY_ACC = ['u nedjelju', 'u ponedjeljak', 'u utorak', 'u srijedu', 'u četvrtak', 'u petak', 'u subotu'];
  const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  function sarajevoNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const get = (t) => (parts.find((p) => p.type === t) || {}).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      const h = parseInt(get('hour'), 10) % 24;
      return { day, min: h * 60 + parseInt(get('minute'), 10) };
    } catch (e) {
      const d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function getStatus() {
    const { day, min } = sarajevoNow();
    const today = CONFIG.hours[day];
    if (today && min >= today[0] && min < today[1]) {
      const left = today[1] - min;
      if (left <= 45) return { state: 'soon', day, text: `Otvoreno još ${left} min`, short: `Još ${left} min` };
      return { state: 'open', day, text: `Otvoreno · danas do ${hm(today[1])}`, short: `Otvoreno do ${hm(today[1])}` };
    }
    if (today && min < today[0]) {
      return { state: 'closed', day, text: `Zatvoreno · otvaramo danas u ${hm(today[0])}`, short: `Otvaramo u ${hm(today[0])}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      const h = CONFIG.hours[d];
      if (h) {
        const when = i === 1 ? 'sutra' : DAY_ACC[d];
        return { state: 'closed', day, text: `Zatvoreno · otvaramo ${when} u ${hm(h[0])}`, short: 'Zatvoreno' };
      }
    }
    return { state: 'closed', day, text: 'Zatvoreno', short: 'Zatvoreno' };
  }

  function initStatus() {
    const render = () => {
      const st = getStatus();
      $$('[data-status]').forEach((n) => {
        n.classList.remove('is-open', 'is-soon', 'is-closed');
        n.classList.add('is-' + st.state);
        const t = $('.status__text', n);
        if (t) t.textContent = n.classList.contains('status--compact') ? st.short : st.text;
      });
      $$('#hours tr').forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.day === st.day));
    };
    render();
    setInterval(render, 60 * 1000);
  }

  /* ------------------------------------------------------------------
     HEADER + MOBILNI IZBORNIK
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = $('#header');
    const burger = $('#burger');
    const menu = $('#menu');
    let lastY = window.scrollY;
    let ticking = false;
    let menuOpen = false;

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 12);
      if (!menuOpen) {
        if (y > 480 && y > lastY + 6) header.classList.add('is-hidden');
        else if (y < lastY - 6 || y < 480) header.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
    onScroll();

    const setMenu = (open) => {
      menuOpen = open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add('is-open'));
        header.classList.remove('is-hidden');
        header.classList.add('is-scrolled');
      } else {
        menu.classList.remove('is-open');
        menu.hidden = true;
        onScroll();
      }
    };
    burger.addEventListener('click', () => setMenu(!menuOpen));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 1024) setMenu(false); });

    // aktivni link u navigaciji
    const links = $$('.nav a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.remove('is-active'));
          const a = map.get(en.target.id);
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------
     TEKST: razbijanje naslova na riječi + pojavljivanje pri skrolu
     ------------------------------------------------------------------ */
  function initSplit() {
    $$('[data-split]').forEach((node) => {
      let i = 0;
      const walk = (n) => {
        Array.from(n.childNodes).forEach((c) => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            c.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
              if (!part) return;
              if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span');
              w.className = 'w';
              const inner = document.createElement('span');
              inner.textContent = part;
              inner.style.setProperty('--i', i++);
              w.appendChild(inner);
              frag.appendChild(w);
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1 && c.tagName !== 'BR') {
            walk(c);
          }
        });
      };
      walk(node);
    });
  }

  function initReveal() {
    const items = $$('.reveal, [data-split]');
    if (!('IntersectionObserver' in window)) { items.forEach((n) => n.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((n) => io.observe(n));
  }

  /* ==================================================================
     GEOMETRIJA ZUBA
     Zubni luk = kubna Bézierova kriva, zubi su raspoređeni po dužini luka
     prema stvarnim meziodistalnim širinama (mm). Oznake po FDI sistemu.
     ================================================================== */
  // [meziodistalna širina, bukolingvalna dubina] po poziciji 1–8
  const UPPER = [null, [8.6, 7.0], [6.6, 6.2], [7.6, 8.0], [7.0, 9.0], [6.6, 9.2], [10.2, 11.0], [9.2, 10.8], [8.6, 10.2]];
  const LOWER = [null, [5.3, 5.9], [5.9, 6.1], [6.9, 7.6], [7.1, 7.8], [7.2, 8.2], [11.0, 10.6], [10.4, 10.2], [10.0, 9.8]];
  const TYPE = [null, 'inc', 'inc', 'can', 'pre', 'pre', 'mol', 'mol', 'mol'];
  const GAP = .55;

  const TOOTH_NAME = [null, 'središnji sjekutić', 'lateralni sjekutić', 'očnjak', 'prvi pretkutnjak', 'drugi pretkutnjak', 'prvi kutnjak', 'drugi kutnjak', 'umnjak'];
  const QUAD_NAME = [null, 'gornji desni', 'gornji lijevi', 'donji lijevi', 'donji desni'];
  const toothName = (fdi) => `${TOOTH_NAME[fdi % 10]}, ${QUAD_NAME[Math.floor(fdi / 10)]}`;

  function bez(c, t) {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
    return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
  }
  function lut(c, n = 320) {
    const pts = [bez(c, 0)];
    const lens = [0];
    let L = 0;
    for (let i = 1; i <= n; i++) {
      const p = bez(c, i / n);
      const q = pts[i - 1];
      L += Math.hypot(p[0] - q[0], p[1] - q[1]);
      pts.push(p); lens.push(L);
    }
    return { pts, lens, L };
  }
  function archCurve(ctrl, total) {
    const k = total / lut(ctrl).L;
    const { pts, lens } = lut(ctrl.map(([x, y]) => [x * k, y * k]));
    return {
      pts,
      at(s) {
        let lo = 0, hi = lens.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (lens[m] < s) lo = m; else hi = m; }
        const t = clamp((s - lens[lo]) / ((lens[hi] - lens[lo]) || 1), 0, 1);
        const dx = pts[hi][0] - pts[lo][0], dy = pts[hi][1] - pts[lo][1];
        const dl = Math.hypot(dx, dy) || 1;
        return { x: lerp(pts[lo][0], pts[hi][0], t), y: lerp(pts[lo][1], pts[hi][1], t), tx: dx / dl, ty: dy / dl };
      }
    };
  }

  // oblik zuba odozgo (okluzalno) u lokalnim koordinatama: u = uz luk, v = prema obrazu/usni
  function occlusalPoints(type, w, d) {
    const n = { inc: 2.3, can: 1.95, pre: 2.4, mol: 3.1 }[type];
    const taper = { inc: .24, can: .14, pre: .06, mol: .04 }[type];
    const pts = [];
    const N = 64;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      let u = (w / 2) * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      const v = (d / 2) * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      u *= 1 + taper * (v / (d / 2));
      pts.push([u * .93, v * .93]);
    }
    return pts;
  }
  function occlusalDetail(type, w, d) {
    switch (type) {
      case 'inc': return [['M', -.32 * w, .14 * d], ['Q', 0, .24 * d, .32 * w, .14 * d]];
      case 'can': return [['M', -.3 * w, .02 * d], ['L', 0, .2 * d], ['L', .3 * w, .02 * d]];
      case 'pre': return [['M', -.28 * w, 0], ['Q', 0, -.1 * d, .28 * w, 0]];
      default: return [
        ['M', -.32 * w, -.03 * d], ['Q', 0, .1 * d, .32 * w, -.03 * d],
        ['M', .02 * w, .04 * d], ['L', .07 * w, .36 * d],
        ['M', -.04 * w, .0], ['L', -.1 * w, -.34 * d]
      ];
    }
  }

  function layoutJaw(jaw, ctrl) {
    const sizes = jaw === 'U' ? UPPER : LOWER;
    let total = GAP * 8;
    for (let p = 1; p <= 8; p++) total += sizes[p][0];
    const curve = archCurve(ctrl, total);
    const sy = jaw === 'U' ? 1 : -1;
    const teeth = [];
    [-1, 1].forEach((sx) => {
      let cum = GAP / 2;
      for (let pos = 1; pos <= 8; pos++) {
        const [w, d] = sizes[pos];
        const s = cum + w / 2;
        cum += w + GAP;
        const c = curve.at(s);
        const q = jaw === 'U' ? (sx < 0 ? 1 : 2) : (sx > 0 ? 3 : 4);
        teeth.push({
          fdi: q * 10 + pos, q, pos, type: TYPE[pos], w, d,
          cx: c.x * sx, cy: c.y * sy,
          T: [c.tx * sx, c.ty * sy],
          N: [c.ty * sx, -c.tx * sy]
        });
      }
    });
    return { teeth, curve, sy };
  }

  function buildTooth(t, numOffset = 3.4) {
    const tr = (u, v) => [t.cx + u * t.T[0] + v * t.N[0], t.cy + u * t.T[1] + v * t.N[1]];
    t.pts = occlusalPoints(t.type, t.w, t.d).map(([u, v]) => tr(u, v));
    t.path = 'M' + t.pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
    t.detail = occlusalDetail(t.type, t.w, t.d).map((seg) => {
      const cmd = seg[0];
      const nums = [];
      for (let i = 1; i < seg.length; i += 2) { const p = tr(seg[i], seg[i + 1]); nums.push(f(p[0]), f(p[1])); }
      return cmd + nums.join(' ');
    }).join('');
    const l = tr(0, t.d / 2 + numOffset);
    t.lx = l[0]; t.ly = l[1];
    t.r = Math.max(t.w, t.d) / 2;
    return t;
  }

  function boundsOf(teeth, withLabels = true) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    teeth.forEach((t) => {
      t.pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      if (withLabels) { x0 = Math.min(x0, t.lx - 2); x1 = Math.max(x1, t.lx + 2); y0 = Math.min(y0, t.ly - 2); y1 = Math.max(y1, t.ly + 2); }
    });
    return { x0, y0, x1, y1 };
  }

  function drawTeeth(parent, teeth, { interactive = false, numbers = true } = {}) {
    const nodes = {};
    teeth.forEach((t) => {
      const g = svgEl('g', { class: interactive ? 'otooth' : 'tooth', 'data-fdi': t.fdi }, parent);
      const shape = svgEl('g', { class: 'tooth__shape' }, g);
      const body = svgEl('path', { class: 'tooth__body', d: t.path }, shape);
      const det = svgEl('path', { class: 'tooth__detail', d: t.detail }, shape);
      let num = null;
      if (numbers) {
        num = svgEl('text', { class: 'tooth__num', x: f(t.lx), y: f(t.ly) }, g);
        num.textContent = t.fdi;
      }
      nodes[t.fdi] = { g, shape, body, det, num, t };
    });
    return nodes;
  }

  // isprekidana linija luka (unutrašnja strana)
  function archGuide(parent, teeth, inset) {
    const side = (q) => teeth.filter((t) => t.q === q).sort((a, b) => a.pos - b.pos);
    const pt = (t) => [t.cx - t.N[0] * (t.d / 2 + inset), t.cy - t.N[1] * (t.d / 2 + inset)];
    const qs = [...new Set(teeth.map((t) => t.q))];
    const a = side(qs[0]).reverse().map(pt);
    const b = side(qs[1]).map(pt);
    const all = a.concat(b);
    let d = `M${f(all[0][0])} ${f(all[0][1])}`;
    for (let i = 1; i < all.length - 1; i++) {
      const mx = (all[i][0] + all[i + 1][0]) / 2, my = (all[i][1] + all[i + 1][1]) / 2;
      d += `Q${f(all[i][0])} ${f(all[i][1])} ${f(mx)} ${f(my)}`;
    }
    d += `L${f(all[all.length - 1][0])} ${f(all[all.length - 1][1])}`;
    return svgEl('path', { class: 'arch-guide', d }, parent);
  }

  const HERO_CTRL = [[0, 0], [15, 0], [27.5, 9], [30, 46]];
  const CHART_U = [[0, 0], [17, 0], [30.5, 6.5], [33.5, 36]];
  const CHART_L = [[0, 0], [14, 0], [28, 6], [31.5, 34]];

  /* ------------------------------------------------------------------
     HERO — usporedba prije / poslije (ljuskice, ilustracija)
     ------------------------------------------------------------------ */
  function initCompare() {
    const box = $('#compare');
    const before = $('#smile-before');
    const after = $('#smile-after');
    const handle = $('#compare-handle');
    if (!box || !before || !after) return;
    buildSmile(before).apply(.5);
    buildSmile(after).apply(0);
    before.style.setProperty('--shade', '#d6bd8f');
    after.style.setProperty('--shade', '#f6f1e5');

    let pos = 50, dragging = false, intro = null;
    const set = (p) => {
      pos = clamp(p, 0, 100);
      box.style.setProperty('--pos', `${f(pos)}%`);
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      handle.setAttribute('aria-valuetext', `${Math.round(100 - pos)} % poslije`);
    };
    const fromEvent = (e) => {
      const r = box.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    const stopIntro = () => { if (intro) { cancelAnimationFrame(intro); intro = null; } };
    box.addEventListener('pointerdown', (e) => {
      stopIntro();
      dragging = true;
      box.classList.add('is-dragging');
      box.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    box.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
    const end = () => { dragging = false; box.classList.remove('is-dragging'); };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 4;
      let p = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') p = pos - step;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') p = pos + step;
      if (e.key === 'Home') p = 0;
      if (e.key === 'End') p = 100;
      if (p !== null) { e.preventDefault(); stopIntro(); set(p); }
    });
    set(50);

    // kratka najava da se klizač može pomicati
    if (!reduceMotion) {
      const keys = [[0, 50], [900, 24], [1900, 76], [2700, 50]];
      let t0 = null;
      const run = (t) => {
        if (t0 === null) t0 = t;
        const e = t - t0;
        if (e >= keys[keys.length - 1][0]) { set(50); intro = null; return; }
        let k = 0; while (e > keys[k + 1][0]) k++;
        const [ta, pa] = keys[k], [tb, pb] = keys[k + 1];
        set(lerp(pa, pb, easeInOut((e - ta) / (tb - ta))));
        intro = requestAnimationFrame(run);
      };
      const io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { io.disconnect(); setTimeout(() => { if (!dragging) intro = requestAnimationFrame(run); }, 1100); }
      }, { threshold: .5 });
      io.observe(box);
    }
  }

  /* ------------------------------------------------------------------
     USLUGE — harmonika
     ------------------------------------------------------------------ */
  function openService(li, { scroll = false, flash = false } = {}) {
    if (!li) return;
    $$('.svc.is-open').forEach((o) => { if (o !== li) toggleService(o, false); });
    toggleService(li, true);
    if (scroll) {
      const y = li.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 76) - 24;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (flash) { li.classList.remove('is-flash'); void li.offsetWidth; li.classList.add('is-flash'); }
  }
  function toggleService(li, open) {
    const btn = $('.svc__head', li);
    const state = open === undefined ? !li.classList.contains('is-open') : open;
    li.classList.toggle('is-open', state);
    btn.setAttribute('aria-expanded', String(state));
  }
  function initServices() {
    $$('.svc').forEach((li) => {
      $('.svc__head', li).addEventListener('click', () => {
        const willOpen = !li.classList.contains('is-open');
        if (willOpen) openService(li); else toggleService(li, false);
      });
    });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#usluga-"]');
      if (!a) return;
      const li = document.getElementById(a.getAttribute('href').slice(1));
      if (!li) return;
      e.preventDefault();
      openService(li, { scroll: true, flash: true });
    });
  }

  /* ------------------------------------------------------------------
     PROTETIKA — presjek zuba: ljuskica / krunica / implantat
     ------------------------------------------------------------------ */
  const PROSTH = {
    ljuskica: {
      title: 'Keramička ljuskica',
      text: 'Tanka keramička ljuskica lijepi se na prednju plohu zuba. Mijenja boju, oblik i duljinu zuba, a zub se brusi tek minimalno.',
      facts: [['Kada', 'Potamnjeli, okrnjeni ili neujednačeni prednji zubi, manji razmaci'], ['Brušenje', 'Minimalno, samo prednja ploha zuba'], ['Izrada', 'Obično dva posjeta']]
    },
    krunica: {
      title: 'Krunica',
      text: 'Krunica prekriva cijeli zub poput kapice i vraća mu oblik, čvrstoću i funkciju. Izrađuje se po mjeri, u boji Vaših zuba.',
      facts: [['Kada', 'Jako oštećen zub, zub nakon liječenja kanala, velika stara plomba'], ['Brušenje', 'Zub se brusi sa svih strana'], ['Izrada', 'Obično dva do tri posjeta']]
    },
    implantat: {
      title: 'Implantat s krunicom',
      text: 'Titanski implantat zamjenjuje korijen izgubljenog zuba. Kad sraste s kosti, na njega dolazi nadogradnja i krunica — susjedni zubi ostaju netaknuti.',
      facts: [['Kada', 'Zub nedostaje ili ga nije moguće sačuvati'], ['Zahvat', 'Kirurški, u lokalnoj anesteziji'], ['Trajanje', 'Nekoliko mjeseci, zbog srastanja s kosti']]
    }
  };

  function initProsth() {
    const svg = $('#pcard-svg');
    const card = $('#pcard');
    if (!svg || !card) return;
    const g = (cls) => svgEl('g', { class: cls }, svg);

    // kost s blagom teksturom
    const bone = g('pl-bone');
    svgEl('rect', { class: 'p-bone', x: 24, y: 168, width: 272, height: 132, rx: 18 }, bone);
    [[60, 200, 7, 4], [92, 236, 5, 3], [70, 270, 8, 4], [118, 284, 6, 3], [212, 206, 6, 3], [246, 238, 8, 4], [226, 276, 6, 3], [262, 268, 5, 3], [44, 236, 4, 3], [278, 204, 4, 3], [196, 288, 5, 3], [104, 210, 4, 2]]
      .forEach(([cx, cy, rx, ry]) => svgEl('ellipse', { class: 'p-bone-dot', cx, cy, rx, ry }, bone));

    // desni (iza zuba, uz vrat zuba)
    const gum = g('pl-gum');
    svgEl('path', { class: 'p-gum', d: 'M24 192L24 162C70 160 102 152 121 137L199 137C218 152 250 160 296 162L296 192Z' }, gum);
    svgEl('path', { class: 'p-gum-edge', d: 'M24 162C70 160 102 152 121 137M199 137C218 152 250 160 296 162' }, gum);

    // vlastiti zub, brušeni zub, pulpa
    const natural = g('pl pl-natural');
    svgEl('path', { class: 'p-tooth', d: 'M150 40C140 42 128 70 124 100C121 120 122 140 126 152C130 190 142 240 160 272C174 240 186 190 192 152C196 140 200 124 196 110C190 92 172 60 164 44C161 39 155 38 150 40Z' }, natural);
    const stump = g('pl pl-stump');
    svgEl('path', { class: 'p-stump', d: 'M147 74C140 76 135 96 133 116C132 130 132 140 133 147L127 152C130 190 142 240 160 272C174 240 186 190 192 152L187 147C188 140 189 130 187 118C185 100 174 78 165 73C159 70 153 70 147 74Z' }, stump);
    const pulp = g('pl pl-pulp');
    svgEl('path', { class: 'p-pulp', d: 'M157 98C153 124 152 152 155 190C157 222 159 246 160 258C162 246 164 222 166 190C169 152 168 124 163 98C161 92 159 92 157 98Z' }, pulp);

    // implantat + nadogradnja
    const imp = g('pl pl-implant');
    svgEl('path', { class: 'p-implant', d: 'M143 164L177 164L174 258Q160 282 146 258Z' }, imp);
    for (let y = 176; y <= 252; y += 12) svgEl('line', { class: 'p-thread', x1: 142 + (y - 164) * .03, y1: y + 3, x2: 178 - (y - 164) * .03, y2: y - 3 }, imp);
    const abut = g('pl pl-abut');
    svgEl('path', { class: 'p-abut', d: 'M148 128L172 128L178 164L142 164Z' }, abut);

    // protetski radovi
    const ven = g('pl pl-veneer');
    svgEl('path', { class: 'p-veneer', d: 'M151 34C139 36 124 66 119 98C116 118 117 138 122 150L127 150C124 138 124 120 127 100C131 72 142 44 151 40Z' }, ven);
    const crown = g('pl pl-crown');
    svgEl('path', { class: 'p-crown', d: 'M150 38C139 40 126 69 122 100C119 120 120 140 124 153L194 153C198 140 202 124 198 109C192 91 173 58 165 42C162 37 155 36 150 38Z' }, crown);

    // oznake s linijama
    const label = (cls, x, y, tx, ty, text, anchor = 'start', accent = false) => {
      const l = g('lbl ' + cls);
      svgEl('path', { class: 'p-lead', d: `M${x} ${y}L${tx} ${ty}` }, l);
      svgEl('circle', { class: 'p-lead-dot', cx: x, cy: y, r: 2.2 }, l);
      const t = svgEl('text', { class: 'p-label' + (accent ? ' p-label--accent' : ''), x: tx + (anchor === 'end' ? -6 : 6), y: ty + 3.5, 'text-anchor': anchor }, l);
      t.textContent = text;
    };
    label('lbl--ljuskica', 121, 96, 64, 70, 'Ljuskica', 'end', true);
    label('lbl--ljuskica', 172, 104, 236, 78, 'Vlastiti zub');
    label('lbl--ljuskica lbl--krunica', 182, 214, 244, 230, 'Korijen');
    label('lbl--krunica', 126, 92, 64, 70, 'Krunica', 'end', true);
    label('lbl--krunica', 176, 112, 236, 92, 'Brušeni zub');
    label('lbl--implantat', 126, 92, 64, 70, 'Krunica', 'end', true);
    label('lbl--implantat', 174, 146, 236, 128, 'Nadogradnja');
    label('lbl--implantat', 176, 218, 236, 232, 'Implantat', 'start', true);
    label('lbl--all', 70, 170, 46, 130, 'Desni', 'end');
    label('lbl--all', 84, 252, 46, 286, 'Kost', 'end');
    $('#pcard-legend').textContent = 'Presjek zuba · ilustracija';

    const tabs = $$('.ptab');
    const panel = $('#ppanel');
    const render = (mode, focus = false) => {
      const d = PROSTH[mode];
      card.dataset.mode = mode;
      tabs.forEach((t) => {
        const on = t.dataset.mode === mode;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.setAttribute('tabindex', on ? '0' : '-1');
        if (on && focus) t.focus();
      });
      panel.setAttribute('aria-labelledby', 'ptab-' + mode);
      $('#p-title').textContent = d.title;
      $('#p-text').textContent = d.text;
      $('#p-facts').innerHTML = d.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
      panel.classList.remove('is-swapping'); void panel.offsetWidth; panel.classList.add('is-swapping');
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => render(t.dataset.mode));
      t.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        if (j !== null) { e.preventDefault(); render(tabs[j].dataset.mode, true); }
      });
    });
    render('ljuskica');
  }

  /* ------------------------------------------------------------------
     VODIČ — interaktivni odontogram + procjena
     ------------------------------------------------------------------ */
  const SYMPTOMS = [
    { id: 'hladno', label: 'Osjetljiv na hladno ili slatko' },
    { id: 'bol', label: 'Pulsirajuća ili noćna bol' },
    { id: 'zagriz', label: 'Boli kad zagrizem' },
    { id: 'otok', label: 'Oteklina desni ili lica' },
    { id: 'krvarenje', label: 'Desni krvare' },
    { id: 'slomljen', label: 'Okrnjen ili slomljen zub' },
    { id: 'nedostaje', label: 'Nedostaje zub' },
    { id: 'boja', label: 'Promijenjena boja' },
    { id: 'oblik', label: 'Ne sviđa mi se oblik ili razmak' },
    { id: 'kontrola', label: 'Ništa ne boli — želim kontrolu' }
  ];
  const RESULTS = {
    hladno: { level: 1, urg: 'Naručite se na pregled u idućih par tjedana', title: 'Mogući karijes ili ogoljeni vrat zuba', text: 'Kratka, oštra bol na hladno ili slatko koja brzo prođe najčešće znači početni karijes, istrošenu caklinu ili desni koje su se povukle. Otkriveno na vrijeme, rješava se jednostavnim ispunom.', svc: [['usluga-lijecenje', 'Ispuni'], ['usluga-pregled', 'Pregled i rendgen']], reason: 'Plomba / liječenje zuba' },
    bol: { level: 3, urg: 'Javite se što prije', title: 'Moguća upala zubnog živca', text: 'Bol koja pulsira, budi Vas noću ili dugo traje nakon hladnog i toplog često znači upalu zubnog živca. Zub se u pravilu može spasiti liječenjem korijenskih kanala.', svc: [['usluga-lijecenje', 'Liječenje kanala'], ['usluga-pregled', 'Rendgenski snimak']], reason: 'Bol ili hitan slučaj', call: true },
    zagriz: { level: 2, urg: 'Javite se ovih dana', title: 'Moguća upala oko korijena ili napuknuće', text: 'Bol pri zagrizu može dolaziti od upale u vrhu korijena, napukle plombe ili pukotine u zubu. Pregled i rendgenski snimak pokazat će točan uzrok.', svc: [['usluga-pregled', 'Pregled i rendgen'], ['usluga-lijecenje', 'Liječenje zuba']], reason: 'Bol ili hitan slučaj' },
    otok: { level: 3, urg: 'Nazovite odmah', title: 'Moguća infekcija — ne čekajte', text: 'Oteklina desni ili lica najčešće znači gnojnu upalu koju treba zbrinuti što prije. Ne grijte otečeno mjesto. Ako se oteklina širi, imate temperaturu ili otežano gutate, bez odgađanja se javite hitnoj službi.', svc: [['usluga-lijecenje', 'Liječenje zuba'], ['usluga-pregled', 'Rendgenski snimak']], reason: 'Bol ili hitan slučaj', call: true },
    krvarenje: { level: 2, urg: 'Naručite se uskoro', title: 'Moguća upala desni', text: 'Desni koje krvare pri pranju zuba ili koncu znak su upale (gingivitisa ili parodontitisa). Uz profesionalno čišćenje i dobru njegu upala se smiruje, a zubi ostaju čvrsti.', svc: [['usluga-ciscenje', 'Čišćenje kamenca'], ['usluga-pregled', 'Pregled']], reason: 'Čišćenje kamenca' },
    slomljen: { level: 2, urg: 'Javite se ovih dana', title: 'Okrnjen zub treba zaštititi', text: 'Manji okrnjeni dio nadograđuje se kompozitom, a kod većeg loma zub najbolje štiti krunica. Do pregleda izbjegavajte žvakanje na tu stranu.', svc: [['usluga-lijecenje', 'Ispun'], ['usluga-protetika', 'Krunica']], reason: 'Krunica / most' },
    nedostaje: { level: 1, urg: 'Bez žurbe — dogovorite konzultacije', title: 'Prazan prostor vrijedi popuniti', text: 'Kad zub nedostaje, susjedni zubi se s vremenom pomiču, a kost se povlači. Trajna rješenja su implantat s krunicom ili most — usporedbu pogledajte u sekciji Protetika.', svc: [['usluga-implantati', 'Radovi na implantatima'], ['usluga-protetika', 'Mostovi']], reason: 'Implantat' },
    boja: { level: 1, urg: 'Bez žurbe — naručite se na pregled', title: 'Promjena boje ima rješenje', text: 'Ako su zubi ravnomjerno potamnjeli od kave, čaja ili cigareta, pomažu čišćenje i izbjeljivanje. Kod zuba koji se izbjeljivanjem ne mogu posvijetliti, rješenje je keramička ljuskica ili krunica.', svc: [['usluga-estetika', 'Estetika i izbjeljivanje'], ['usluga-protetika', 'Ljuskice']], reason: 'Estetika / izbjeljivanje' },
    oblik: { level: 1, urg: 'Bez žurbe — dogovorite konzultacije', title: 'Oblik i razmake moguće je uskladiti', text: 'Neujednačeni, kratki ili okrnjeni prednji zubi i manji razmaci često se rješavaju kompozitom ili keramičkim ljuskicama — uz minimalno brušenje zuba.', svc: [['usluga-protetika', 'Ljuskice'], ['usluga-estetika', 'Estetska dentalna medicina']], reason: 'Ljuskice' },
    kontrola: { level: 1, urg: 'Redovita kontrola', title: 'Odlično — prevencija je najbolja terapija', text: 'Preporučuje se kontrola i profesionalno čišćenje otprilike svakih šest mjeseci. Tako se problemi otkriju dok su mali i bezbolni za liječenje.', svc: [['usluga-pregled', 'Pregled'], ['usluga-ciscenje', 'Čišćenje']], reason: 'Pregled / kontrola' }
  };

  function initGuide() {
    const svg = $('#odonto-svg');
    if (!svg) return;
    const wrap = $('#odonto');
    const tip = $('#odonto-tip');
    const readout = $('#tooth-readout');
    const noneBtn = $('#tooth-none');
    const symBox = $('#symptoms');
    const result = $('#result');
    const step1 = $('#gstep-1'), step2 = $('#gstep-2');

    const state = { tooth: null, symptom: null };
    const rowU = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const rowL = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
    let nodes = {}, vb = null, focusFdi = 11;
    const narrow = window.matchMedia('(max-width: 720px)');

    // crtanje odontograma (na mobitelu uži i viši luk = veći zubi za dodir)
    function build() {
      svg.textContent = '';
      const cu = narrow.matches ? HERO_CTRL : CHART_U;
      const cl = narrow.matches ? [[0, 0], [12, 0], [25, 8.5], [28, 44]] : CHART_L;
      const U = layoutJaw('U', cu).teeth.map((t) => buildTooth(t, 3.2));
      const bu = boundsOf(U, false);
      let L = layoutJaw('L', cl).teeth.map((t) => buildTooth(t, 3.2));
      const bl = boundsOf(L, false);
      const dy = (bu.y1 + 7) - bl.y0;
      L = L.map((t) => buildTooth(Object.assign(t, { cy: t.cy + dy }), 3.2));
      const all = U.concat(L);
      const b = boundsOf(all);
      const mx = narrow.matches ? 1.5 : 7, my = 1.5;
      vb = { x: b.x0 - mx, y: b.y0 - my, w: b.x1 - b.x0 + mx * 2, h: b.y1 - b.y0 + my * 2 };
      svg.setAttribute('viewBox', `${f(vb.x)} ${f(vb.y)} ${f(vb.w)} ${f(vb.h)}`);
      wrap.classList.toggle('is-narrow', narrow.matches);

      const midY = (bu.y1 + (bl.y0 + dy)) / 2;
      const inset = narrow.matches ? 10 : 2;
      svgEl('line', { class: 'odonto__mid', x1: f(b.x0 + inset), x2: f(b.x1 - inset), y1: f(midY), y2: f(midY) }, svg);
      const sideY = narrow.matches ? midY : midY - 3.2;
      const side1 = svgEl('text', { class: 'odonto__side', x: f(vb.x + 1), y: f(sideY) }, svg); side1.textContent = 'Desno';
      const side2 = svgEl('text', { class: 'odonto__side', x: f(vb.x + vb.w - 1), y: f(sideY), 'text-anchor': 'end' }, svg); side2.textContent = 'Lijevo';
      const lu = svgEl('text', { class: 'odonto__label', x: 0, y: f(bu.y0 + (bu.y1 - bu.y0) * .5) }, svg); lu.textContent = 'Gornja vilica';
      const ll = svgEl('text', { class: 'odonto__label', x: 0, y: f(bl.y0 + dy + (bl.y1 - bl.y0) * .5) }, svg); ll.textContent = 'Donja vilica';

      nodes = drawTeeth(svgEl('g', {}, svg), all, { interactive: true });
      Object.values(nodes).forEach(({ g, shape, t }) => {
        svgEl('circle', { class: 'sel-ring', cx: f(t.cx), cy: f(t.cy), r: f(t.r + 1.2) }, shape);
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', t.fdi === focusFdi ? '0' : '-1');
        g.setAttribute('aria-pressed', String(state.tooth === t.fdi));
        g.setAttribute('aria-label', `Zub ${t.fdi}, ${toothName(t.fdi)}`);
        if (state.tooth === t.fdi) g.classList.add('is-sel');
      });
    }
    build();
    const onNarrow = () => build();
    if (narrow.addEventListener) narrow.addEventListener('change', onNarrow); else narrow.addListener(onNarrow);

    const showTip = (t) => {
      tip.innerHTML = `<strong>${t.fdi}</strong>${esc(toothName(t.fdi))}`;
      tip.style.left = `${clamp(((t.cx - vb.x) / vb.w) * 100, 18, 82)}%`;
      tip.style.top = `${((t.cy - t.r - vb.y) / vb.h) * 100}%`;
      tip.classList.add('is-on');
    };
    const hideTip = () => tip.classList.remove('is-on');

    const setRoving = (fdi) => {
      if (nodes[focusFdi]) nodes[focusFdi].g.setAttribute('tabindex', '-1');
      focusFdi = fdi;
      nodes[fdi].g.setAttribute('tabindex', '0');
    };

    const selectTooth = (fdi) => {
      Object.values(nodes).forEach(({ g }) => { g.classList.remove('is-sel'); g.setAttribute('aria-pressed', 'false'); });
      wrap.classList.remove('is-all');
      noneBtn.setAttribute('aria-pressed', 'false');
      if (fdi === 'all') {
        state.tooth = 'all';
        wrap.classList.add('is-all');
        noneBtn.setAttribute('aria-pressed', 'true');
        readout.innerHTML = '<strong>Cijela usta</strong><span class="muted">ili ne znam točno koji zub</span>';
      } else if (fdi) {
        state.tooth = fdi;
        nodes[fdi].g.classList.add('is-sel');
        nodes[fdi].g.setAttribute('aria-pressed', 'true');
        readout.innerHTML = `<strong>${fdi}</strong>${esc(toothName(fdi))}`;
        setRoving(fdi);
      } else {
        state.tooth = null;
        readout.textContent = 'Kliknite na zub na slici.';
      }
      step1.classList.toggle('is-done', !!state.tooth);
      renderResult();
    };

    // delegirani događaji (rade i nakon ponovnog crtanja)
    const toothOf = (e) => {
      const g = e.target.closest && e.target.closest('.otooth');
      return g ? nodes[+g.dataset.fdi] : null;
    };
    svg.addEventListener('click', (e) => { const n = toothOf(e); if (n) selectTooth(state.tooth === n.t.fdi ? null : n.t.fdi); });
    svg.addEventListener('pointerover', (e) => { const n = toothOf(e); if (n && e.pointerType !== 'touch') showTip(n.t); });
    svg.addEventListener('pointerout', (e) => { if (toothOf(e)) hideTip(); });
    svg.addEventListener('focusin', (e) => {
      const n = toothOf(e);
      if (!n) return;
      setRoving(n.t.fdi);
      let kb = true;
      try { kb = n.g.matches(':focus-visible'); } catch (err) { /* stariji preglednici */ }
      if (kb) showTip(n.t);
    });
    svg.addEventListener('focusout', hideTip);
    svg.addEventListener('keydown', (e) => {
      const n = toothOf(e);
      if (!n) return;
      const fdi = n.t.fdi;
      const inU = rowU.includes(fdi);
      const row = inU ? rowU : rowL;
      const i = row.indexOf(fdi);
      let next = null;
      if (e.key === 'ArrowRight') next = row[Math.min(row.length - 1, i + 1)];
      else if (e.key === 'ArrowLeft') next = row[Math.max(0, i - 1)];
      else if (e.key === 'ArrowDown' && inU) next = rowL[i];
      else if (e.key === 'ArrowUp' && !inU) next = rowU[i];
      else if (e.key === 'Home') next = row[0];
      else if (e.key === 'End') next = row[row.length - 1];
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTooth(state.tooth === fdi ? null : fdi); return; }
      if (next) { e.preventDefault(); setRoving(next); nodes[next].g.focus(); }
    });
    noneBtn.addEventListener('click', () => selectTooth(state.tooth === 'all' ? null : 'all'));

    // simptomi (radio grupa)
    SYMPTOMS.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('tabindex', i === 0 ? '0' : '-1');
      b.dataset.id = s.id;
      b.textContent = s.label;
      symBox.appendChild(b);
    });
    const chips = $$('.chip', symBox);
    const pickSymptom = (id) => {
      state.symptom = state.symptom === id ? null : id;
      chips.forEach((c) => {
        const on = c.dataset.id === state.symptom;
        c.setAttribute('aria-checked', String(on));
      });
      step2.classList.toggle('is-done', !!state.symptom);
      renderResult();
    };
    chips.forEach((c, i) => {
      c.addEventListener('click', () => pickSymptom(c.dataset.id));
      c.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % chips.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + chips.length) % chips.length;
        if (j !== null) { e.preventDefault(); chips.forEach((x) => x.setAttribute('tabindex', '-1')); chips[j].setAttribute('tabindex', '0'); chips[j].focus(); }
      });
    });

    function renderResult() {
      if (!state.symptom) {
        result.innerHTML = `<p class="result__empty">${state.tooth ? 'Sada odaberite što osjećate — procjena će se pojaviti ovdje.' : 'Odaberite zub i tegobu — ovdje će se pojaviti mogući uzrok i preporučeni tretman.'}</p>`;
        $('#gstep-3').classList.remove('is-done');
        return;
      }
      const r = RESULTS[state.symptom];
      const fdi = typeof state.tooth === 'number' ? state.tooth : null;
      const pos = fdi ? fdi % 10 : 0;
      const notes = [];
      const svc = r.svc.slice();
      if (fdi && pos === 8 && ['bol', 'zagriz', 'otok'].includes(state.symptom)) {
        notes.push(`Zub ${fdi} je umnjak. Bol i oteklina desni oko umnjaka koji izbija čest su razlog za njegovo vađenje.`);
        if (!svc.some((s) => s[0] === 'usluga-lijecenje')) svc.push(['usluga-lijecenje', 'Vađenje zuba']);
      }
      if (fdi && pos <= 3 && ['boja', 'slomljen', 'oblik'].includes(state.symptom)) {
        notes.push('Prednji zubi najvidljiviji su dio osmijeha — ovdje posebno pazimo na nijansu, oblik i sjaj. Često je dobro rješenje keramička ljuskica.');
        if (!svc.some((s) => s[0] === 'usluga-estetika')) svc.push(['usluga-estetika', 'Estetska stomatologija']);
      }
      if (fdi && state.symptom === 'boja') notes.push(`Ako je potamnio samo zub ${fdi}, a ostali nisu, naručite se na pregled kako bismo provjerili vitalnost živca.`);
      if (!state.tooth && state.symptom !== 'kontrola') notes.push('Savjet: odaberite i zub na slici — tako ćemo u upitu točno znati o kojem se zubu radi.');

      result.innerHTML = `
        <div class="result__card">
          <span class="result__urg" data-level="${r.level}"><span class="result__bars" aria-hidden="true"><i></i><i></i><i></i></span>${esc(r.urg)}</span>
          <h4 class="result__title">${esc(r.title)}</h4>
          <p class="result__text">${esc(r.text)}</p>
          ${notes.map((n) => `<p class="result__note">${esc(n)}</p>`).join('')}
          <div class="result__svc">${svc.map(([id, l]) => `<a href="#${id}">${esc(l)}<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>`).join('')}</div>
          <div class="result__actions">
            <button type="button" class="btn btn--primary btn--sm" data-act="prefill"><span>Prenesi u upit za termin</span><svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></button>
            ${r.call ? `<a class="btn btn--ghost btn--sm" href="tel:${CONFIG.phone}"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg><span>Nazovite ${CONFIG.phoneDisplay}</span></a>` : ''}
          </div>
        </div>`;
      $('#gstep-3').classList.add('is-done');
      $('[data-act="prefill"]', result).addEventListener('click', () => {
        const sym = SYMPTOMS.find((s) => s.id === state.symptom).label;
        const where = fdi ? `zub ${fdi} (${toothName(fdi)})` : (state.tooth === 'all' ? 'cijela usta / nisam siguran koji zub' : '');
        const msg = `Iz vodiča: ${where ? where + ' — ' : ''}${sym.toLowerCase()}.`;
        prefillForm(msg, r.reason);
      });
    }
  }

  function prefillForm(message, reason) {
    const form = $('#booking');
    const msg = $('#f-msg');
    const sel = $('#f-reason');
    if (reason) Array.from(sel.options).forEach((o) => { if (o.value === reason) sel.value = reason; });
    msg.value = message;
    const field = msg.closest('.field');
    field.classList.remove('is-prefilled'); void field.offsetWidth; field.classList.add('is-prefilled');
    const top = form.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  }

  /* ==================================================================
     ZUBI SPRIJEDA (aligneri + skala nijansi)
     ================================================================== */
  const FRONT_U = [null,
    { w: 8.6, h: 10.6, f: 1, g: 0, type: 'inc' },
    { w: 6.6, h: 9.2, f: .86, g: .55, type: 'inc' },
    { w: 7.6, h: 10.3, f: .7, g: -.5, type: 'can' },
    { w: 7.0, h: 8.4, f: .54, g: .55, type: 'pre' },
    { w: 6.6, h: 7.8, f: .42, g: 1.15, type: 'pre' }];
  const FRONT_L = [null,
    { w: 5.3, h: 8.0, f: 1, e: 8.3, type: 'inc' },
    { w: 5.9, h: 8.4, f: .9, e: 8.4, type: 'inc' },
    { w: 6.9, h: 9.2, f: .74, e: 7.9, type: 'can' },
    { w: 7.1, h: 7.8, f: .56, e: 8.6, type: 'pre' }];
  const FGAP = .28;

  // put krune (desna strana slike; mezijalno = lijevo)
  function frontPath(type, W, h) {
    const a = W / 2;
    const p = (x, y) => `${f(x)} ${f(y)}`;
    if (type === 'inc') {
      return `M${p(-a * .8, 0)}Q${p(0, -h * .1)} ${p(a * .8, 0)}C${p(a * .96, h * .25)} ${p(a, h * .55)} ${p(a, h * .8)}Q${p(a, h)} ${p(a * .6, h)}L${p(-a * .72, h)}Q${p(-a, h)} ${p(-a, h * .85)}C${p(-a, h * .55)} ${p(-a * .96, h * .25)} ${p(-a * .8, 0)}Z`;
    }
    if (type === 'can') {
      return `M${p(-a * .78, 0)}Q${p(0, -h * .12)} ${p(a * .78, 0)}C${p(a * .96, h * .25)} ${p(a, h * .5)} ${p(a * .95, h * .7)}Q${p(a * .66, h * .9)} ${p(-a * .05, h)}Q${p(-a * .62, h * .9)} ${p(-a * .95, h * .72)}C${p(-a, h * .5)} ${p(-a * .96, h * .25)} ${p(-a * .78, 0)}Z`;
    }
    return `M${p(-a * .8, 0)}Q${p(0, -h * .1)} ${p(a * .8, 0)}C${p(a * .97, h * .25)} ${p(a, h * .55)} ${p(a * .96, h * .74)}Q${p(a * .8, h * .97)} ${p(0, h)}Q${p(-a * .8, h * .97)} ${p(-a * .96, h * .74)}C${p(-a, h * .55)} ${p(-a * .97, h * .25)} ${p(-a * .8, 0)}Z`;
  }
  function shinePath(W, h) {
    const a = W / 2;
    return `M${f(-a * .46)} ${f(h * .2)}Q${f(-a * .56)} ${f(h * .45)} ${f(-a * .4)} ${f(h * .7)}`;
  }

  // početni "krivi" raspored za alignere: [dx, dy, rotacija°, skala]
  const CROOKED = {
    11: [.55, .5, 6, 1], 21: [-.9, -.25, -8, 1], 12: [1.15, .85, -11, .93], 22: [-.45, .95, 12, .95],
    13: [-.6, -1.7, 7, 1], 23: [.75, -1.25, -6, 1], 14: [.3, .5, 4, 1], 24: [-.3, .6, -5, 1], 15: [.1, .3, 2, 1], 25: [-.1, .45, -3, 1],
    41: [.65, -.5, -9, 1], 31: [-.5, -.85, 10, 1], 42: [-.75, -.25, 8, .94], 32: [.9, -.45, -12, .95], 43: [.4, .55, -5, 1], 33: [-.5, .4, 6, 1], 44: [0, .3, 3, 1], 34: [0, .2, -3, 1]
  };

  function buildSmile(svg, { tray = false, dark = false } = {}) {
    const teeth = [];
    const layoutRow = (row, jaw) => {
      [1, -1].forEach((side) => {
        let x = 0;
        for (let pos = 1; pos < row.length; pos++) {
          const r = row[pos];
          const W = r.w * r.f;
          const cx = (x + W / 2) * side;
          x += W + FGAP;
          const q = jaw === 'U' ? (side < 0 ? 1 : 2) : (side > 0 ? 3 : 4);
          const gy = jaw === 'U' ? r.g : r.e + r.h;
          teeth.push({ fdi: q * 10 + pos, jaw, side, pos, type: r.type, W, h: r.h, cx, gy });
        }
      });
    };
    layoutRow(FRONT_U, 'U');
    layoutRow(FRONT_L, 'L');
    const halfW = teeth.reduce((m, t) => Math.max(m, Math.abs(t.cx) + t.W / 2), 0);
    const X = halfW + 4;
    svg.setAttribute('viewBox', `${f(-X)} -9 ${f(X * 2)} 33`);

    // desni (blijede prema van) i unutrašnjost usta
    const k = dark ? 'd' : 'l';
    svgEl('ellipse', { class: 'gum', cx: 0, cy: 1.2, rx: f(halfW + .6), ry: 9, fill: `url(#gumU-${k})` }, svg);
    svgEl('ellipse', { class: 'gum', cx: 0, cy: 15.4, rx: f(halfW - 1.6), ry: 7.6, fill: `url(#gumL-${k})` }, svg);
    svgEl('ellipse', { class: 'mouth', cx: 0, cy: 9.4, rx: f(halfW - .2), ry: 5.4, fill: `url(#mouth-${k})` }, svg);

    const nodes = {};
    const lower = teeth.filter((t) => t.jaw === 'L');
    const upper = teeth.filter((t) => t.jaw === 'U');
    // dalji zubi prvi (da bliži prekriju)
    const order = (arr) => arr.slice().sort((a, b) => b.pos - a.pos);
    order(lower).concat(order(upper)).forEach((t) => {
      const g = svgEl('g', { class: 'ft', 'data-fdi': t.fdi }, svg);
      const d = frontPath(t.type, t.W, t.h);
      svgEl('path', { class: 'ftooth', d }, g);
      svgEl('path', { class: 'ftooth-tint', d, fill: 'url(#ftint)' }, g);
      svgEl('path', { class: 'ftooth-shine', d: shinePath(t.W, t.h) }, g);
      if (tray) svgEl('path', { class: 'tray', d, transform: `translate(0 ${f(t.h / 2)}) scale(1.09 1.07) translate(0 ${f(-t.h / 2)})` }, g);
      nodes[t.fdi] = { g, t };
    });

    const apply = (k) => {
      Object.values(nodes).forEach(({ g, t }) => {
        const c = CROOKED[t.fdi] || [0, 0, 0, 1];
        const dx = c[0] * k, dy = c[1] * k, rot = c[2] * k, s = 1 + (c[3] - 1) * k;
        const sy = t.jaw === 'U' ? 1 : -1;
        g.setAttribute('transform', `translate(${f(t.cx + dx)} ${f(t.gy + dy)}) rotate(${f(rot)} 0 ${f(sy * t.h / 2)}) scale(${f(t.side < 0 ? -s : s)} ${f(sy * s)})`);
      });
    };
    apply(0);
    return { apply };
  }

  /* ------------------------------------------------------------------
     TIM — uzorak na karticama / fotografije
     ------------------------------------------------------------------ */
  function initPortraits() {
    const jaws = {
      U: layoutJaw('U', HERO_CTRL).teeth.map((t) => buildTooth(t)),
      L: layoutJaw('L', [[0, 0], [12, 0], [24.5, 8.5], [27.5, 44]]).teeth.map((t) => buildTooth(t))
    };
    $$('.portrait').forEach((portrait) => {
      const svg = $('.portrait__pattern', portrait);
      if (svg) {
        const T = jaws[portrait.classList.contains('portrait--alt') ? 'L' : 'U'];
        const b = boundsOf(T, false);
        svg.setAttribute('viewBox', `${f(b.x0 - 2)} ${f(b.y0 - 2)} ${f(b.x1 - b.x0 + 4)} ${f(b.y1 - b.y0 + 4)}`);
        archGuide(svg, T, 3.2);
        drawTeeth(svg, T, { numbers: false });
      }
      const src = CONFIG.photos[portrait.dataset.photoKey];
      if (src) {
        const img = new Image();
        img.className = 'portrait__photo';
        img.alt = $('.portrait__caption strong', portrait).textContent;
        img.decoding = 'async';
        img.onload = () => { portrait.prepend(img); portrait.classList.add('has-photo'); };
        img.src = src;
      }
    });
  }

  /* ------------------------------------------------------------------
     PITANJA
     ------------------------------------------------------------------ */
  function initFaq() {
    $$('.qa').forEach((qa) => {
      const btn = $('.qa__q', qa);
      btn.addEventListener('click', () => {
        const open = !qa.classList.contains('is-open');
        $$('.qa.is-open').forEach((o) => { if (o !== qa) { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); } });
        qa.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ------------------------------------------------------------------
     MAPA — učitava se tek na klik (privatnost i brzina)
     ------------------------------------------------------------------ */
  function initMap() {
    const btn = $('#map-load');
    const map = $('#map');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const ifr = document.createElement('iframe');
      ifr.src = CONFIG.mapsEmbed;
      ifr.title = 'Karta – Dental Centar Kubica, Marulićeva ulica 3, Pula';
      ifr.loading = 'lazy';
      ifr.referrerPolicy = 'no-referrer-when-downgrade';
      ifr.allowFullscreen = true;
      map.appendChild(ifr);
      map.classList.add('is-loaded');
    });
  }

  /* ------------------------------------------------------------------
     FORMA ZA TERMIN
     ------------------------------------------------------------------ */
  function initForm() {
    const form = $('#booking');
    if (!form) return;
    const name = $('#f-name'), phone = $('#f-phone'), consent = $('#f-consent');
    const done = $('#form-done');
    const submit = $('.form__submit', form);

    const setErr = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('is-invalid', !!msg);
      $('.field__err', field).textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    const validName = () => { const ok = name.value.trim().length >= 2; setErr(name, ok ? '' : 'Upišite ime i prezime.'); return ok; };
    const validPhone = () => {
      const digits = phone.value.replace(/\D/g, '');
      const ok = digits.length >= 8 && digits.length <= 15;
      setErr(phone, ok ? '' : 'Upišite broj telefona na koji Vas možemo nazvati.');
      return ok;
    };
    const validConsent = () => {
      const ok = consent.checked;
      consent.closest('.consent').classList.toggle('is-invalid', !ok);
      $('#consent-err').textContent = ok ? '' : 'Potrebna je Vaša suglasnost kako bismo Vas mogli kontaktirati.';
      return ok;
    };
    name.addEventListener('blur', () => name.value && validName());
    phone.addEventListener('blur', () => phone.value && validPhone());
    name.addEventListener('input', () => name.closest('.field').classList.contains('is-invalid') && validName());
    phone.addEventListener('input', () => phone.closest('.field').classList.contains('is-invalid') && validPhone());
    consent.addEventListener('change', validConsent);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = [validName(), validPhone(), validConsent()];
      if (ok.includes(false)) {
        const first = [name, phone, consent][ok.indexOf(false)];
        first.focus();
        return;
      }
      const data = {
        ime: name.value.trim(),
        telefon: phone.value.trim(),
        razlog: $('#f-reason').value,
        termin: $$('input[name="termin"]:checked', form).map((i) => i.value).join(', ') || 'Bilo kada',
        poruka: $('#f-msg').value.trim()
      };
      const text = `Upit za termin (dentalcentarkubica.hr)\n\nIme: ${data.ime}\nTelefon: ${data.telefon}\nRazlog: ${data.razlog}\nTermin: ${data.termin}${data.poruka ? `\nPoruka: ${data.poruka}` : ''}`;

      if (CONFIG.formEndpoint) {
        submit.classList.add('is-loading');
        $('.form__submit-label', submit).textContent = 'Šaljem…';
        try {
          const res = await fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _subject: `Upit za termin – ${data.ime}` }, data)) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          showDone('sent', data, text);
        } catch (err) {
          showDone('fallback', data, text);
        } finally {
          submit.classList.remove('is-loading');
          $('.form__submit-label', submit).textContent = 'Pošalji upit';
        }
      } else {
        showDone('ready', data, text);
      }
    });

    function showDone(mode, data, text) {
      const title = $('#form-done-title'), p = $('#form-done-text'), actions = $('#form-done-actions');
      const first = esc(data.ime.split(' ')[0]);
      const mail = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Upit za termin – ' + data.ime)}&body=${encodeURIComponent(text)}`;
      const wa = CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}` : '';
      const btns = [
        `<a class="btn btn--primary btn--sm" href="${mail}"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg><span>Pošalji e-mailom</span></a>`,
        wa ? `<a class="btn btn--ghost btn--sm" href="${wa}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg><span>WhatsApp</span></a>` : '',
        `<a class="btn btn--ghost btn--sm" href="tel:${CONFIG.phone}"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg><span>Nazovi</span></a>`
      ];
      if (mode === 'sent') {
        title.textContent = `Hvala, ${data.ime.split(' ')[0]}!`;
        p.innerHTML = `Upit je poslan. Javit ćemo Vam se na broj <strong>${esc(data.telefon)}</strong> u radno vrijeme ordinacije.`;
        actions.innerHTML = '';
      } else if (mode === 'fallback') {
        title.textContent = 'Upit nije poslan';
        p.innerHTML = `Došlo je do pogreške u vezi, ${first}. Pošaljite upit jednim klikom na drugi način — poruka je već ispunjena.`;
        actions.innerHTML = btns.join('');
      } else {
        title.textContent = `Upit je spreman, ${data.ime.split(' ')[0]}.`;
        p.innerHTML = 'Odaberite kako ga želite poslati — otvorit će se Vaša aplikacija s već ispunjenom porukom.';
        actions.innerHTML = btns.join('');
      }
      done.hidden = false;
      done.focus({ preventScroll: true });
    }

    $('#form-reset').addEventListener('click', () => {
      form.reset();
      done.hidden = true;
      $$('.field.is-invalid', form).forEach((n) => n.classList.remove('is-invalid'));
      name.focus();
    });
  }

  /* ------------------------------------------------------------------
     MOBILNA TRAKA (Pozovi / Zakaži)
     ------------------------------------------------------------------ */
  function initDock() {
    const dock = $('#dock');
    const fab = $('#assist-fab');
    const hero = $('#pocetna');
    const contact = $('#kontakt');
    let pastHero = false, inContact = false;
    const update = () => {
      dock.classList.toggle('is-visible', pastHero && !inContact);
      fab.classList.toggle('is-hidden', window.innerWidth <= 900 && (inContact || !pastHero));
    };
    new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; update(); }, { rootMargin: '-30% 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(([en]) => { inContact = en.isIntersecting; update(); }, { rootMargin: '0px 0px -20% 0px' }).observe(contact);
  }

  /* ------------------------------------------------------------------
     ASISTENT — automatski odgovori na najčešća pitanja
     ------------------------------------------------------------------ */
  function initAssistant() {
    const fab = $('#assist-fab');
    const panel = $('#assist');
    const log = $('#assist-log');
    const chipsBox = $('#assist-chips');
    const form = $('#assist-form');
    const input = $('#assist-input');
    const closeBtn = $('#assist-close');
    if (!fab || !panel) return;

    const A = {
      call: { label: `Nazovi ${CONFIG.phoneDisplay}`, href: `tel:${CONFIG.phone}` },
      book: { label: 'Pošalji upit za termin', href: '#kontakt' },
      mail: { label: 'Pošalji e-mail', href: `mailto:${CONFIG.email}` },
      guide: { label: 'Otvori vodič kroz tegobe', href: '#vodic' },
      dir: { label: 'Upute za dolazak', href: CONFIG.mapsDir, ext: true },
      tour: { label: 'Virtualna šetnja 360°', href: CONFIG.tour, ext: true },
      prosth: { label: 'Ljuskica, krunica ili implantat?', href: '#protetika' },
      svc: (id, label) => ({ label, href: '#' + id })
    };

    const KB = [
      { keys: ['hitn', 'otok', 'otekl', 'otekao', 'natek', 'temperatur', 'gnoj', 'udario', 'udarac', 'ispao zub', 'trauma'], w: 3,
        a: () => `Kod jake boli ili otekline nazovite odmah <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a>. Ako se oteklina širi, imate povišenu temperaturu ili otežano gutate, bez odgađanja se javite hitnoj službi.`, act: [A.call] },
      { keys: ['radno', 'radite', 'vrijeme', 'otvoren', 'zatvoren', 'subot', 'nedjelj', 'vikend', 'sati', 'do kad', 'poslijepodne', 'navecer', 'praznik'],
        a: () => `Radimo <strong>ponedjeljkom, srijedom i petkom od 08 do 15 h</strong> te <strong>utorkom i četvrtkom od 08 do 20 h</strong>. Vikendom ne radimo.<br>Trenutno: ${esc(getStatus().text)}.`, act: [A.call, A.book] },
      { keys: ['gdje', 'adres', 'lokacij', 'nalazite', 'dolaz', 'karta', 'mapa', 'parking', 'parkir', 'ulica', 'marulic', 'kako doci'],
        a: () => 'Nalazimo se u centru Pule, na adresi <strong>Marulićeva ulica 3</strong>, 52100 Pula. Prije dolaska možete prošetati ordinacijom i virtualno.', act: [A.dir, A.tour] },
      { keys: ['cijen', 'kost', 'plac', 'kartic', 'rate', 'skupo', 'novac', 'eur', 'cjenik', 'hzzo', 'uputnic', 'osiguranj'],
        a: () => 'Cijena ovisi o nalazu. Nakon pregleda dobijete plan terapije s cijenom za svaki korak — prije nego što bilo što počne. Za okvirnu cijenu, načine plaćanja i pitanja o osiguranju najbolje je da nas nazovete.', act: [A.call, A.book] },
      { keys: ['termin', 'naruc', 'narud', 'zakaz', 'rezerv', 'slobod', 'dogovor', 'doci na pregled'],
        a: () => `Naručiti se možete pozivom na <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a> ili upitom na stranici — mi Vas nazovemo i dogovorimo termin.`, act: [A.book, A.call] },
      { keys: ['boli', 'bol', 'strah', 'bojim', 'anestez', 'injekc', 'igla', 'bolno', 'nervoz'],
        a: () => 'Svaki zahvat koji može boljeti radimo u lokalnoj anesteziji, a dogovoreni znak je jednostavan: podignete ruku i stajemo. Ako Vas zub trenutno boli, isprobajte naš vodič — za 20 sekundi dobijete orijentacijsku procjenu.', act: [A.guide, A.call] },
      { keys: ['ljuskic', 'faset', 'veneer', 'keramik'], a: () => 'Keramičke ljuskice lijepe se na prednju plohu zuba i mijenjaju mu boju i oblik uz minimalno brušenje. Protetika je glavni interes dr. Karla Kubice.', act: [A.prosth, A.book] },
      { keys: ['krunic', 'most', 'protez', 'navlak', 'cirkon'], a: () => 'Izrađujemo krunice i mostove po mjeri, u boji Vaših zuba. Krunica prekriva cijeli zub i vraća mu čvrstoću i oblik.', act: [A.prosth, A.svc('usluga-protetika', 'Krunice i mostovi')] },
      { keys: ['implant'], a: () => 'Implantat zamjenjuje korijen izgubljenog zuba, a na njega dolazi nadogradnja i krunica — susjedni zubi ostaju netaknuti. Fiksni radovi na implantatima dio su protetike kojom se bavi dr. Karlo Kubica.', act: [A.prosth, A.svc('usluga-implantati', 'Radovi na implantatima')] },
      { keys: ['rendgen', 'snimak', 'snimit', 'rtg', 'slikat'], a: () => 'Da, dentalni rendgen imamo u ordinaciji — snimak napravimo tijekom pregleda i nalaz zajedno pogledamo.', act: [A.svc('usluga-pregled', 'Pregled i rendgen'), A.book] },
      { keys: ['izbjelj', 'bijel', 'boja', 'boje', 'zut', 'estet', 'osmijeh'], a: () => 'Bavimo se estetskom dentalnom medicinom: izbjeljivanje, zamjena tamnih plombi, korekcija oblika i keramičke ljuskice.', act: [A.svc('usluga-estetika', 'Estetska dentalna medicina'), A.prosth] },
      { keys: ['cisc', 'kamen', 'mrlj', 'poliran', 'desni', 'krvar'], a: () => 'Profesionalno čišćenje uklanja zubni kamenac i mrlje, a desnima koje krvare vraća zdravlje. Preporuka je kontrola otprilike svakih šest mjeseci.', act: [A.svc('usluga-ciscenje', 'Čišćenje i prevencija'), A.book] },
      { keys: ['kanal', 'zivac', 'endo', 'umrtv', 'korijen'], a: () => 'Liječenjem korijenskih kanala spašavamo zub čiji je živac upaljen ili odumro. Radi se u lokalnoj anesteziji.', act: [A.svc('usluga-lijecenje', 'Ispuni i liječenje zuba')] },
      { keys: ['vadi', 'vadj', 'vaden', 'umnjak', 'izvad'], a: () => 'Vađenje radimo tek kad zub nije moguće sačuvati, u lokalnoj anesteziji i uz jasne upute za oporavak.', act: [A.svc('usluga-lijecenje', 'Ispuni i liječenje zuba'), A.book] },
      { keys: ['plomb', 'ispun', 'karijes', 'rupa', 'pokvaren'], a: () => 'Karijes liječimo estetskim kompozitnim ispunima u boji zuba — plomba se ne vidi u osmijehu.', act: [A.svc('usluga-lijecenje', 'Ispuni i liječenje zuba'), A.book] },
      { keys: ['telefon', 'broj', 'mail', 'kontakt', 'nazvat', 'viber', 'whatsapp', 'poruk'], a: () => `Telefon: <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a><br>E-mail: <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`, act: [A.call, A.mail] },
      { keys: ['doktor', 'kubica', 'elena', 'karlo', 'tko radi', 'tim', 'fakultet', 'nastavn', 'iskustv'], a: () => 'Ordinaciju vode dr. Karlo Kubica (diplomirao 2018. u Rijeci, glavni interes protetika) i dr. Elena Deghenghi Kubica (diplomirala 2017. u Rijeci). Ordinacija je nastavna baza Fakulteta dentalne medicine Sveučilišta u Rijeci.', act: [{ label: 'Upoznajte tim', href: '#tim' }] },
      { keys: ['virtualn', '360', 'setnj', 'izgleda ordinacij', 'slike'], a: () => 'Ordinaciju možete razgledati unaprijed — virtualna šetnja 360° otvara se u novom prozoru.', act: [A.tour] },
      { keys: ['hvala', 'fala', 'zahval'], a: () => 'Nema na čemu! Ako trebate još nešto, tu sam.', act: [] },
      { keys: ['bok', 'pozdrav', 'dobar dan', 'dobro jutro', 'dobra vecer', 'cao', 'hej', 'hello'], a: () => 'Dobar dan! Pitajte me o radnom vremenu, cijenama, uslugama ili naručivanju.', act: [] }
    ];
    KB.forEach((k) => { k.nkeys = k.keys.map(norm); });

    const QUICK = ['Radno vrijeme', 'Gdje se nalazite?', 'Koliko košta pregled?', 'Boli li?', 'Ljuskice', 'Kako se naručiti?'];

    const answer = (q) => {
      const n = norm(q);
      let best = null, score = 0;
      KB.forEach((k) => {
        const s = k.nkeys.reduce((acc, key) => acc + (n.includes(key) ? 1 : 0), 0) * (k.w || 1);
        if (s > score) { score = s; best = k; }
      });
      if (!best) return { html: `Nisam siguran da sam razumio pitanje. Najbrže ćete dobiti odgovor pozivom na <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a> — ili pošaljite upit, pa Vas mi nazovemo.`, act: [A.call, A.book] };
      return { html: best.a(), act: best.act };
    };

    const scrollLog = () => { log.scrollTop = log.scrollHeight; };
    const addMsg = (html, who, act = []) => {
      const m = document.createElement('div');
      m.className = `msg msg--${who}`;
      m.innerHTML = html + (act.length ? `<div class="msg__actions">${act.map((a) => `<a href="${esc(a.href)}"${a.ext ? ' target="_blank" rel="noopener"' : ''}>${esc(a.label)}</a>`).join('')}</div>` : '');
      log.appendChild(m);
      scrollLog();
      return m;
    };
    const botSay = (html, act) => {
      const t = document.createElement('div');
      t.className = 'msg msg--bot msg--typing';
      t.innerHTML = '<i></i><i></i><i></i>';
      t.setAttribute('aria-label', 'Asistent piše');
      log.appendChild(t);
      scrollLog();
      setTimeout(() => { t.remove(); addMsg(html, 'bot', act); }, reduceMotion ? 0 : 520 + Math.min(600, html.length * 3));
    };
    const ask = (q) => {
      if (!q.trim()) return;
      addMsg(esc(q), 'me');
      const r = answer(q);
      botSay(r.html, r.act);
    };

    QUICK.forEach((q) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.textContent = q;
      c.addEventListener('click', () => ask(q));
      chipsBox.appendChild(c);
    });

    let greeted = false;
    const open = () => {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      if (!greeted) {
        greeted = true;
        addMsg(`Dobar dan! Ja sam automatski asistent Dental Centra Kubica i odgovaram na najčešća pitanja. Za sve ostalo tu je telefon <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a>.`, 'bot');
      }
      if (finePointer) input.focus(); else closeBtn.focus();
    };
    const close = () => {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
      fab.focus();
    };
    fab.addEventListener('click', () => (panel.hidden ? open() : close()));
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
    form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value; input.value = ''; ask(q); });
    log.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (a && window.innerWidth <= 900) close();
    });
  }
})();
