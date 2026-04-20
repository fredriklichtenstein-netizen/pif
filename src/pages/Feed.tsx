
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
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main" aria-label={t('feed.announcement')}>
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <header className="mb-6">
              <SlideIn direction="down">
                <h1 className="text-2xl font-bold text-foreground mb-2">{t('feed.title')}</h1>
              </SlideIn>
              <SlideIn direction="down" delay={100}>
                <p className="text-muted-foreground">{t('feed.subtitle')}</p>
              </SlideIn>
              <SlideIn direction="down" delay={150}>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/post?type=offer")}
                    className="border-pif-offer text-pif-offer hover:bg-pif-offer hover:text-pif-offer-foreground"
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
                    className="border-pif-wish text-pif-wish hover:bg-pif-wish hover:text-pif-wish-foreground"
                    aria-label={t('interactions.add_wish_button')}
                  >
                    <Star className="h-4 w-4 mr-1" aria-hidden="true" />
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    {t('interactions.add_wish_button')}
                  </Button>
                </div>
              </SlideIn>
            </header>
          </FadeIn>
          
          <SlideIn direction="up" delay={200}>
            <OptimizedFeedContainer />
          </SlideIn>
        </div>
      </main>
      <MainNav />
    </div>
  );
}
