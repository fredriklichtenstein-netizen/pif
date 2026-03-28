
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function useInterestSelection() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleSelectReceiver = async (interestId: number, itemId: number) => {
    setConfirmDialogOpen(false);
    try {
      await supabase
        .from("interests")
        .update({ status: "selected", selected_at: new Date().toISOString() })
        .eq("id", interestId);
        
      await supabase
        .from("interests")
        .update({ status: "not_selected" })
        .eq("item_id", itemId)
        .neq("id", interestId);
        
      toast({
        title: t('interactions.receiver_selected_success'),
        description: t('interactions.receiver_selected_success_description'),
      });

      return true;
    } catch (err) {
      console.error("Error selecting receiver:", err);
      toast({
        variant: "destructive",
        title: t('interactions.error_title'),
        description: t('interactions.receiver_select_error'),
      });
      return false;
    }
  };

  return {
    selectedUserId,
    setSelectedUserId,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleSelectReceiver
  };
}
