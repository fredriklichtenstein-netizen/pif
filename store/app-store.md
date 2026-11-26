# App Store: privacy labels and listing (draft, updated 2026-11-26)

Drafts for App Store Connect, app "PIF" (`community.pif.pif`). Nothing here is submitted
automatically. Character counts are checked against Apple's limits.

## 1. App Privacy ("Appens integritet")

Answers for App Store Connect → the app → **App Privacy** → Get Started / Edit. Based on what
the app and database actually store (2026-11-26) and on the privacy policy (`src/pages/Privacy.tsx`).

**Do you or your third-party partners collect data from this app?** Yes.

**Tracking** ("Data Used to Track You"): **none**. PIF has no ads, no ad SDKs, no data brokers
and doesn't link its data with other companies' data for advertising.

### Data types — all "Linked to the user", none used for tracking

| Apple category → type | What it is in PIF | Purposes to tick |
|---|---|---|
| Contact Info → **Name** | Profile name (also from Apple/Google sign-in) | App Functionality; Developer's Advertising or Marketing (newsletter greeting) |
| Contact Info → **Email Address** | Account email; newsletter | App Functionality; Developer's Advertising or Marketing (newsletter) |
| Contact Info → **Phone Number** | Optional, in profile/pickup details | App Functionality |
| Contact Info → **Physical Address** | Profile and pickup address (only shown to the chosen receiver) | App Functionality |
| Location → **Precise Location** | Coordinates of the address and of posts (others only see an offset point 150–500 m away) | App Functionality |
| Location → **Coarse Location** | Area/city shown on profile and posts | App Functionality |
| User Content → **Photos or Videos** | Post photos, profile photo | App Functionality; Developer's Advertising or Marketing (photos of public posts may appear in the newsletter and on social media, policy section 2) |
| User Content → **Emails or Text Messages** | In-app chat messages | App Functionality |
| User Content → **Other User Content** | Post titles and texts, comments, ratings | App Functionality; Developer's Advertising or Marketing (titles of public posts, as above) |
| User Content → **Customer Support** | Feedback form (text, optional screenshot), reports | App Functionality |
| Identifiers → **User ID** | Account ID (also Apple/Google sign-in identifier) | App Functionality; Analytics |
| Usage Data → **Product Interaction** | Campaign attribution: after a newsletter link, whether the account was created and the first post / interest / save (counts per newsletter, policy section 6) | Analytics |

### Not collected (answer "no" / leave unticked)
Health & Fitness, Financial Info, Sensitive Info, Contacts, Browsing History, Search History,
Purchases, Diagnostics (no crash or performance reporting in the app), Advertising Data, Other
Usage Data, Device ID (no advertising identifier; the push token only delivers notifications),
Audio, Gameplay, Other Data.

### Notes
- Cloudflare Web Analytics runs on the website only (Pages injects it into the web page); the app
  bundle doesn't contain it, so it isn't declared here.
- Newsletter open/click measurement happens in email, not in the app.
- If the app later adds crash reporting, analytics SDKs or ads, these answers must change.
- Privacy Policy URL: `https://pif.today/privacy`. Terms of use: `https://pif.today/villkor`.

## 2. Listing texts

### Swedish (primary language)
- **Name:** PIF
- **Subtitle** (28/30): Ge och ta emot i grannskapet
- **Promotional text** (89/170): Ge bort det du inte behöver och önska det du saknar – gratis och enkelt i ditt närområde.
- **Keywords** (98/100): `piff,pay it forward,ge bort,skänka,gratis,grannar,återbruk,begagnat,hållbart,cirkulärt,byta,loppis` — "pif" isn't needed: Apple already indexes the
  app name, and words from the subtitle count too.
- **Description** (1326/4000):

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

### English
- **Name:** PIF
- **Subtitle** (23/30): Give and receive nearby
- **Promotional text** (101/170): Give away what you don't need and wish for what you're missing – free and easy in your neighbourhood.
- **Keywords** (97/100): `pif,pay it forward,give away,free stuff,neighbours,reuse,second hand,sustainable,swap,flea market`
- **Description** (1264/4000):

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

### Other fields
- **Category:** Shopping (primary), Social Networking (secondary) — as on the existing record.
- **Support URL:** `https://pif.today` (contact hej@pif.community is in the app and the policy).
- **Copyright:** © 2026 PIF App AB
- **Age rating:** 16+ (decided 2026-11-26; matches the privacy policy and terms). Answer the
  questionnaire honestly (user-generated content, messaging between users) and pick 16+ if Apple
  suggests lower.
- **"Fritt från reklam" / "free of ads"** is in the description (Fredrik 2026-11-26); "we never
  sell your data" is not promised in the store texts (the privacy policy still says so).
- **App Review demo account** (production; Apple signs in with it during review and for later
  updates):
  1. In Google Workspace, add an alias such as `appreview@pif.community` to the hej@ mailbox, so
     confirmation and reset mail arrives (never use `@pif.today`, it can't receive).
  2. Sign up in the app with that address and a strong password kept in the password manager.
     Complete the profile: name "App Review", a public area in Stockholm, no real address or phone.
  3. No fake posts: the real feed is enough to review, and test data stays out of production.
  4. Put the email and password only in App Store Connect → App Review Information (never in this
     repo), plus these notes: "PIF is a free app for giving away and wishing for things among
     neighbours. Blocking: ⋯ menu on any post, comment or chat message, or on a person's profile;
     blocked users are listed under Inställningar → Konto → Blockerade användare. Reporting: same
     menus and the profile. Reports go to hej@pif.community and are handled within 24 hours.
     Terms of use: pif.today/villkor."
  5. Keep the account after approval; Apple uses it again for every update.
