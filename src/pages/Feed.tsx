
import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { Gift, Star, Plus } from "lucide-react";
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
      <MainHeader />
      <Separator />

      <main className="container mx-auto px-4 py-6" role="main" aria-label={t('feed.announcement')}>
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <header className="mb-4">
              <SlideIn direction="down">
                <h1 className="text-2xl font-bold text-foreground mb-2">{t('feed.title')}</h1>
              </SlideIn>
              <SlideIn direction="down" delay={100}>
                <p className="text-muted-foreground">{t('feed.subtitle')}</p>
              </SlideIn>
            </header>
          </FadeIn>

          {/* Sticky action bar — keeps "Add pif" / "Add wish" one tap away while scrolling. */}
          <SlideIn direction="down" delay={150}>
            <div className="sticky top-0 z-30 -mx-4 px-4 py-3 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/post?type=offer")}
                  className="border-pif-offer text-pif-offer hover:bg-pif-offer hover:text-pif-offer-foreground bg-background"
                  aria-label={t('interactions.add_pif_button')}
                >
                  <Gift className="h-4 w-4 mr-1" aria-hidden="true" />
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  {t('interactions.add_pif_button')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/post?type=request")}
                  className="border-pif-wish text-pif-wish hover:bg-pif-wish hover:text-pif-wish-foreground bg-background"
                  aria-label={t('interactions.add_wish_button')}
                >
                  <Star className="h-4 w-4 mr-1" aria-hidden="true" />
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  {t('interactions.add_wish_button')}
                </Button>
              </div>
            </div>
          </SlideIn>

          <SlideIn direction="up" delay={200}>
            <OptimizedFeedContainer />
          </SlideIn>
        </div>
      </main>
      <MainNav />
    </div>
  );
}
