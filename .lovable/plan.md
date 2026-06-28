
## Confirmed: stale client, not stale code

Good diagnosis on the payload shape — that's conclusive. Status of the live deploy:

- Project **is published**, visibility public.
- I have **no visibility into the published build hash** vs. the editor's current source from this side — Lovable doesn't expose "last published commit" through the tools I have. What I can confirm: the source in the editor (which is what the next publish ships) no longer contains the `create_notification('selection_made', ...)` block.

Two ways the user can be hitting the old code:

1. **Editor changes were never published.** Frontend edits do not auto-deploy — they ship only when someone clicks **Publish → Update** in the Lovable editor. If that hasn't happened since the removal, `pif.today` is still serving the build with the old block. **This is the most likely cause** and the cheapest to rule in/out: open the publish dialog and check the "last published" timestamp against when the InterestSelectionList edit landed.
2. **Stale client cache after a publish.** Even if it WAS republished, this project has two cache layers that can serve old JS:
   - **Capacitor wrapper** (`capacitor.config.ts` present) — the native shell bundles webview assets; an installed iOS/Android build won't pick up a web republish until the app is rebuilt and reinstalled.
   - **PWA / service worker** — if the user installed pif.today to home screen or visited it as a PWA, an app-shell SW can serve the old `index.html` + hashed JS chunk until the SW updates and the tab reloads. Hard reload (or `?sw=off` if a kill-switch exists) flushes it.

## Recommended next step (no code changes)

Ask the user to confirm both:

- **A:** In the Lovable editor, open Publish and verify the last-published timestamp is **after** the InterestSelectionList edit. If not → click Update; the bug is gone on next page load.
- **B:** Where they tested: published web (`pif.today`), preview URL, or an installed Capacitor app. If installed Capacitor → web republish won't fix it; needs a native rebuild. If web → hard reload (DevTools → Application → Service Workers → Unregister, then reload) to bypass SW cache.

If A shows the publish IS current and B is plain web with SW unregistered, then we're wrong about the cause and I'll reopen the investigation — but given the payload-shape evidence, I'd bet on A.

## Confirmed: no migration needed

`drop_legacy_selection_made_trigger.sql` not written. Nothing to drop on the DB side.

## Backlog still standing (for the later missing-signal audit, not actioned now)

- Receiver withdrawing themselves — no notification, no system message.
- Owner withdrawing a receiver/fulfiller from the feed item card (separate entry point from InterestSelectionList management popup Site B) — no notification, no system message.
- Site B itself (owner unselecting via InterestSelectionList lines ~679–715) — also no signal.
