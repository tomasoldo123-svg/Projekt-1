# Parket Art – web stranica

Statična, responzivna web stranica za **PARKET ART, vl. Marko Bićanić** (Sesvete, Zagreb):
parket, brušenje i lakiranje, mikrocement, epoksidni/poliuretanski podovi i LVT vinil.

## Struktura

```
index.html      – sav sadržaj stranice (HR)
css/style.css   – dizajn
js/main.js      – interakcije + KONTAKT PODACI (CONFIG na vrhu)
img/            – ovdje idu fotografije
```

## Što treba prilagoditi

1. **Kontakt** – u `js/main.js` (objekt `CONFIG`) upišite pravi broj telefona i e-mail.
   Isto ažurirajte i u `index.html` u bloku `application/ld+json` (za Google).
2. **Fotografije** – dodajte u mapu `img/` (preporuka: JPG, širina ~1600 px, < 400 KB):
   - `hero.jpg` – velika pozadinska slika na vrhu
   - `o-nama.jpg` – slika u sekciji "O nama" (portret format)
   - `parket-1.jpg`, `parket-2.jpg`, `obnova-1.jpg`, `mikrocement-1.jpg`,
     `mikrocement-2.jpg`, `epoksid-1.jpg`, `vinil-1.jpg` – galerija
   - `og-image.jpg` (1200×630) – slika koja se prikazuje kad se link dijeli na društvenim mrežama

   Dok slika nema, prikazuju se dekorativni uzorci drva/mikrocementa.
3. **Obrazac** – po defaultu otvara e-mail klijent s ispunjenim upitom. Za slanje izravno
   s web stranice upišite Formspree (ili sličan) endpoint u `CONFIG.formEndpoint`.
4. **Radno vrijeme i područje rada** – provjerite u sekciji Kontakt.

## Pokretanje lokalno

Otvorite `index.html` u pregledniku, ili:

```bash
python3 -m http.server 8000
```

## Objava

Stranica je čisti HTML/CSS/JS – može se postaviti na bilo koji hosting
(npr. postojeći hosting za parket-art.hr, Netlify, GitHub Pages).
