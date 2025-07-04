import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  MoreHorizontal, 
  Gamepad2, 
  BarChart3, 
  Shield, 
  Users,
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
      path: "/gamification", 
      icon: Gamepad2, 
      label: "Rewards & Achievements",
      description: "Track your progress and earn badges"
    },
    { 
      path: "/analytics", 
      icon: BarChart3, 
      label: "Analytics Dashboard",
      description: "View community insights and trends"
    },
    { 
      path: "/security", 
      icon: Shield, 
      label: "Security Center",
      description: "Manage 2FA and security settings"
    },
    { 
      path: "/profile", 
      icon: User, 
      label: "My Profile",
      description: "View and edit your profile"
    },
    { 
      path: "/community", 
      icon: Users, 
      label: "Community Hub",
      description: "Discover people, challenges, and stories"
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
          <span className="text-xs mt-1">More</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-lg">
        <SheetHeader>
          <SheetTitle className="text-left">Explore More Features</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 mt-6">
          {additionalPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.path}
                to={page.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                  isActive(page.path) ? "bg-blue-50 border-blue-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive(page.path) ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isActive(page.path) ? "text-blue-600" : "text-gray-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${
                      isActive(page.path) ? "text-blue-900" : "text-gray-900"
                    }`}>
                      {page.label}
                    </h3>
                    <p className="text-sm text-gray-600">{page.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};