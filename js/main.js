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
  // Ako je prazno, obrazac otvara e-mail klijent s ispunjenim upitom.
  formEndpoint: ''
};

document.addEventListener('DOMContentLoaded', () => {
  /* ---- Primijeni kontakt podatke ---- */
  document.querySelectorAll('[data-phone]').forEach(a => a.href = `tel:+${CONFIG.phoneIntl}`);
  document.querySelectorAll('[data-phone-text]').forEach(el => el.textContent = CONFIG.phoneDisplay);
  document.querySelectorAll('[data-email]').forEach(a => a.href = `mailto:${CONFIG.email}`);
  document.querySelectorAll('[data-email-text]').forEach(el => el.textContent = CONFIG.email);
  document.querySelectorAll('[data-whatsapp]').forEach(a =>
    a.href = `https://wa.me/${CONFIG.phoneIntl}?text=${encodeURIComponent(CONFIG.whatsappText)}`);

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- Header pri skrolanju ---- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobilni izbornik ---- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggleNav = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
  };
  burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

  /* ---- Aktivna poveznica u navigaciji ---- */
  const links = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sections = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObserver.observe(s));

  /* ---- Animacije pri pojavljivanju ---- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---- Brojači ---- */
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = target > 1000 ? target - 30 : 0;
      const dur = 1400;
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  /* ---- Galerija: učitaj prave fotografije ako postoje ---- */
  document.querySelectorAll('.gallery__item[data-img]').forEach(item => {
    const src = item.dataset.img;
    const img = new Image();
    img.onload = () => {
      const media = item.querySelector('.gallery__media');
      media.className = 'gallery__media';
      media.style.backgroundImage = `url("${src}")`;
      item.dataset.loaded = 'true';
    };
    img.src = src;
  });

  // Opcionalne fotografije za hero i "O nama"
  const tryBg = (src, el, cls) => {
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = cls === 'hero'
        ? `linear-gradient(100deg, rgba(20,16,12,.94) 0%, rgba(20,16,12,.78) 45%, rgba(20,16,12,.35) 100%), url("${src}")`
        : `url("${src}")`;
      if (cls === 'hero') el.parentElement.classList.add('has-photo');
    };
    img.src = src;
  };
  tryBg('img/hero.jpg', document.querySelector('.hero__bg'), 'hero');
  tryBg('img/o-nama.jpg', document.querySelector('.about__img'), 'about');

  /* ---- Filter galerije ---- */
  const filters = document.querySelectorAll('.filter');
  const items = document.querySelectorAll('.gallery__item');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    items.forEach(it => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
  }));

  /* ---- Lightbox ---- */
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('.lightbox__caption');
  items.forEach(it => it.addEventListener('click', () => {
    if (it.dataset.loaded !== 'true') return; // samo za prave fotografije
    lbImg.src = it.dataset.img;
    lbImg.alt = it.querySelector('figcaption').textContent.trim();
    lbCap.textContent = lbImg.alt;
    lb.hidden = false;
  }));
  const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---- Kontakt obrazac ---- */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.className = 'form__status';
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim();
      f.classList.toggle('is-invalid', bad);
      if (bad) valid = false;
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
        form.reset();
        status.textContent = 'Hvala! Vaš upit je poslan – javit ćemo vam se uskoro.';
        status.classList.add('ok');
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
    status.textContent = 'Otvaramo vaš e-mail program s pripremljenim upitom...';
    status.classList.add('ok');
  });
  form.querySelectorAll('input, select, textarea').forEach(f =>
    f.addEventListener('input', () => f.classList.remove('is-invalid')));
});
