import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import { useEffect } from "react";
import { FadeIn } from "@/components/animation/FadeIn";
import { SlideIn } from "@/components/animation/SlideIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";
import { useTranslation } from "react-i18next";

export default function Feed() {
  const { announce } = useAnnouncement();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    announce(t('feed.announcement'));
  }, [announce, t]);

  return (
    <div className="min-h-screen bg-background">
      {/* Slim logo header */}
      <header className="w-full flex justify-center pt-3 pb-2 px-2">
        <img
          src="/pif-logo-long.png"
          alt="Pay it Forward"
          className="h-10 w-auto object-contain"
        />
      </header>

      <main
        className="px-2 sm:px-3 pb-28"
        role="main"
        aria-label={t('feed.announcement')}
      >
        <div className="max-w-2xl mx-auto">
          {/* Sticky compact action bar */}
          <SlideIn direction="down" delay={100}>
            <div className="sticky top-0 z-30 -mx-2 sm:-mx-3 px-2 sm:px-3 py-2 mb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => navigate("/post?type=offer")}
                  className="bg-pif-offer text-pif-offer-foreground hover:bg-pif-offer/90 h-9 px-2 text-sm font-medium"
                  aria-label={t('interactions.add_pif_button')}
                >
                  + {t('interactions.add_pif_short')} 🎁
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate("/post?type=request")}
                  className="bg-pif-wish text-pif-wish-foreground hover:bg-pif-wish/90 h-9 px-2 text-sm font-medium"
                  aria-label={t('interactions.add_wish_button')}
                >
                  + {t('interactions.add_wish_short')} ✨
                </Button>
              </div>
            </div>
          </SlideIn>

          <FadeIn>
            <OptimizedFeedContainer />
          </FadeIn>
        </div>
      </main>
      <MainNav />
    </div>
  );
}
