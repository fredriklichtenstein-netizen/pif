## Lovable implementation plan for approval

Two adjustments to `src/components/post/form/PostFormLocation.tsx` only. No changes to state hook, submission, DB, or types.

### FIX 1 — Toggles always enabled

- Remove the `disabled={!hasDefault}` on the `Switch` in `PickupFieldRow`.
- Remove the `hasDefault` prop from `PickupFieldRow` (and stop dimming the label / stop rendering the "Inte sparat i din profil" hint).
- Keep `toggleField(f, on)` semantics: ON populates from profile default if one exists, otherwise leaves the field empty for manual typing; OFF clears the field.
- Add a subtle placeholder-only hint via the existing inputs when toggled ON but no default exists. Concretely: pass the existing `t('post.pickup_add_manually')` (new key: SV "Lägg till manuellt" / EN "Add manually") as fallback placeholder to the address/door/floor/instructions/phone inputs when `!hasDefault && enabled`. For the address block, when no primary address exists and toggle is ON, render the custom `AddressInput` directly (skip the primary/custom radio, since there's nothing to choose).
- The existing per-field `t('post.pickup_field_no_default_hint')` key can be left in the JSON (harmless) but is no longer referenced from the component.

### FIX 2 — "Använd mina standardinställningar" becomes a two-way toggle

- Derive `allEnabled = every enabledFields[f] === true` (considering only fields that have a default? — see below).
- Button behavior:
  - If `allEnabled` is false: populate all fields that have a profile default and set their toggles ON. Fields with no default are left as-is (their toggle can still be flipped individually). This matches current "apply defaults" behavior.
  - If `allEnabled` is true: clear ALL five fields and set ALL toggles OFF (including any fields the user had manually enabled without a default).
- Button label switches:
  - false → `t('post.use_my_defaults')` ("Använd mina standardinställningar" / "Use my default settings")
  - true → `t('post.clear_all_fields')` ("Rensa alla fält" / "Clear all fields") — new key
- The `disabled={!anyDefault}` guard and the `no_defaults_saved_hint` note are removed so the button is always available (user can still "clear all" even without profile defaults, which is a valid action after they typed things manually). If preferred, keep it disabled when both `!anyDefault && !allEnabled` (nothing to populate and nothing to clear); I'll go with "always enabled" for symmetry with FIX 1.

### `allEnabled` definition

To make the toggle feel right, `allEnabled` is computed as: every field that either has a default OR is currently enabled is ON. In practice: `Object.values(enabledFields).every(Boolean)` — if any toggle (defaulted or manual) is OFF, the button reads "use defaults"; once everything is ON, it reads "clear all". Simple and predictable.

### Files touched

- `src/components/post/form/PostFormLocation.tsx` — UI/state changes above.
- `src/locales/sv/post.json` — add `clear_all_fields: "Rensa alla fält"`, `pickup_add_manually: "Lägg till manuellt"`.
- `src/locales/en/post.json` — add `clear_all_fields: "Clear all fields"`, `pickup_add_manually: "Add manually"`.

No changes to `usePostFormState.ts`, `usePostFormSubmission.ts`, types, or DB migrations.
