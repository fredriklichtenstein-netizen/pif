

## The Bug

`/profile` floods the console with 400 errors:
```
column interests.message does not exist
```

Root cause: `src/hooks/interest/useInterestUsers.ts` selects columns that don't exist in the actual `interests` table.

**Actual schema** (`src/integrations/supabase/types.ts` lines 243–250):
```
interests: { id, item_id, user_id, status, created_at }
```

**The broken query** (`useInterestUsers.ts` line 14):
```ts
.select("id,user_id,status,message,created_at,users:profiles!interests_user_id_fkey(*)")
//                  ^^^^^^^ does not exist
```

A second latent bug in `src/hooks/interest/useInterestSelection.ts` line 18 writes `selected_at`, which also does not exist in the schema — this will throw the moment a piffer tries to confirm a receiver.

`useInterestUsers` is called once per item rendered in the profile (via `InterestUsersPopover`), which is why the 400 repeats six times in the logs.

## The Fix

Two minimal, surgical edits — no schema migration needed (the PRD-aligned flow works fine without `message` for now).

**1. `src/hooks/interest/useInterestUsers.ts`** — remove the non-existent `message` column from the select:
```ts
.select("id,user_id,status,created_at,users:profiles!interests_user_id_fkey(*)")
```

**2. `src/hooks/interest/useInterestSelection.ts`** — drop `selected_at` from the update payload (keep just `status: "selected"`), so picking a receiver doesn't 400 once a user actually tries it:
```ts
.update({ status: "selected" })
```

## Why not add the columns instead?

Per the PRD, v1 selection is binary (selected / not_selected) with no attached message — messaging unlocks *after* selection via DM, not as part of the interest record. Adding `message` and `selected_at` columns would expand schema surface for no current product use. If we later want optional notes ("I can help — I have one in my garage") on a request, we'll add `message` deliberately at that point.

## Verification

After the edits, reloading `/profile` should produce zero `interests` 400s and zero `column interests.message does not exist` errors. Interest popovers will render correctly with the existing fields.

