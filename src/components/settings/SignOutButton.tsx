
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: t('settings.error_signing_out'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline"
      className="border-destructive text-destructive hover:bg-destructive/10 w-full"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? t('settings.signing_out') : t('settings.sign_out')}
    </Button>
  );
}
