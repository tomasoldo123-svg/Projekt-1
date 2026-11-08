# Stomatološka ordinacija Ademović – web stranica

Prijedlog nove web stranice za **Stomatološku ordinaciju Ademović** (dr. Adnan Ademović),
Nedima Filipovića 4a, Čengić Vila, Sarajevo – [drademovic.ba](https://drademovic.ba).

Čisti HTML/CSS/JS, bez frameworka i bez vanjskih servisa. Fontovi su lokalni,
a Google mapa se učitava tek na klik.

## Struktura

```
index.html        – sav sadržaj (bosanski jezik), SEO meta i schema.org (Dentist)
css/style.css     – dizajn sistem, sve sekcije, animacije, responzivnost
js/main.js        – interakcije; KONFIGURACIJA je na vrhu fajla (CONFIG)
fonts/            – Newsreader, Geist, Geist Mono (OFL licenca)
img/              – favicon.svg, og-image.jpg (slika za dijeljenje linka 1200×630)
```

## Sekcije

| Sekcija | Šta radi |
|---|---|
| **Hero** | Odontogram gornje vilice koji se sam iscrta (FDI oznake), primjer plana terapije, status *Otvoreno / Zatvoreno* uživo po sarajevskom vremenu |
| **Bez boli · Bez iznenađenja · Bez žurbe** | Tri obećanja ordinacije |
| **Usluge** | 11 usluga u harmonici – opis + tok tretmana u 3 koraka |
| **Vodič kroz tegobe** | Pacijent klikne zub (32 zuba, FDI) i odabere tegobu → dobije orijentacijsku procjenu, hitnost i preporučenu uslugu, a upit za termin se sam popuni |
| **Aligneri** | Scroll animacija: krivi zubi se ravnaju set po set (01 → 20), pojavljuje se folija |
| **Izbjeljivanje** | Interaktivna skala nijansi (16 nijansi) – prikaz *Sada / Nakon izbjeljivanja* |
| **Prvi posjet** | 4 koraka za pacijente koji se boje stomatologa |
| **O doktoru** | Obrazovanje i put dr. Ademovića (podaci s postojeće stranice) |
| **Pitanja** | 8 najčešćih pitanja |
| **Termin** | Forma za upit, telefon, radno vrijeme (današnji dan označen), mapa |
| **Asistent** | Automatski odgovori na najčešća pitanja (radno vrijeme, adresa, cijene, hitni slučajevi, usluge…) |
| **Mobilna traka** | Na mobitelu stalno dostupno *Pozovi* i *Zakaži termin* |

Sve animacije poštuju sistemsku postavku *smanji pokrete* (`prefers-reduced-motion`).
Odontogram i skala nijansi rade i tipkovnicom (strelice, Enter).

## Prije objave – šta treba prilagoditi

1. **Slanje upita** – u `js/main.js` → `CONFIG.formEndpoint` upišite endpoint (npr. Formspree,
   Web3Forms ili vlastiti server koji prosljeđuje poruku na mobitel / Viber / Telegram).
   Dok je prazno, forma pripremi poruku i ponudi slanje e-mailom ili WhatsAppom.
2. **WhatsApp** – `CONFIG.whatsapp`: provjeriti koristi li ordinacija WhatsApp na 061 511 493
   (ako ne, ostaviti prazno i dugme se neće prikazati).
3. **Fotografije** – fotografiju doktora (portret 4:5) spremite kao `img/doktor.jpg` i upišite
   `CONFIG.doctorPhoto = 'img/doktor.jpg'`. Bez nje se prikazuje dizajnirana kartica.
4. **Tekstovi** – potvrditi s ordinacijom formulacije koje opisuju način rada
   (npr. „plan i cijena prije početka“, „stajemo čim podignete ruku“), te listu usluga.
5. **Recenzije** – stranica namjerno nema izmišljenih recenzija ni brojki. Prave Google
   recenzije mogu se dodati kao posebna sekcija.
6. **Praznici** – status *Otvoreno/Zatvoreno* računa se iz `CONFIG.hours`; za praznike
   po potrebi dodati izuzetke.
7. **SEO** – postojeće podstranice (`/estetska-stomatologija-sarajevo/`, `/zubni-implantati-sarajevo/` …)
   preporuka je zadržati ili preusmjeriti (301) na nove sekcije kako bi se sačuvale pozicije na Googleu.

## Pokretanje lokalno

```bash
cd ademovic
python3 -m http.server 8000
# otvorite http://localhost:8000
```

## Objava

Bilo koji statični hosting (postojeći hosting za drademovic.ba, Netlify, Cloudflare Pages,
GitHub Pages). Dovoljno je kopirati sadržaj mape `ademovic/` u korijen domene.
