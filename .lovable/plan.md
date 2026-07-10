## Lovable implementation plan for approval

### Fix: `applyAllDefaults` clear branch in `src/components/post/form/PostFormLocation.tsx`

The current clear branch already calls `clearField(f)` for every key in `defaultsMap`, but relies on multiple sequential functional `setFormData` calls. To make the reset unconditional, explicit, and atomic (and to also reset `pickup_address_mode` so the address row doesn't fall back to the primary address on next re-open), replace the loop with a single `setFormData` that zeroes all five fields at once.

### Exact diff (around lines 132–142)

Before:
```tsx
const applyAllDefaults = () => {
  if (allEnabled) {
    // Clear all fields and toggle off
    const cleared: Record<PickupField, boolean> = {
      address: false, door_code: false, floor: false, instructions: false, phone: false,
    };
    setEnabledFields(cleared);
    (Object.keys(defaultsMap) as PickupField[]).forEach((f) => clearField(f));
    return;
  }
```

After:
```tsx
const applyAllDefaults = () => {
  if (allEnabled) {
    // Clear all fields and toggle off (unconditional, regardless of profile defaults)
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
    return;
  }
```

### Why this fixes both bugs

- **BUG 1**: All five field values (`pickup_address`, `pickup_door_code`, `pickup_floor`, `pickup_instructions`, `phone`) are reset to `''` in a single `setFormData` call alongside the toggle state reset.
- **BUG 2**: The reset is unconditional — it doesn't check `hasDefault`, so every field clears regardless of profile presence. Also resets `pickup_address_mode` so the address input doesn't visually retain the profile's primary address when toggled back on later.

No other code paths, translations, or components are touched.
