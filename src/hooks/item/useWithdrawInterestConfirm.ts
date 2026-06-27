import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ItemType } from "@/components/item/types";

interface UseWithdrawInterestConfirmArgs {
  showInterest: boolean;
  handleShowInterest: (note?: string) => void;
  itemType?: ItemType;
}

export interface WithdrawCopy {
  title: string;
  description: string;
  cancel: string;
  confirm: string;
}

/**
 * Shared confirm-wrap for withdrawing an active interest/offer.
 * Adding interest stays one-tap; withdrawing routes through an AlertDialog.
 * Copy branches on itemType so wishes show offer-appropriate wording.
 */
export function useWithdrawInterestConfirm({
  showInterest,
  handleShowInterest,
  itemType,
}: UseWithdrawInterestConfirmArgs) {
  const { t } = useTranslation();
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);

  const handleShowInterestWithConfirm = useCallback(
    (note?: string) => {
      if (showInterest) {
        setWithdrawConfirmOpen(true);
        return;
      }
      handleShowInterest(note);
    },
    [showInterest, handleShowInterest]
  );

  const confirmWithdrawInterest = useCallback(() => {
    setWithdrawConfirmOpen(false);
    handleShowInterest();
  }, [handleShowInterest]);

  const keyPrefix =
    itemType === "request" ? "interactions.withdraw_offer" : "interactions.withdraw_interest";

  const withdrawCopy: WithdrawCopy = {
    title: t(`${keyPrefix}_title`),
    description: t(`${keyPrefix}_description`),
    cancel: t(`${keyPrefix}_cancel`),
    confirm: t(`${keyPrefix}_confirm`),
  };

  return {
    withdrawConfirmOpen,
    setWithdrawConfirmOpen,
    handleShowInterestWithConfirm,
    confirmWithdrawInterest,
    withdrawCopy,
  };
}
