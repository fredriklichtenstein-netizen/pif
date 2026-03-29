
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DangerZone() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    console.log('handleDeleteAccount called');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Deleting user:', user?.id);
      if (!user) throw new Error('No authenticated user found');
      const { data, error } = await supabase.rpc('delete_own_account', { p_user_id: user.id });
      console.log('RPC result:', data, 'Error:', error);
      if (error) throw error;

      await supabase.auth.signOut();
      
      toast({
        title: t('settings.account_deletion_initiated'),
        description: t('settings.account_deletion_description'),
      });
      
      setShowDeleteDialog(false);
      navigate("/auth");
    } catch (error: any) {
      console.error("Error during account deletion:", error);
      toast({
        title: t('settings.error_deleting_account'),
        description: error.message || t('common.unexpected_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-destructive">{t('settings.delete_account')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.delete_account_description')}
        </p>
        
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={() => setShowDeleteDialog(true)}
        >
          {t('settings.delete_my_account')}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.delete_account_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">
              {t('settings.type_to_confirm')}
            </p>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={t('settings.delete_confirmation_placeholder')}
              className="border-destructive/50"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t('common.cancel')}</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmationText === "delete my account") {
                  handleDeleteAccount();
                } else {
                  toast({
                    title: t('settings.confirmation_mismatch'),
                    description: t('settings.confirmation_mismatch_description'),
                    variant: "destructive",
                  });
                }
              }}
              disabled={loading || confirmationText !== "delete my account"}
            >
              {loading ? t('settings.deleting') : t('settings.delete_account')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
