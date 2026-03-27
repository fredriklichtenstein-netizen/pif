
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function PrivacySettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const requestDataExport = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      toast({
        title: t('settings.data_export_requested'),
        description: t('settings.data_export_requested_description'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('settings.privacy_policies')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.privacy_policies_description')}
        </p>
        <div className="space-y-2">
          <a 
            href="#privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            {t('settings.privacy_policy')} <ExternalLink className="ml-1 h-4 w-4" />
          </a>
          <a 
            href="#terms-of-service" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            {t('settings.terms_of_service')} <ExternalLink className="ml-1 h-4 w-4" />
          </a>
          <a 
            href="#cookie-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            {t('settings.cookie_policy')} <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('settings.your_data')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.your_data_description')}
        </p>
        
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
          onClick={requestDataExport}
          disabled={loading}
        >
          <Download className="h-4 w-4" />
          {loading ? t('settings.requesting_export') : t('settings.request_data_export')}
        </Button>
      </div>
    </div>
  );
}
