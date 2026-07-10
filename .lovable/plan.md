# Fix: Storage cleanup skipped on pif.today deletions

## Root cause

Not a code regression. The current `src/components/settings/DangerZone.tsx` correctly calls `supabase.functions.invoke('delete-account')`, and the Edge Function is deployed. However, the deletion test was run against **the published site (`pif.today`)**, which still serves an older frontend bundle whose delete handler calls `supabase.rpc('delete_own_account', ...)` directly — bypassing the Edge Function entirely.

Frontend changes in Lovable go live only after clicking **Update** in the Publish dialog. Backend/Edge Function changes deploy immediately, which is why the function exists server-side but nothing on the live site ever calls it.

## Fix

### Step 1 — Republish the frontend (user action, ~30 seconds)

Click **Publish → Update** so `pif.today` gets the current bundle where `DangerZone.tsx` invokes the `delete-account` Edge Function. No code change needed for this step; the correct code is already in the sandbox.

### Step 2 — Verify end-to-end on the published site

After republish, on `pif.today`:
1. Sign in as a disposable test account that has at least one uploaded profile photo and one item photo.
2. Delete the account via Settings → Danger zone.
3. Confirm in Supabase:
   - Edge Function logs show a `delete-account` invocation with `storage_removed` counts > 0.
   - `profile-photos/<user_id>/` and `post-images/images/<user_id>/` are empty in Storage.
   - `auth.users`, `profiles`, `items` rows for that user are gone (cascade still works).

### Step 3 — Clean up storage orphaned by pre-fix deletions (one-off)

Any accounts deleted on `pif.today` before this republish left files behind in `profile-photos/<uid>/` and `post-images/images/<uid>/`. Because the auth/profile rows are already gone, these folders are now unreferenced.

Options — pick one when you're ready (not part of this plan's implementation):
- **Manual sweep**: in Supabase Storage UI, list top-level folders in both buckets and delete any whose folder name (a UUID) no longer exists in `auth.users`.
- **One-shot cleanup Edge Function**: a service-role script that diffs bucket prefixes against `auth.users.id` and removes orphaned folders. Can be built later if the manual sweep is impractical.

## Guardrail to prevent recurrence

Add a short note to `mem://` that GDPR-relevant flows must be re-verified on the **published** site after any change touching them, since the preview and published bundles can diverge until Update is clicked. I'll write this memory in build mode after you approve.

## Not changing

- `src/components/settings/DangerZone.tsx` — already correct.
- `supabase/functions/delete-account/index.ts` — already correct and deployed.
- `supabase/config.toml` — already has `verify_jwt = true` for `delete-account`.
