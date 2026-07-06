## Lovable implementation plan for approval

Three targeted copy/section changes on the Home page (`/`). No layout system changes, no new components. All strings via i18n.

---

### 1. `src/locales/sv/home.json` — diff

```diff
   "pay_it_forward": "Pay It Forward",
-  "hero_description": "En plats där grannar hjälper grannar. Piffa, ge och ta emot med hjärtat i centrum.",
+  "hero_description": "Piffa det du inte längre behöver. Hjälp en granne och gör plats för något nytt!",
   "community_sharing_alt": "Gemenskapsdelning",
-  "community_growing": "Vår gemenskap växer",
-  "shared_pifs": "Delade piffar",
-  "sustainable_choices": "Hållbara val",
-  "circular_economy": "Cirkulär ekonomi",
+  "concepts_intro": "En piff är något du ger bort till en granne. En önskan är något du hoppas hitta. Inte svårare än så!",
+  "concept_pif_title": "Piffa",
+  "concept_pif_description": "Något du inte behöver längre? Din granne kanske letar efter just det.",
+  "concept_wish_title": "Önska",
+  "concept_wish_description": "Behöver du något? Lägg upp en önskan så kanske en granne kan uppfylla den!",
   "discover_pifs": "Upptäck piffar",
   "discover_description": "Se vad som piffas i ditt område",
   "give_away_something": "Piffa något",
   "explore": "Utforska",
   "find_nearby": "Hitta i din närhet",
-  "why_pif": "Varför piffa?",
-  "reduce_waste": "Minska avfall",
-  "reduce_waste_description": "Ge saker nytt liv genom att piffa",
-  "build_community": "Bygg gemenskap",
-  "build_community_description": "Skapa relationer med dina grannar",
-  "sustainable_future": "Hållbar framtid",
-  "sustainable_future_description": "En pif i taget",
   "welcome_connected": ...
```

### 2. `src/locales/en/home.json` — mirror diff

```diff
-  "hero_description": "A place where neighbors help neighbors. Pif, give and receive with the heart at the center.",
+  "hero_description": "Pif what you no longer need. Help a neighbor and make room for something new!",
   ...
-  "community_growing": "Our community is growing",
-  "shared_pifs": "Shared pifs",
-  "sustainable_choices": "Sustainable choices",
-  "circular_economy": "Circular economy",
+  "concepts_intro": "A pif is something you give to a neighbor. A wish is something you hope to find. Simple as that!",
+  "concept_pif_title": "Pif",
+  "concept_pif_description": "Something you no longer need? Your neighbor might be looking for exactly that.",
+  "concept_wish_title": "Wish",
+  "concept_wish_description": "Need something? Post a wish and maybe a neighbor can fulfill it!",
   ...
-  "why_pif": "Why pif?",
-  "reduce_waste": "...",  (and the other 5 removed keys)
```

### 3. `src/pages/Home.tsx` — structural swaps

**A. Replace the "Community Stats" block** (the `<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 ...">` containing `community_growing` + 3-column grid) with:

```tsx
{/* Concepts explainer */}
<div className="max-w-3xl mx-auto w-full mb-6">
  <p className="text-center text-gray-600 text-sm sm:text-base mb-4 max-w-xl mx-auto px-2">
    {t('home.concepts_intro')}
  </p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm">
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-2xl">🎁</span>
        <h3 className="font-semibold text-green-700">{t('home.concept_pif_title')}</h3>
      </div>
      <p className="text-sm text-gray-600">{t('home.concept_pif_description')}</p>
    </div>
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm">
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-2xl">✨</span>
        <h3 className="font-semibold text-amber-700">{t('home.concept_wish_title')}</h3>
      </div>
      <p className="text-sm text-gray-600">{t('home.concept_wish_description')}</p>
    </div>
  </div>
</div>
```

Card styling matches the existing `bg-white/80 backdrop-blur-sm rounded-2xl … border … shadow-sm` pattern already on the page. Pif card uses green (per memory: pifs=green), Wish card uses amber (per memory: wishes=amber) — consistent with the project's pif-vs-wish differentiation rule.

**B. Delete the entire "Mission Statement" block** — the final `<div className="text-center space-y-4 max-w-5xl mx-auto">` containing the `why_pif` heading and the three cards (reduce_waste / build_community / sustainable_future).

**C. Remove now-unused `Users` and `Recycle` imports** from the `lucide-react` import line (kept if still referenced elsewhere in the file — they aren't).

### Out of scope
- No changes to hero image, logo, action cards (Discover / Piffa något / Utforska), header, nav, or network status.
- No changes to other locales, routes, or components.

### Verification
- Build passes (auto).
- Visually confirm on `/` in both `sv` and `en` that: hero text updated, old stats block replaced with intro + 2 cards, "Varför piffa?" section gone.
