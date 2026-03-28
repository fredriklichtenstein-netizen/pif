
import React from "react";
import { useTranslation } from "react-i18next";

interface ImageFormTipsProps {
  isRequest: boolean;
  hasImages: boolean;
}

export function ImageFormTips({ isRequest, hasImages }: ImageFormTipsProps) {
  const { t } = useTranslation();

  if (!hasImages) return null;

  return (
    <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
      <p><strong>{t('post.tip_label')}</strong> {isRequest ? t('interactions.image_tips_request') : t('interactions.image_tips_offer')}</p>
    </div>
  );
}
