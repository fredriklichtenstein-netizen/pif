## Lovable implementation plan for approval

### Change: `toggleField` in `src/components/post/form/PostFormLocation.tsx` (~line 118)

Remove the auto-populate-from-profile behavior on ON. Toggling a single field ON now just reveals an empty input; only the "Använd mina standardinställningar" button reads from `defaultsMap`.

### Diff

Before:
```tsx
const toggleField = (f: PickupField, on: boolean) => {
  setEnabledFields((prev) => ({ ...prev, [f]: on }));
  if (on) {
    populateField(f);
  } else {
    clearField(f);
  }
};
```

After:
```tsx
const toggleField = (f: PickupField, on: boolean) => {
  setEnabledFields((prev) => ({ ...prev, [f]: on }));
  // Never auto-populate from profile defaults on individual toggle.
  // Only `applyDefaults()` (the "Use my defaults" button) reads defaultsMap.
  // ON reveals an empty editable input; OFF clears the field.
  clearField(f);
};
```

### Notes

- `populateField` remains — still used by `applyDefaults`.
- No other logic, UI, translations, or files affected.
- Edit-mode initial values are set by `initializeFormData` on the parent form, not by `toggleField`, so pre-filled edit values remain intact until the user manually toggles a field off.
