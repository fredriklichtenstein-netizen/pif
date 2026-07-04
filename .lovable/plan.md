## Fix: feedback i18n block nested one level too deep

### Root cause
In both `src/locales/sv/interactions.json` and `src/locales/en/interactions.json`, the `"feedback"` block was inserted just before line 736's closing `}` — but that `}` closes the `settings` object, not `interactions`. So the keys currently resolve at `interactions.settings.feedback.*` while `FeedbackDialog.tsx` calls `t("interactions.feedback.*")`. Mismatch → raw key paths render.

### Change
Move the `"feedback": { … }` block (lines 715–735 in both files) out of `settings` and into `interactions` as a sibling of the existing `interactions.*` keys. Content of the block stays byte-identical — only its nesting position changes.

Structure after the fix (both files):

```text
{
  "interactions": {
    "like": …,
    …existing interactions keys…,
    "feedback": { fab_aria, dialog_title, mode_issue, mode_feedback,
                  placeholder_issue, placeholder_feedback,
                  capture_button, capture_hint, capture_failed,
                  screenshot_attached, remove_screenshot,
                  submit, cancel, sending,
                  success_title, success_description,
                  error_title, error_description,
                  anonymous_name },
    "settings": { …unchanged, no feedback child… }
  },
  "notifications": {…},
  "someone": "Någon"
}
```

No component changes. No changes to `i18n/index.ts`. No other locale files touched.

### Verification
1. `python3 -c "import json,sys; d=json.load(open(p)); assert 'feedback' in d['interactions']; assert 'feedback' not in d['interactions']['settings']"` for both SV and EN.
2. `tsgo` typecheck (should be a no-op since only JSON changed, but confirms nothing else regressed).
3. Manually load the dialog in the preview and confirm Swedish/English strings render (no raw `interactions.feedback.*` paths).
