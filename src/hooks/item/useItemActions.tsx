
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

  const handleShare = async (itemId?: string) => {
    if (!await checkAuth("share this item")) return;
    const url = itemId
      ? `https://app.pif.community/item/${itemId}`
      : window.location.href;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Check out this item on PIF',
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({
        title: t('interactions.link_copied', 'Länk kopierad till urklipp!'),
      });
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      toast({
        title: t('interactions.sharing_failed', 'Kunde inte dela'),
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
