# PIF – App Store-uppgifter

**Källa för texterna:** de godkända texterna från 2026-11-26 (`store/app-store.md`, commit `343dda43` på `staging`-grenen, sista versionen). Orden är oförändrade; här är de bara omplacerade i samma upplägg som Morot. Ändra texter här, inte i den gamla filen.

Skärmdumpar: `appstore/skarmdumpar/<version>/` med en undermapp per enhet: `iphone-6.9` (1320×2868) och `ipad-13` (2064×2752). Kontaktark över alla bilder: `kontaktark.png` i versionsmappen. Bildkällor för demofotona: `appstore/foton/KALLOR.txt`.
Varje version har med **Promotional Text (Reklamtext, 170 tecken)** – den beskriver hela appen och kan ändras utan ny granskning.
Kontrollera texterna med `python3 scripts/kolla-appstore.py 2.0.0` (längder, emoji, rubriker).

Kopiera in i App Store Connect → PIF (Apple-ID 6444768934) → Distribution → iOS-app → **+** → version **2.0.0**. Versionen måste vara 2.0.0 eftersom bygget har `MARKETING_VERSION = 2.0.0`; annars går bygget inte att välja.

## App-information
- **Bundle-ID:** community.pif.pif (samma app-post som gamla 1.1.9 – den ersätts)
- **Namn (30):** PIF
- **Underrubrik (30):** Ge och ta emot i grannskapet
- **Primär kategori:** Shopping · **Sekundär kategori:** Sociala nätverk (som på den befintliga posten)
- **Innehållsrättigheter:** appen visar innehåll från användarna (bilder och texter i inlägg), inget licensierat tredjepartsinnehåll
- **Åldersklassning: 16+** (beslut 2026-11-26, stämmer med integritetspolicyn och villkoren). Svara sanningsenligt på enkäten (användargenererat innehåll, meddelanden mellan användare) och välj 16+ om Apple föreslår lägre. Välj **inte** "Made for Kids".
- **"Make this app available on Mac":** lämna av – på datorn är det PWA:n på pif.today som gäller.

## Pris och tillgänglighet
- **Pris:** Gratis
- **Tillgänglighet:** Sverige (lägg till fler länder först när det finns grannar där)

## Appintegritet

App Store Connect → appen → **App Privacy**. Baserat på vad appen och databasen faktiskt lagrar (2026-11-26) och på integritetspolicyn (`src/pages/Privacy.tsx`).

- **Samlar ni in data från appen?** Ja.
- **Spårning ("Data Used to Track You"):** ingen. PIF har ingen reklam, inga annons-SDK:er, inga datamäklare och kopplar inte ihop sin data med andra företags för reklam.
- **Integritetspolicy-URL:** https://pif.today/privacy · **Användarvillkor:** https://pif.today/villkor

Alla typer nedan är *kopplade till användaren*, ingen används för spårning:

| Apples kategori → typ | Vad det är i PIF | Syften att kryssa |
|---|---|---|
| Contact Info → **Name** | Profilnamn (även från Apple/Google-inloggning) | App Functionality; Developer's Advertising or Marketing (nyhetsbrevets hälsning) |
| Contact Info → **Email Address** | Kontots e-post; nyhetsbrevet | App Functionality; Developer's Advertising or Marketing (nyhetsbrevet) |
| Contact Info → **Phone Number** | Valfritt, i profil/upphämtningsuppgifter | App Functionality |
| Contact Info → **Physical Address** | Profil- och upphämtningsadress (visas bara för vald mottagare) | App Functionality |
| Location → **Precise Location** | Koordinater för adressen och inlägg (andra ser bara en förskjuten punkt 150–500 m bort) | App Functionality |
| Location → **Coarse Location** | Område/stad på profil och inlägg | App Functionality |
| User Content → **Photos or Videos** | Inläggsbilder, profilbild | App Functionality; Developer's Advertising or Marketing (bilder från offentliga inlägg kan visas i nyhetsbrevet och sociala medier, policyn avsnitt 2) |
| User Content → **Emails or Text Messages** | Chattmeddelanden i appen | App Functionality |
| User Content → **Other User Content** | Inläggstitlar och texter, kommentarer, betyg | App Functionality; Developer's Advertising or Marketing (titlar på offentliga inlägg, som ovan) |
| User Content → **Customer Support** | Feedbackformulär (text, valfri skärmdump), rapporter | App Functionality |
| Identifiers → **User ID** | Konto-ID (även Apple/Google-identifierare) | App Functionality; Analytics |
| Usage Data → **Product Interaction** | Kampanjattribution: efter en nyhetsbrevslänk, om kontot skapades och första inlägg/intresse/sparning (siffror per utskick, policyn avsnitt 6) | Analytics |

**Inte insamlat** (svara nej / lämna okryssat): Health & Fitness, Financial Info, Sensitive Info, Contacts, Browsing History, Search History, Purchases, Diagnostics (ingen krasch- eller prestandarapportering i appen), Advertising Data, Other Usage Data, Device ID (inget reklam-ID; push-token används bara för att leverera notiser), Audio, Gameplay, Other Data.

Noteringar:
- Cloudflare Web Analytics körs bara på webbplatsen; appen innehåller den inte, så den deklareras inte här.
- Nyhetsbrevets öppnings- och klickmätning sker i e-posten, inte i appen.
- Läggs krasch-rapportering, analys-SDK:er eller reklam till senare måste svaren ändras.

## Version 2.0.0

- **Skärmdumpar iPhone 6,9 tum (1320×2868):** mappen `appstore/skarmdumpar/2.0.0/iphone-6.9`. Dra in i ordning 1–7. Ber Connect även om 6,5 tum (1284×2778) tar vi nya bilder i en 6,5-tumssimulator – de går inte att skala fram utan att förvränga.
- **Skärmdumpar iPad 13 tum (2064×2752):** mappen `appstore/skarmdumpar/2.0.0/ipad-13`. Dra in i ordning 1–7.
- **Promotional Text / Reklamtext (170):** se rubriken nedan
- **Nyckelord (100):** se rubriken nedan
- **Support-URL:** https://pif.today (kontakt hej@pif.community finns i appen och i policyn)
- **Marknadsförings-URL:** (tom)
- **Copyright:** © 2026 PIF App AB
- **Build:** 2.0.0 (4) – det senaste TestFlight-bygget
- **Inloggning för granskningen:** demokontot (profilnamn Anna Karlsson, område Stockholm). Fyll i e-post och lösenord själv i Connect – de står inte här.

### Promotional Text (Reklamtext, 170 tecken)

Visas överst på App Store-sidan, så den beskriver hela appen – inte bara nyheterna. Kan ändras när som helst utan granskning.

Ge bort det du inte behöver och önska det du saknar – gratis och enkelt i ditt närområde.

### Nyckelord (100 tecken)

Kommaseparerade, utan mellanslag efter komma. Appens namn och underrubrikens ord indexeras redan, så "pif" behövs inte (men "piff" är med).

piff,pay it forward,ge bort,skänka,gratis,grannar,återbruk,begagnat,hållbart,cirkulärt,byta,loppis

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

PIF står för Pay It Forward – att ge vidare utan att be om något tillbaka. Med PIF ger du bort saker du inte längre behöver till någon i närheten som har nytta av dem, och önskar dig det du själv saknar.

Att piffa gör din granne, din plånbok och planeten glad! Sakerna får ett nytt liv i stället för att samla damm eller hamna på tippen, och du hittar det du behöver utan att köpa nytt.

GE BORT EN PIFF
Fotografera saken, skriv några rader och publicera. Grannar som vill ha den visar intresse, och du väljer själv vem som får den. Ni bestämmer upphämtning i chatten.

ÖNSKA DIG NÅGOT
Letar du efter en barnvagn, en borrmaskin eller en kruka? Lägg upp en önskan, så kan någon i närheten hjälpa dig.

HITTA NÄRA DIG
Se piffar och önskningar i flödet eller på kartan, sorterade efter avstånd eller efter när de publicerades.

TRYGGT OCH ENKELT
• Din exakta adress visas aldrig för andra – bara området och en ungefärlig plats.
• Upphämtningsadressen delas bara med den du valt att ge till.
• Chatta direkt i appen och få notiser när någon visar intresse, kommenterar eller skriver till dig.
• Lämna omdömen efter genomförda utbyten.
• Blockera och rapportera användare som inte sköter sig.

GRATIS
PIF är gratis att använda och fritt från reklam.

Ge vidare – det som blir över hos dig kan vara precis det någon annan behöver.

### Anteckning till granskningen (lägg till sist i Notes)

PIF is a free app for giving away and wishing for things among neighbours (Swedish UI; an English translation is also included). Sign-in is required: use the demo account in Sign-In Information (profile name "Anna Karlsson", area Stockholm).

To test:
1. "Flöde" (Feed) lists posts from neighbours. "Filtrera" -> "Mina inlägg" shows only the demo account's posts.
2. "Karta" (Map) shows posts as pins at an approximate location. Exact addresses are never shown to other users.
3. Tap a post, then "Visa intresse" (show interest). The owner of a post chooses a receiver with "Välj mottagare"; a chat between the two then opens under "Meddelanden".
4. "Posta" creates a pif or a wish in four steps (photo, details, location). Creating a post does not notify other users.
5. User safety (Guideline 1.2): the "..." menu on a post, comment, chat message or profile has "Rapportera" (report) and "Blockera" (block). Blocking works both ways and hides the other user's posts and comments. Blocked users are listed under Profil -> "Kontoinställningar" -> "Konto" -> "Blockerade användare". Reports are emailed to hej@pif.community and handled within 24 hours.
6. Terms of use (pif.today/villkor) must be accepted ("Jag godkänner") before posting, commenting or messaging.
7. Account deletion: Profil -> "Kontoinställningar" -> "Konto" -> "Radera konto".

Location is only used to show distance to posts and to set the pickup location of the user's own posts. Push notifications are optional and only sent for activity on the user's own posts and chats. There are no in-app purchases, payments or ads.

## English (engelska lokalisering)

Samma godkända källa. Lägg till som språk **English (U.K.)** eller **English (U.S.)** i App Store Connect.

- **Name:** PIF
- **Subtitle** (23/30): Give and receive nearby
- **Promotional text** (101/170): Give away what you don't need and wish for what you're missing – free and easy in your neighbourhood.
- **Keywords** (97/100): `pif,pay it forward,give away,free stuff,neighbours,reuse,second hand,sustainable,swap,flea market`

### English description

PIF stands for Pay It Forward – passing it on without asking for anything in return. With PIF you give things you no longer need to someone nearby who can use them, and wish for the things you're missing.

Piffing makes your neighbour, your wallet and the planet happy! Things get a new life instead of gathering dust or ending up at the dump, and you find what you need without buying new.

GIVE AWAY A PIF
Take a photo, write a few lines and post it. Neighbours who want it show interest, and you choose who gets it. You arrange the pickup in the chat.

MAKE A WISH
Looking for a pram, a drill or a flowerpot? Post a wish and someone nearby can help you out.

FIND THINGS NEAR YOU
See pifs and wishes in the feed or on the map, sorted by distance or by when they were posted.

SAFE AND SIMPLE
• Your exact address is never shown to others – only your area and an approximate location.
• The pickup address is shared only with the person you chose to give to.
• Chat in the app and get notified when someone shows interest, comments or messages you.
• Leave ratings after completed exchanges.
• Block and report users who misbehave.

FREE
PIF is free to use and free of ads.

Pay it forward – what's left over at your place may be exactly what someone else needs.

## Granskningsinformation (App Review)
- **Inloggning krävs:** Ja – demokontot (App Review-kontot, profil e6d9a3f5-…). E-post och lösenord fylls i direkt i Connect, aldrig i repot. Aliaset appreview@pif.community i Google Workspace tar emot bekräftelse- och återställningsmejl (använd aldrig @pif.today, den kan inte ta emot).
- **Kontakt:** Fredrik Lichtenstein, hej@pif.community, telefon enligt kontot
- **Behåll kontot efter godkännande:** Apple använder det vid varje uppdatering.
- **Innan inskick:** demokontot har inga egna inlägg (demoinläggen från skärmdumparna raderades 2026-11-27), så steg 1 i Notes visar en tom lista under "Mina inlägg". Ta bort den meningen, eller lägg upp ett inlägg från kontot strax före inskick och radera det efter godkännandet – det syns för riktiga användare under tiden. Det ursprungliga beslutet var inga låtsasinlägg i produktion.
- **"Fritt från reklam"** står i beskrivningen (Fredrik 2026-11-26). "Vi säljer aldrig din data" lovas inte i butikstexterna.
- **Svar på frågor från Apple:** hej@pif.community kollas dagligen (se Moderation routine i CLAUDE.md).
