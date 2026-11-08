# Dental Centar Kubica – web stranica

Prijedlog nove web stranice za **Dental Centar Kubica** (dr. Karlo Kubica i dr. Elena Deghenghi Kubica),
Marulićeva ulica 3, 52100 Pula – [dentalcentarkubica.hr](https://www.dentalcentarkubica.hr/).

Čisti HTML/CSS/JS, bez frameworka i bez vanjskih servisa. Fontovi su lokalni,
a Google karta se učitava tek na klik.

## Struktura

```
index.html        – sav sadržaj (hrvatski jezik), SEO meta i schema.org (Dentist)
css/style.css     – dizajn sustav (noćni Jadran, istarski kamen, lukovi Arene), sve sekcije, animacije
js/main.js        – interakcije; KONFIGURACIJA je na vrhu datoteke (CONFIG)
fonts/            – Bricolage Grotesque, Geist, Geist Mono (OFL licenca)
img/              – favicon.svg, og-image.jpg (slika za dijeljenje linka 1200×630)
```

## Sekcije

| Sekcija | Što radi |
|---|---|
| **Header** | Plutajuća staklena traka koja se skriva pri skrolanju prema dolje |
| **Hero** | Tamni hero s animiranim valovima mora, široki klizač *prije / poslije* (ilustracija ljuskica i krunica), status *Otvoreno / Zatvoreno* uživo, oznaka nastavne baze FDM Rijeka |
| **Kako radimo** | Rečenica *bezbolno · brzo · suvremeno* koja se riječ po riječ „pali“ dok skrolate |
| **Usluge** | Bento mreža: istaknuta kartica protetike + 5 usluga + poziv na vodič |
| **Protetika** | Interaktivni presjek zuba: *ljuskica / krunica / implantat* s animiranim slojevima i usporedbom |
| **Vodič kroz tegobe** | Pacijent klikne zub (FDI) i odabere tegobu → orijentacijska procjena, hitnost, preporučena usluga i automatski ispunjen upit |
| **Tim** | Kartice s portretima u obliku lukova pulske Arene (dr. Karlo Kubica i dr. Elena Deghenghi Kubica) |
| **Prvi posjet** | 4 koraka + poveznica na postojeću virtualnu šetnju 360° |
| **Pitanja** | 7 najčešćih pitanja |
| **Termin** | Forma za upit, telefon, radno vrijeme (današnji dan označen), karta |
| **Asistent** | Automatski odgovori na najčešća pitanja |
| **Mobilna traka** | Na mobitelu stalno dostupno *Nazovi* i *Naručite se* |

Sve animacije poštuju sistemsku postavku *smanji pokrete*. Klizač, presjek zuba i odontogram rade i tipkovnicom.

## Prije objave – što treba prilagoditi

1. **Slanje upita** – `CONFIG.formEndpoint` u `js/main.js` (Formspree, Web3Forms ili vlastiti poslužitelj
   koji poruku prosljeđuje na mobitel). Dok je prazno, forma pripremi poruku za e-mail ili WhatsApp.
2. **WhatsApp** – `CONFIG.whatsapp`: provjeriti koristi li ordinacija WhatsApp na 099 290 0381.
3. **E-mail** – stranica koristi `info@dentalcentarkubica.hr`; na nekim imenicima stoji i `dentalkubica@gmail.com`.
   Potvrditi koja adresa se aktivno čita.
4. **Fotografije doktora** – `img/karlo.jpg` i `img/elena.jpg` (portret 3:4, automatski se izrežu u oblik luka) pa upisati u `CONFIG.photos`.
5. **Usluge** – potvrditi s ordinacijom: izbjeljivanje, vađenje, liječenje kanala te tko izvodi kirurški dio
   implantacije (stranica opisuje *radove na implantatima*, kako stoji na postojećoj stranici).
6. **Tekstovi o načinu rada** („plan i cijena prije početka“, „stajemo čim podignete ruku“) – potvrditi.
7. **Cijene i recenzije** – namjerno nisu navedene (cijene s portala mogu biti zastarjele, a recenzije
   ne izmišljamo). Mogu se dodati kad ih ordinacija potvrdi.
8. **Virtualna šetnja** – poveznica `https://tourmkr.com/F1upMBrVET` preuzeta je iz javnih rezultata;
   provjeriti da je to aktualna šetnja ordinacije.

## Pokretanje lokalno

Otvorite `index.html` dvoklikom, ili:

```bash
cd kubica
python3 -m http.server 8000
```

## Objava

Bilo koji statični hosting (postojeći hosting za dentalcentarkubica.hr, Netlify, Cloudflare Pages,
GitHub Pages) – dovoljno je kopirati sadržaj mape `kubica/` u korijen domene.
