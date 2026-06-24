## Revised migration: `db/manual_migrations/wish_aware_system_messages.sql`

Apply the two requested changes to the wish branch only. Pif branch, `v_is_wish` derivation, and the skip-pickup-block decision remain unchanged from the previously-approved draft.

### Changes inside `if v_is_wish then` block

1. **Reword both messages** to remove the implicit single-fulfiller framing.
2. **Include `v_desc`** in both messages using the same `btrim(coalesce(v_desc,'')) <> ''` guard the pif branch uses.

### New wish branch (full replacement)

```sql
if v_is_wish then
  -- Wishes have no piffer-side pickup metadata; coordinate in chat.
  -- Multiple fulfillers may be selected for the same wish, so wording
  -- avoids implying a single chosen fulfiller.
  -- p_owner_id    = the wisher (request poster).
  -- p_receiver_id = a user the wisher has selected to fulfil the wish.

  v_receiver_msg :=
    'Önskaren vill gärna att du uppfyller önskan "' || v_title || '".'
    || case when btrim(coalesce(v_desc,'')) <> ''
            then E'\n\nBeskrivning: ' || v_desc
            else '' end
    || E'\n\nSkriv här till önskaren för att bekräfta detaljer.';

  v_piffer_msg :=
    'Du har valt någon till att uppfylla önskan "' || v_title || '".'
    || case when btrim(coalesce(v_desc,'')) <> ''
            then E'\n\nBeskrivning: ' || v_desc
            else '' end
    || E'\n\nSkriv här för att bekräfta tid och plats.';

else
  -- (unchanged pif branch — preserved byte-for-byte)
  ...
end if;
```

Everything else in the file (header comment, `v_item_type` selection, `v_is_wish` derivation, pif branch body, insert statement, revoke) stays exactly as in the previously-approved draft. I will also extend the header comment with a one-line note that wish wording is deliberately multi-fulfiller-neutral.

### Process

- Edit only `db/manual_migrations/wish_aware_system_messages.sql`.
- No code/runtime changes; nothing else touched.
- Paste the final SQL back for your review before you run it in the Supabase SQL editor. Verification (fresh wish selection → both system messages read correctly with new wording and include description) happens after you apply it.
