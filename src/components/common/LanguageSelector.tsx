
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useState } from 'react';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const changeLanguage = async (lng: string) => {
    if (lng === i18n.language) return;
    
    setIsChanging(true);
    try {
      await i18n.changeLanguage(lng);
      localStorage.setItem('language', lng);
      
      // Force a complete re-render of the app
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChanging(false);
    }
  };

  const getCurrentLanguageDisplay = () => {
    return i18n.language === 'sv' ? 'Svenska' : 'English';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" disabled={isChanging}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isChanging ? '...' : getCurrentLanguageDisplay()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('sv')} disabled={i18n.language === 'sv'}>
          🇸🇪 {t('language.swedish')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>
          🇺🇸 {t('language.english')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
