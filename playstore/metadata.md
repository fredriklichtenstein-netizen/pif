# PIF – Google Play-uppgifter

Samma upplägg som `appstore/metadata.md`. Grafik: `playstore/grafik/` och skärmdumpar i `playstore/skarmdumpar/<version>/<enhet>/`.
Kontrollera texterna med `python3 scripts/kolla-appstore.py 2.0.0 --play`.

## Det här stoppar en release just nu
- **Kontot är begränsat:** Google tog bort profilen och apparna efter misslyckad identitetskontroll (2024-10-16, och igen 2026-11-15). Inget kan publiceras förrän det är löst i Play Console.
- **Uppladdningsnyckeln är förlorad:** skapa en ny upload-keystore på Macen och registrera den via "Request reset" (Play App Signing är på, så det går). Håll keystore och lösenord utanför repot och säkerhetskopiera dem.
- **Push på Android** kräver Firebase (`google-services.json`) – annars inga notiser. Inte ett krav för första interna testet.

## App-information
- **Paketnamn:** community.pif.pif (samma som gamla "PIF Pay it Forward", v1.2.1, versionCode 37)
- **Version:** versionName **2.0.0**, versionCode **38** (`android/app/build.gradle`). versionCode får bara gå uppåt.
- **App-namn (30):** PIF – Pay it Forward
- **Kategori:** Shopping
- **Taggar:** Shopping, Socialt, Livsstil
- **Kontakt:** hej@pif.community · webbplats https://pif.today
- **Integritetspolicy:** https://pif.today/privacy
- **App Links:** `public/.well-known/assetlinks.json` har Play-signeringsnyckelns SHA-256 – ändras signeringen måste filen ändras.

## Pris och tillgänglighet
- **Pris:** Gratis · **Länder:** Sverige · **Annonser:** Nej, appen innehåller inga annonser

## Innehållsklassning (IARC-enkäten)
- Kategori: "Sociala nätverk / kommunikation" eller "Alla andra apptyper" – välj den som frågar om användarinteraktion
- Användare kan kommunicera med varandra: **Ja** · Delar plats med andra användare: **Ja, ungefärlig** · Användargenererat innehåll: **Ja**, med rapportering och blockering
- **Målgrupp:** 18+ (Play har inget 16+; 16–17 drar in familjeregler). Villkoren säger 16 år – välj 18+ i Play för att slippa Families-kraven.

## Datasäkerhet (Data safety)
Samma data som App Store-integriteten:
- **Personlig info:** namn, e-postadress – samlas in, delas inte, krävs, appfunktionalitet / konto, e-post även marknadsföring (nyhetsbrev, går att avsluta)
- **Plats:** exakt plats – samlas in, delas inte, valfri, appfunktionalitet
- **Foton:** samlas in, delas inte, valfri, appfunktionalitet
- **Meddelanden:** andra meddelanden i appen – samlas in, delas inte, appfunktionalitet
- **App-aktivitet:** annat användargenererat innehåll (inlägg, kommentarer) – appfunktionalitet; appinteraktioner – analys (nyhetsbrevskampanjer, sammanlagt)
- **Enhets- eller andra ID:n:** push-token – appfunktionalitet
- Data krypteras under överföring: **Ja** · Användaren kan begära radering: **Ja** (Profil -> Kontoinställningar -> Konto -> Radera konto, eller hej@pif.community)
- **Webbadress för kontoradering:** https://pif.today/privacy (avsnittet om radering) – Play kräver en länk utanför appen.

## Grafik som behövs
- **Ikon:** 512×512 PNG (32-bitars). Gör den från riktig 1024-pixlarsikon – `assets/icon-only.png` är bara den uppskalade webbikonen.
- **Funktionsgrafik:** 1024×500 PNG/JPG – krävs. Saknas än.
- **Skärmdumpar telefon:** 2–8 st, kortsida minst 320 px, och långsidan högst **dubbla** kortsidan. iPhone-bilderna (1320×2868, 2,17:1) är för långsmala, och det är de flesta moderna Android-skärmar också (Pixel 8: 1080×2400). Ta dem i en emulator med 1080×1920 (16:9), eller lägg bilderna på en bakgrund i 9:16.
- **Skärmdumpar 7"/10"-surfplatta:** valfria, men krävs för att synas som surfplatte-app.

## Version 2.0.0

### Kort beskrivning (80 tecken)

Ge bort det du inte behöver och önska det du saknar – hos grannarna.

### Fullständig beskrivning (4000 tecken)

PIF gör det enkelt att ge bort det du inte behöver och hitta det du saknar – hos grannarna.

Fotografera en sak du inte använder längre, skriv några rader och piffa den. Grannar som vill ha den visar intresse, och du väljer vem som får den. Saknar du något? Lägg upp en önskan, så kan grannar som har det över höra av sig.

• Flöde med piffar och önskningar från ditt närområde
• Karta som visar vad som finns nära dig
• Visa intresse med ett tryck – den som piffar väljer mottagare
• Önskningar där flera grannar kan hjälpa till
• Chatt med den du ska lämna till eller hämta från
• Kommentera, spara och dela inlägg
• Filtrera på typ, kategori och plats
• Utkast och schemalagda inlägg
• Notiser när någon visar intresse, skriver eller kommenterar
• Betyg efter genomförda överlämningar
• Logga in med Google eller e-post
• Svenska och engelska

Din adress är din. Andra ser bara området och en ungefärlig punkt på kartan, aldrig din exakta adress – den får bara den du har valt som mottagare.

Du kan blockera och rapportera användare och inlägg, och vi går igenom rapporter varje dag.

PIF är gratis och utan reklam. Ju fler som piffar, desto mindre slängs.

### Nyheter i den här versionen (500 tecken)

En helt ny PIF, byggd från grunden – samma app som på pif.today. Flöde och karta över vad grannarna piffar och önskar, önskningar där flera kan hjälpa till, chatt, utkast och schemalagda inlägg, och blockering och rapportering.
