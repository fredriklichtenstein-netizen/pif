
# PRD Gap Closure — Prioritized Build Plan

Five gaps remain between the current app and the v1 PRD. Below they are ordered by user impact and dependency, with concrete tasks and acceptance criteria for each. Every gap is shippable independently.

---

## Priority 1 — Rating & Feedback Loop Close-Out

**Why first:** It's the missing half of the completion flow that already exists, it powers the trust indicators users already see, and it has no dependencies.

**PRD requirement:** Receiver confirms receipt and may leave private feedback; piffer rates receiver (positive or no-show).

### Tasks
1. Add a `ratings` table (rater, ratee, item, outcome: `positive` | `no_show`, optional private note, created_at) and an RPC `submit_rating(p_item_id, p_outcome, p_note)` with RLS so only the two participants can write, and only after the item reaches `completed` or `pending_confirmation`.
2. Extend the existing completion flow:
   - When piffer marks item piffed → prompt rates receiver step (positive / no-show).
   - When receiver confirms receipt → optional private feedback textarea.
3. Feed the rating outcomes into the existing `reliability-rating-system` aggregation so contextual trust indicators reflect real data instead of mock.
4. Add i18n strings (EN/SV) and Demo Mode mock submissions.

### Acceptance criteria
- Completing a pif always presents the rating step to the piffer; skipping is allowed but explicitly logged.
- Receiver confirmation screen shows an optional private feedback field; submission persists and is never shown publicly.
- Trust indicator on a user's profile/selection list updates within one session after a rating is submitted.
- RLS prevents third parties or non-participants from inserting/reading ratings.

---

## Priority 2 — Moderation & Reporting Backend

**Why second:** `ReportDialog.tsx` already exists in the UI but has no backend wiring, leaving a visible promise unmet. This is also a Trust & Safety baseline before broader rollout.

**PRD requirement:** Reporting and moderation tools.

### Tasks
1. Add `reports` table (reporter_id, target_type: `item` | `user`, target_id, reason, description, status: `open` | `reviewed` | `actioned` | `dismissed`, created_at, reviewed_by, reviewed_at).
2. Add RPC `submit_report(p_target_type, p_target_id, p_reason, p_description)` with RLS: any authenticated user can insert; only `admin` role can read/update.
3. Wire `ReportDialog` to the RPC; show success toast and disable double-submit.
4. Add a minimal `/admin/reports` route gated by `has_role('admin')`:
   - List open reports newest first.
   - Quick actions: dismiss, hide item, suspend user.
5. Auto-hide an item from feed/map once it has N open reports (configurable, default 3) until reviewed.

### Acceptance criteria
- Submitting a report from any item or user succeeds and persists with the correct reporter and target.
- Non-admin users get a 403 / blank state on `/admin/reports`.
- Admin can dismiss or action a report; actioned items disappear from public feed/map immediately.
- Reports table has `app_role` based RLS — never role columns on profiles.

---

## Priority 3 — Auto-Neighborhood + Dynamic Radius (B2 Logic)

**Why third:** Largest scope, but core to the PRD's "neighborhood-first" promise. Sequenced after T&S so growth doesn't outpace moderation.

**PRD requirement:** Map view with auto-neighborhood + dynamic radius expansion based on density; warn when browsing outside.

### Tasks
1. Add `neighborhood` derivation in profile geocoding (use Mapbox reverse-geocode `neighborhood`/`locality` from existing `(lng,lat)` profile point).
2. Compute a per-user `effective_radius_km`:
   - Base 1 km in dense urban areas.
   - Expand stepwise (2, 5, 10, 25 km) until the user's visible feed reaches a minimum threshold (e.g. 8 active pifs/requests).
   - Cache on the client per session; recompute when location changes.
3. Default `/feed` and `/map` queries to within `effective_radius_km` of the user's profile point. Hide exact radius from UI; surface as "Your neighborhood" / "Nearby" / "Wider area" labels (per the "hide technical details" rule).
4. Add an explicit "Browse beyond your neighborhood" toggle on `/map` with a one-time confirmation toast warning that pickups outside your area are harder to coordinate.
5. Update map distance slider to respect the dynamic baseline rather than a hard-coded default.

### Acceptance criteria
- A new user in a dense area sees ~1 km of pifs by default; in a rural area, the radius expands automatically until the feed isn't empty.
- The UI never displays "1 km" / "25 km" — it uses friendly neighborhood labels.
- Browsing outside the auto radius requires explicit user confirmation and surfaces a single, dismissible warning.
- No exact addresses are exposed at any point (existing privacy offset still applies).

---

## Priority 4 — Pickup Reminder Notifications

**Why fourth:** Cheap to build on the existing notifications infrastructure; raises completion rate (a PRD success metric).

**PRD requirement:** Gentle reminders for pickups; no aggressive notifications.

### Tasks
1. Add a `scheduled_notifications` table (user_id, type, reference_id, send_at, sent_at, payload).
2. When a piffer selects a receiver and they agree on a time in chat, allow either party to set a pickup time (simple datetime picker in the conversation header).
3. Edge function (cron, every 15 min) scans `scheduled_notifications` where `send_at <= now() AND sent_at IS NULL`, inserts into `notifications`, marks sent.
4. Schedule reminders at: 24 h before, 2 h before, and a follow-up 24 h after if status hasn't moved to `piffed`.
5. Honor existing `useNotificationPreferences` toggles — users can disable reminders entirely.

### Acceptance criteria
- Setting a pickup time creates exactly three scheduled notifications.
- Reminders appear in the in-app notification list at the right times in a real test.
- Disabling reminders in settings prevents new scheduled rows from being created and skips pending ones.
- Cancelling/changing the pickup time updates or removes scheduled rows.

---

## Priority 5 — Copy Cleanup ("Wishes" → "Requests")

**Why last:** Small, safe, but visible. Trivial once heavier work lands.

**PRD requirement:** Clear differentiation and warm, human language. Terminology consistency.

### Tasks
1. Audit `src/locales/en/*.json` and `src/locales/sv/*.json` for `wish*` / `önskare` legacy keys exposed in the feed and map.
2. Replace user-facing "wishes/wishers" with "requests" (EN) and the agreed Swedish equivalent (confirm with user — "förfrågan"/"önskemål"?).
3. Keep internal data-normalization labels (`offer`/`request`) intact — this is copy-only.
4. Sweep components for hardcoded "wish" strings introduced after the i18n switchover.

### Acceptance criteria
- No user-facing surface uses the word "wish" or "wisher" in EN.
- Swedish copy is consistent with the term chosen with the user.
- Pif vs Request visual differentiation (color/icon) remains unchanged.

---

## Suggested Sequencing

```text
Sprint 1 : Priority 1  (Rating & Feedback)
Sprint 2 : Priority 2  (Moderation backend + admin view)
Sprint 3 : Priority 3  (Auto-neighborhood + dynamic radius)
Sprint 4 : Priority 4  (Pickup reminders)
Sprint 5 : Priority 5  (Copy cleanup) — can also be slipped into any sprint as filler
```

## Cross-cutting requirements (apply to every priority)
- Full EN/SV i18n; no hardcoded user-facing strings.
- Demo Mode parity: mock data and local handlers so demos still work end-to-end.
- RLS using the `app_role` / `has_role()` pattern — never role columns on profiles.
- No `console.log` in production paths; `console.error` / `warn` only.
- Privacy by design: no exact addresses in any new surface.

## Open questions before implementation
- Confirm the Swedish word for "request" (Priority 5).
- Confirm the auto-hide threshold for reported items (Priority 2 — default 3 reports).
- Confirm the "minimum visible posts" threshold that drives radius expansion (Priority 3 — default 8).
