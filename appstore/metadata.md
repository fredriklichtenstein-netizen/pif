# PIF – App Store-uppgifter

Skärmdumpar: `appstore/skarmdumpar/<version>/` med en undermapp per enhet: `iphone-6.9` (1320×2868) och `ipad-13` (2064×2752). Kontaktark över alla bilder: `kontaktark.png` i versionsmappen. Bildkällor för demofotona: `appstore/foton/KALLOR.txt`.
Varje version har med **Promotional Text (Reklamtext, 170 tecken)** – den beskriver hela appen och kan ändras utan ny granskning.
Kontrollera texterna med `python3 scripts/kolla-appstore.py 2.0.0` (längder, emoji, rubriker).

Kopiera in i App Store Connect → PIF (Apple-ID 6444768934) → Distribution → iOS-app → **+** → version **2.0.0**. Versionen måste vara 2.0.0 eftersom bygget har `MARKETING_VERSION = 2.0.0`; annars går bygget inte att välja.

## App-information
- **Bundle-ID:** community.pif.pif (samma app-post som gamla 1.1.9 – den ersätts)
- **Namn (30):** PIF – Pay it Forward
- **Underrubrik (30):** Ge bort och önska nära dig
- **Primär kategori:** Shopping
- **Sekundär kategori:** Sociala nätverk
- **Innehållsrättigheter:** appen visar innehåll från användarna (bilder och texter i inlägg), inget licensierat tredjepartsinnehåll
- **Åldersklassning:** svara sanningsenligt: användargenererat innehåll **Ja**, meddelanden/chatt mellan användare **Ja**, i övrigt "Nej/Ingen". Våra villkor och integritetspolicyn säger **16 år**, så välj 16+ om Connect låter er höja åldern. Välj **inte** "Made for Kids".
- **Ändra inte** "Make this app available on Mac" till på – på datorn är det PWA:n på pif.today som gäller.

## Pris och tillgänglighet
- **Pris:** Gratis
- **Tillgänglighet:** Sverige (lägg till fler länder först när det finns grannar där)

## Appintegritet
- **Integritetspolicy-URL:** https://pif.today/privacy
- **Spårning (Tracking):** Nej – ingen data används för att spåra användare mellan appar eller webbplatser, och vi har ingen reklam.
- **Data som samlas in** (alla: *kopplad till användaren*, *ingen spårning*):
  - **Kontaktuppgifter – Namn:** Appfunktionalitet (visas på profil och inlägg)
  - **Kontaktuppgifter – E-postadress:** Appfunktionalitet (inloggning, aviseringar), Utvecklarens marknadsföring (nyhetsbrevet, går att avsluta)
  - **Plats – Exakt plats:** Appfunktionalitet (adress för upphämtning och avstånd; andra ser bara området och en förskjuten punkt)
  - **Användarinnehåll – Foton:** Appfunktionalitet (bilder i inlägg och profilbild)
  - **Användarinnehåll – E-post eller textmeddelanden:** Appfunktionalitet (chatten mellan användare)
  - **Användarinnehåll – Annat användarinnehåll:** Appfunktionalitet (inlägg, kommentarer, betyg, rapporter)
  - **Identifierare – Användar-ID:** Appfunktionalitet
  - **Identifierare – Enhets-ID:** Appfunktionalitet (push-token för notiser)
  - **Användningsdata – Produktinteraktion:** Analys (vilket nyhetsbrev som ledde till konto eller första inlägg, bara sammanlagda siffror)
- Kontrollera mot integritetspolicyn (`src/pages/Privacy.tsx`) innan inskick. Ändras vad appen samlar in, ändra båda.

## Version 2.0.0

- **Skärmdumpar iPhone 6,9 tum (1320×2868):** mappen `appstore/skarmdumpar/2.0.0/iphone-6.9`. Dra in i ordning 1–7. Ber Connect även om 6,5 tum (1284×2778) tar vi nya bilder i en 6,5-tumssimulator – de går inte att skala fram utan att förvränga.
- **Skärmdumpar iPad 13 tum (2064×2752):** mappen `appstore/skarmdumpar/2.0.0/ipad-13`. Dra in i ordning 1–7.
- **Promotional Text / Reklamtext (170):** Ge bort det du inte behöver och önska det du saknar. PIF visar vad grannarna piffar och önskar – i ett flöde och på kartan. Gratis, utan reklam.
- **Nyckelord (100):** se nedan
- **Support-URL:** https://pif.today
- **Marknadsförings-URL:** https://pif.today
- **Copyright:** 2026 PIF App AB
- **Build:** 2.0.0 (4) – det senaste TestFlight-bygget
- **Inloggning för granskningen:** demokontot (Anna Karlsson). Fyll i e-post och lösenord själv i Connect – de står inte här.

### Promotional Text (Reklamtext, 170 tecken)

Visas överst på App Store-sidan, så den beskriver hela appen – inte bara nyheterna. Kan ändras när som helst utan granskning.

Ge bort det du inte behöver och önska det du saknar. PIF visar vad grannarna piffar och önskar – i ett flöde och på kartan. Gratis, utan reklam.

### Nyckelord (100 tecken)

Kommaseparerade, utan mellanslag efter komma. Ord som redan finns i namnet och underrubriken behövs inte.

skänka,gratis,återbruk,begagnat,secondhand,låna,dela,byta,hållbart,loppis,granne,närområde,klädbyte

### Skärmdumpar (tagna i iPhone 17 Pro Max- och iPad Pro 13-simulatorn)

1. Flöde (Mina inlägg), 2. Karta, 3. Inlägg, 4. Chatt, 5. Skapa en önskan, 6. Profil, 7. Startsida.
Profil och Startsida är minst säljande – hoppa över dem om ni vill ha färre bilder.

### Nyheter i den här versionen (What's New)

• En helt ny PIF – byggd från grunden, samma app som på pif.today
• Flöde och karta över vad grannarna piffar och önskar
• Önskningar: berätta vad du behöver, och flera grannar kan hjälpa till
• Chatt med den du valt, och notiser när något händer
• Logga in med Apple, Google eller e-post
• Spara utkast och schemalägg inlägg
• Blockera och rapportera användare och inlägg

### Beskrivning

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
• Logga in med Apple, Google eller e-post
• Svenska och engelska

Din adress är din. Andra ser bara området och en ungefärlig punkt på kartan, aldrig din exakta adress – den får bara den du har valt som mottagare.

Du kan blockera och rapportera användare och inlägg, och vi går igenom rapporter varje dag.

PIF är gratis och utan reklam. Ju fler som piffar, desto mindre slängs.

### Anteckning till granskningen (lägg till sist i Notes)

PIF is a neighbourhood sharing app for Sweden (Swedish UI; an English translation is also included). Users give away items ("pifs") or post wishes for things they need. Sign-in is required: use the demo account in Sign-In Information (profile name "Anna Karlsson", area Stockholm).

To test:
1. "Flöde" (Feed) lists posts from neighbours. "Filtrera" -> "Mina inlägg" shows only the demo account's posts.
2. "Karta" (Map) shows posts as pins at an approximate location. Exact addresses are never shown to other users.
3. Tap a post, then "Visa intresse" (show interest). The owner of a post chooses a receiver with "Välj mottagare"; a chat between the two then opens under "Meddelanden".
4. "Posta" creates a pif or a wish in four steps (photo, details, location). Creating a post does not notify other users.
5. User safety (Guideline 1.2): the "..." menu on a post, comment, chat message or profile has "Rapportera" (report) and "Blockera" (block). Blocking works both ways and hides the other user's posts and comments. Blocked users are listed under Profil -> "Kontoinställningar" -> "Konto" -> "Blockerade användare". Reports are emailed to hej@pif.community and handled within 24 hours.
6. Terms of use (/villkor) must be accepted ("Jag godkänner") before posting, commenting or messaging.
7. Account deletion: Profil -> "Kontoinställningar" -> "Konto" -> "Radera konto".

Location is only used to show distance to posts and to set the pickup location of the user's own posts. Push notifications are optional and only sent for activity on the user's own posts and chats. There are no in-app purchases, payments or ads.

## Granskningsinformation (App Review)
- **Inloggning krävs:** Ja – demokontot (App Review-kontot, profil e6d9a3f5-…). E-post och lösenord fylls i direkt i Connect.
- **Kontakt:** Fredrik Lichtenstein, hej@pif.community, telefon enligt kontot
- **Innan inskick:** demokontot har inga egna inlägg (demoinläggen från skärmdumparna raderades 2026-11-27), så steg 1 i Notes visar en tom lista under "Mina inlägg". Antingen tar ni bort den meningen, eller så lägger ni upp ett inlägg från kontot strax före inskick och raderar det efter godkännandet – det syns för riktiga användare under tiden.
- **Svar på frågor från Apple:** hej@pif.community kollas dagligen (se Moderation routine i CLAUDE.md).
