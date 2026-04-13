
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthCheck } from "../item/utils/authCheck";
import { useTranslation } from "react-i18next";

export const useItemActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuth } = useAuthCheck();
  const { t } = useTranslation();

  const handleMessage = async (e: React.MouseEvent, itemId?: string, ownerId?: string) => {
    if (!await checkAuth("message the owner")) {
      e.preventDefault();
      return;
    }
  };

  const handleShare = async () => {
    if (!await checkAuth("share this item")) return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t('interactions.link_copied', 'Länk kopierad'),
        description: t('interactions.link_copied_description', 'Länken har kopierats till urklipp'),
      });
    } catch {
      toast({
        title: t('interactions.sharing_failed', 'Kunde inte kopiera'),
        description: url,
        variant: "destructive",
      });
    }
  };

  const handleReport = async () => {
    if (!await checkAuth("report this item")) return;
    toast({
      title: t('interactions.item_reported'),
      description: t('interactions.item_reported_description'),
    });
  };

  return { handleMessage, handleShare, handleReport };
};
