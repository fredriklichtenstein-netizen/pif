## Lovable implementation plan for approval

Make `pickup_preference` behave like the rest of the pickup section: empty by default for new pifs, populated only via "Använd mina standardinställningar", cleared via "Rensa alla fält".

### 1. `src/hooks/post/usePostFormState.ts`

Remove the profile-based auto-population of `pickup_preference` for new pifs. Edit-mode is unaffected because `pickup_preference` still hydrates from `initialData` in the initial `useState`.

Diff (inside the profile-fetch effect):

```ts
// BEFORE
if (initialData?.id) return;
const pref = d?.pickup_preference;
setFormData((prev) => {
  const next = { ...prev };
  if (pref && !prev.pickup_preference) next.pickup_preference = pref;
  if (!prev.primary_address) next.primary_address = primary;
  return next;
});

// AFTER
if (initialData?.id) return;
setFormData((prev) => {
  if (prev.primary_address) return prev;
  return { ...prev, primary_address: primary };
});
```

Note: `defaults.pickup_preference` also needs to travel through so the button can read it. Add it to `PickupProfileDefaults` (type update in `src/types/post.ts` — add `pickup_preference?: string`) and include `pickup_preference: d?.pickup_preference || ""` in the `defaults` object, plus in `EMPTY_DEFAULTS` both here and in `PostFormLocation.tsx`.

### 2. `src/components/post/form/PostFormLocation.tsx`

`applyDefaults()` — also set the preference from profile when present:

```ts
const applyDefaults = () => {
  const next = { ...enabledFields };
  (Object.keys(defaultsMap) as PickupField[]).forEach((f) => {
    if (hasDefault(f)) { next[f] = true; populateField(f); }
  });
  setEnabledFields(next);
  const pref = profileDefaults.pickup_preference;
  if (pref) {
    setFormData((prev) => ({ ...prev, pickup_preference: pref }));
  }
};
```

`clearAll()` — also clear the preference:

```ts
setFormData((prev) => ({
  ...prev,
  pickup_preference: '',
  pickup_address: '',
  pickup_address_mode: 'primary',
  pickup_door_code: '',
  pickup_floor: '',
  pickup_instructions: '',
  phone: '',
}));
```

Also update the `EMPTY_DEFAULTS` constant to include `pickup_preference: ""`.

### 3. Collapsible default-open behavior

`<Collapsible defaultOpen={!!formData.pickup_preference}>` will now start closed for new pifs (since preference is empty), and still open in edit-mode when a preference was saved. This matches the "nothing preselected" intent.

### Result
- New pif: no pickup option highlighted; section closed until user opens it.
- Tap "Använd mina standardinställningar": preference + all fields populate from profile.
- Tap "Rensa alla fält": preference and all fields cleared.
- Edit-mode: unchanged — existing item values hydrate normally.
