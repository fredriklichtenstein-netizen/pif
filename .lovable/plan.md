## Lovable investigation findings + proposed fix

### 1. Where the width is set
Single location: `src/components/post/interactions/button/CounterButton.tsx` line 117:
```tsx
<PopoverContent className={useInterestList ? "w-80 p-2" : "w-64 p-2"} ...>
```
`InterestSelectionList` itself sets no width — it inherits from this parent `PopoverContent`. This is the only mount point of `InterestSelectionList`, so changing it here affects every variant (owner list, wish-fulfiller collapsed view, pif candidate list, non-owner candidate list) uniformly and nothing else.

The shared primitive (`src/components/ui/popover.tsx`) has a default `w-72` that is overridden by the `className` above; no change needed there.

### 2. Impact of widening on other in-popover content
All rows use the same left-aligned `avatar + name/timestamp + right-side actions` layout. There is no fixed-width media, chart, or grid inside. Wider container → more room for the name; every existing row type benefits (owner "Välj" buttons, "Vald" badge + Meddelande + Ångra, plain candidate rows). No layout would look odd at a moderately wider size. The wish-fulfiller collapsed self-view is even less dense than the owner list, so it also stays fine.

### 3. Alternative: pure truncation tuning
The name Link already has `flex-1 min-w-0` and the actions cluster is `ml-auto`. The reason "Fredri…" truncates is not a missing `min-w-0` — it's that at 320px total, once you subtract padding (16px) + avatar (28px) + gap (~8px) + "Vald" badge (~55px) + Ångra icon (28px) + Meddelande (~95px) + gaps, the name column resolves to ~50–60px regardless of any additional `min-w` / `max-w` hint. Truncation tuning alone cannot fix this at 320px; the container must grow. So this alternative is rejected as insufficient.

### Proposed minimal change
One-line edit in `CounterButton.tsx` line 117:
```tsx
className={useInterestList ? "w-80 sm:w-96 p-2" : "w-64 p-2"}
```
- Mobile (<640px): unchanged at 320px — preserves the currently-working narrow case.
- ≥640px (sm breakpoint, covers desktop and most tablets): 384px, adding 64px directly to the name column (actions cluster is fixed-width, so all extra space flows to `flex-1`). Enough to render "Fredrik S" comfortably; longer names still truncate gracefully via the existing `truncate` class.
- Non-interest counter popovers (likes / comments via `UserPopoverContent`) stay at `w-64` — untouched.

### Out of scope
No changes to `InterestSelectionList` internals, the Ångra button, the shared popover primitive, or any width used elsewhere.

Approve and I'll apply the one-line change in build mode.