## Lovable implementation plan for approval

### Current implementation

**`src/components/settings/DangerZone.tsx`** (lines ~90 and ~100):
```tsx
<Input
  ...
  placeholder={t('settings.delete_confirmation_placeholder')}
/>
...
onClick={() => {
  if (confirmationText === "delete my account") {  // ← hardcoded EN
    handleDeleteAccount();
  } else { toast({ ... }); }
}}
disabled={loading || confirmationText !== "delete my account"}  // ← hardcoded EN
```

Instructional text uses `t('settings.type_to_confirm')` — but the SV translation itself embeds the English phrase literally:
- SV: `"Skriv \"delete my account\" för att bekräfta:"`
- SV placeholder: `"delete my account"`
- SV mismatch desc: `"Skriv \"delete my account\" för att bekräfta"`

So both the copy AND the validation are wrong for SV.

### Diff

**1. `src/locales/sv/interactions.json`** (settings section, keys around line 735–738):
```diff
- "type_to_confirm": "Skriv \"delete my account\" för att bekräfta:",
- "delete_confirmation_placeholder": "delete my account",
+ "type_to_confirm": "Skriv \"radera mitt konto\" för att bekräfta:",
+ "delete_confirmation_placeholder": "radera mitt konto",
+ "delete_confirmation_phrase": "radera mitt konto",
  "confirmation_mismatch": "...",
- "confirmation_mismatch_description": "Skriv \"delete my account\" för att bekräfta"
+ "confirmation_mismatch_description": "Skriv \"radera mitt konto\" för att bekräfta"
```

**2. `src/locales/en/interactions.json`** (add phrase key; existing strings unchanged):
```diff
  "type_to_confirm": "Type \"delete my account\" to confirm:",
  "delete_confirmation_placeholder": "delete my account",
+ "delete_confirmation_phrase": "delete my account",
  "confirmation_mismatch_description": "Please type \"delete my account\" to confirm",
```

**3. `src/components/settings/DangerZone.tsx`** — compute expected phrase once and use it:
```diff
+ const expectedPhrase = t('settings.delete_confirmation_phrase');
+ const normalized = confirmationText.trim().toLowerCase();
+ const matches = normalized === expectedPhrase.toLowerCase();
...
  <Input
    value={confirmationText}
    onChange={(e) => setConfirmationText(e.target.value)}
-   placeholder={t('settings.delete_confirmation_placeholder')}
+   placeholder={expectedPhrase}
    className="border-destructive/50"
  />
...
  onClick={() => {
-   if (confirmationText === "delete my account") {
+   if (matches) {
      handleDeleteAccount();
    } else { toast({...}); }
  }}
- disabled={loading || confirmationText !== "delete my account"}
+ disabled={loading || !matches}
```

Case-insensitive + trimmed comparison so a stray space or capital letter doesn't block a legitimate delete. Behavior in EN is unchanged; SV now expects and validates against `"radera mitt konto"`.

No other consumers of `delete_confirmation_placeholder` / `type_to_confirm` exist outside `DangerZone.tsx`.
