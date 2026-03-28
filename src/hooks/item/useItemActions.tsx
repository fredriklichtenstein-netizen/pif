
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
    window.open(`https://facebook.com/share?url=${url}`, '_blank');
    toast({
      title: t('interactions.shared_facebook'),
      description: t('interactions.shared_facebook_description'),
    });
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
