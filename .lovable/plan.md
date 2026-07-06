## Lovable implementation plan for approval

**Finding:**

The empty-state placeholder is in the i18n locale file, not hardcoded.

- `src/locales/sv/interactions.json`, line 590 (inside the `messages` object):
  `"no_conversations_description": "När du skickar meddelande till någon om en pif visas det här."`

- `src/locales/en/interactions.json`, line 590 (same key):
  `"no_conversations_description": "When you message someone about an item, it will appear here."`

- Rendered by: `src/pages/Messages.tsx`, line 289:
  `<p className="text-sm text-muted-foreground">{t('messages.no_conversations_description')}</p>`

**Proposed change:**

Update the Swedish locale string to the requested copy. For i18n consistency, also update the matching English string to mention wishes.

- `src/locales/sv/interactions.json` line 590 →  
  `"no_conversations_description": "När du skickar meddelande till någon om en pif eller önskan visas det här."`

- `src/locales/en/interactions.json` line 590 →  
  `"no_conversations_description": "When you message someone about an item or wish, it will appear here."`