import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainNav } from "@/components/MainNav";
import { InstallInstructionsBanner } from "@/components/pwa/InstallInstructionsBanner";
import { LocationPermissionBanner } from "@/components/feed/LocationPermissionBanner";
import { HowItWorksBanner } from "@/components/home/HowItWorksBanner";

import { useEffect, useLayoutEffect } from "react";
import { recentFeedScrollY, rememberFeedScroll } from "@/lib/feedScrollMemory";
import { FadeIn } from "@/components/animation/FadeIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useTranslation } from "react-i18next";

export default function Feed() {
  const { announce } = useAnnouncement();
  const { t } = useTranslation();

  useEffect(() => {
    announce(t('feed.announcement'));
  }, [announce, t]);

  // Back on the feed within a few minutes: return to the same spot instead of
  // the top (Trello #123). The feed hook reloads the same pages from cache;
  // we wait until they're tall enough, then scroll. A deep link (?post=) or
  // the drafts view decides its own position.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.has('post') || params.get('view') === 'drafts' ? null : recentFeedScrollY();
    let frame = 0;
    let stop = () => {};
    if (!target) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      // Photos load lazily, so the page keeps growing for a while: follow it
      // until the spot is reachable, for up to 6 s, and stop as soon as the
      // reader scrolls or touches the screen themselves.
      const started = performance.now();
      let done = false;
      stop = () => {
        done = true;
        cancelAnimationFrame(frame);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchstart', stop);
        window.removeEventListener('keydown', stop);
      };
      window.addEventListener('wheel', stop, { passive: true });
      window.addEventListener('touchstart', stop, { passive: true });
      window.addEventListener('keydown', stop);
      const follow = () => {
        if (done) return;
        const reachable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const top = Math.min(target, reachable);
        if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, left: 0, behavior: 'auto' });
        if (reachable >= target || performance.now() - started > 6000) {
          stop();
          return;
        }
        frame = requestAnimationFrame(follow);
      };
      frame = requestAnimationFrame(follow);
    }
    return () => stop();
  }, []);

  // The position is tracked while scrolling, not read at unmount: by then the
  // next page has replaced the DOM and window.scrollY is clamped. Layout-effect
  // cleanup runs before that DOM swap, and the pathname check drops the
  // clamping scroll event that can still arrive after navigation.
  useLayoutEffect(() => {
    const onScroll = () => {
      if (window.location.pathname === '/feed') rememberFeedScroll(window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen-dvh bg-background">
      {/* Sticky logo header — white halo follows the logo's own shape */}
      <header className="sticky top-0 z-40 w-full flex justify-center pt-2 pb-2 pointer-events-none bg-transparent">
        <img
          src="/pif-logo-long.png"
          alt="Pay it Forward"
          className="h-10 w-auto object-contain pointer-events-auto"
        />
      </header>


      <main
        className="pb-20"
        role="main"
        aria-label={t('feed.announcement')}
      >
        {/* Trello backlog: feed stretched full viewport width on desktop,
            making post images huge and the feed hard to scan. Map is
            deliberately full-width elsewhere (it needs the space) but the
            feed doesn't need to be.

            First pass matched Messages.tsx's bare `container` class -- but
            Tailwind's `container` (tailwind.config.ts) only actually caps
            width at the 2xl breakpoint (1400px); below that it's full
            width, so this alone didn't meaningfully narrow the feed on a
            typical laptop screen. User clarified: ALL pages except Map
            should share the SAME narrower width already used by
            Profile/AccountSettings (max-w-3xl, 768px) -- app-wide sweep,
            see Messages/Home/ItemDetail/PostFormContainer/PostEdit/
            ProfileEdit/Privacy for the matching changes. */}
        <div className="max-w-3xl mx-auto px-4 pt-1">
          {/* Creating a pif/wish lives in MainNav's "+" -- the feed's own
              shortcut buttons were removed with the toolbar cleanup. */}
          <div className="flex justify-end mb-2">
            <HowItWorksBanner />
          </div>
          <InstallInstructionsBanner />
          <LocationPermissionBanner />
          <FadeIn>
            <OptimizedFeedContainer />
          </FadeIn>
        </div>
      </main>
      <MainNav />
    </div>
  );
}
