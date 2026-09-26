import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { WithdrawCopy } from "@/hooks/item/useWithdrawInterestConfirm";

interface WithdrawInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment?: string) => void;
  copy: WithdrawCopy;
}

export function WithdrawInterestDialog({
  open,
  onOpenChange,
  onConfirm,
  copy,
}: WithdrawInterestDialogProps) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");

  // Start blank every time the dialog opens rather than carrying over a
  // draft from a previous withdrawal (of a different item, potentially).
  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("interactions.withdraw_comment_placeholder")}
          maxLength={500}
          rows={3}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(comment)}>
            {copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
