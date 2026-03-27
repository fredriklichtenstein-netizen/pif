import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  MoreHorizontal, 
  User,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";

interface ExpandedNavProps {
  className?: string;
}

export const ExpandedNav = ({ className }: ExpandedNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const additionalPages = [
    { 
      path: "/profile", 
      icon: User, 
      labelKey: "nav.profile",
      descriptionKey: "profile.edit_profile"
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center p-1 ${className}`}
        >
          <MoreHorizontal size={24} />
          <span className="text-xs mt-1">{t('nav.more')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-lg">
        <SheetHeader>
          <SheetTitle className="text-left">{t('nav.explore_more')}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 mt-6">
          {additionalPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.path}
                to={page.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-accent ${
                  isActive(page.path) ? "bg-primary/10 border-primary/30" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive(page.path) ? "bg-primary/20" : "bg-muted"
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isActive(page.path) ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      isActive(page.path) ? "text-primary" : "text-foreground"
                    }`}>
                      {t(page.labelKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t(page.descriptionKey)}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
