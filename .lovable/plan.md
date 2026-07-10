## Lovable implementation plan for approval

### Change: Two always-visible buttons in `src/components/post/form/PostFormLocation.tsx`

Replace the single toggle button (currently ~lines 220-227) and remove `allEnabled` / the toggle branch in `applyAllDefaults` (~lines 129-160).

### Diff

**Remove** the `allEnabled` derivation and rewrite `applyAllDefaults` into two dedicated handlers:

```tsx
const applyDefaults = () => {
  const next = { ...enabledFields };
  (Object.keys(defaultsMap) as PickupField[]).forEach((f) => {
    if (hasDefault(f)) {
      next[f] = true;
      populateField(f);
    }
  });
  setEnabledFields(next);
};

const clearAll = () => {
  setEnabledFields({
    address: false, door_code: false, floor: false, instructions: false, phone: false,
  });
  setFormData((prev) => ({
    ...prev,
    pickup_address: '',
    pickup_address_mode: 'primary',
    pickup_door_code: '',
    pickup_floor: '',
    pickup_instructions: '',
    phone: '',
  }));
};
```

**Replace** the single `<Button>` block with a two-button row:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
  <Button
    type="button"
    variant="secondary"
    onClick={applyDefaults}
    disabled={!anyDefault}
    className="w-full justify-center gap-2"
  >
    <Wand2 className="h-4 w-4" />
    {t('post.use_my_defaults')}
  </Button>
  <Button
    type="button"
    variant="outline"
    onClick={clearAll}
    className="w-full justify-center gap-2"
  >
    {t('post.clear_all_fields')}
  </Button>
</div>
```

### Notes

- Keeps existing translation keys `post.use_my_defaults` and `post.clear_all_fields` — no locale changes.
- `anyDefault` already exists; drives the disabled state of Button 1.
- `allEnabled` removed entirely.
- No other files or logic touched; per-field toggles, address mode, and submission logic unchanged.
