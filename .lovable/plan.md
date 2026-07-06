## Lovable implementation plan for approval

Goal: On short steps of the post/wish creation flow, "Föregående"/"Nästa" should always sit at the bottom of the screen (just above the bottom nav), so they never share vertical space with the feedback FAB.

Approach: use a flex column that fills the viewport, let the form content grow, and push the navigation bar to the bottom of that column with `mt-auto`. No `position: fixed`; the CTA bar stays in flow but always lands at the bottom on short content and scrolls naturally on tall content.

### Files touched

1. `src/pages/Post.tsx` — make the middle wrapper a flex column so its child can fill the height.
2. `src/pages/PostEdit.tsx` — same, so the edit flow behaves identically.
3. `src/components/post/form/PostFormContainer.tsx` — convert the container to a full‑height flex column and push the nav to the bottom.

`PostFormNavigation.tsx` itself does not change — it already renders a `flex justify-between` row; we only change how the parent lays it out.

### Diffs (conceptual)

**`src/pages/Post.tsx`**
```diff
- <div className="flex-1">
+ <div className="flex-1 flex flex-col">
     <Suspense …>
       <PostForm />
     </Suspense>
   </div>
```
Same one-line change in `PostEdit.tsx` around the `<PostForm />` wrapper (the `container … py-8 px-4 pb-20` div becomes `… flex-1 flex flex-col` and drops `pb-20` since the child container owns bottom spacing).

**`src/components/post/form/PostFormContainer.tsx`**

Outer wrapper:
```diff
- <div className="container max-w-2xl mx-auto py-8 px-4 pb-20">
+ <div className="container max-w-2xl mx-auto px-4 pt-6 flex-1 flex flex-col min-h-0">
```

Form element becomes the flex column that fills the remaining space, and the navigation is pushed to the bottom with `mt-auto`:
```diff
- <form onSubmit={handleFormSubmit} className="space-y-6">
-   <Card className="p-6">
-     {renderCurrentStep()}
-   </Card>
-   <PostFormNavigation … />
- </form>
+ <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
+   <Card className="p-6 mb-6">
+     {renderCurrentStep()}
+   </Card>
+   <div className="mt-auto pt-4 pb-6 bg-background">
+     <PostFormNavigation … />
+   </div>
+ </form>
```

Notes:
- `flex-1` chain: `Post.tsx .flex-1.flex.flex-col` → `PostFormContainer` outer `flex-1.flex.flex-col` → `<form> flex-1.flex.flex-col` → `<div className="mt-auto …">` sits at the bottom of the form column.
- `min-h-0` on the flex columns prevents overflow clipping on iOS Safari.
- We drop the previous `pb-20` on the container because the page-level `MainNav` is a sibling below `flex-1`, so it does not overlap; content ends where the nav begins. The nav bar block adds `pt-4 pb-6` breathing room above the MainNav.
- `bg-background` on the nav wrapper prevents any card content bleeding through if the page ever scrolls behind it.
- On tall steps (e.g. Images with many uploads), the form grows past the viewport and scrolls normally; CTAs stay at the natural end of the form, which on the last viewport is exactly the bottom of the screen. No overlap with the scrollable card because the nav wrapper is a sibling block, not absolutely positioned.

### FAB clearance check
- FAB sits at `right-4 bottom-40` (160–216 px band, right side).
- Nav row's right-side button ("Nästa"/submit) will land at ~`bottom-24` (bottom of viewport minus MainNav height + `pb-6`), i.e. the 96–140 px band. That is fully below the FAB band with a ~20 px gap, matching the Feed page standard.

### Out of scope
- No change to `PostFormNavigation.tsx` internals.
- No change to `FeedbackFab` position.
- No change to other pages — this is scoped to the post/wish creation and edit flows only.
