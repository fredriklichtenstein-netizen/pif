
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useItemOperations } from "@/hooks/item/useItemOperations";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export interface SimpleDeleteDialogProps {
  itemId: string | number;
  itemTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (operationType?: OperationType) => void;
  isArchived?: boolean;
  /** When true (feed context), only allow archiving — no permanent delete option. */
  archiveOnly?: boolean;
}

export function SimpleDeleteDialog({
  itemId,
  itemTitle,
  isOpen,
  onClose,
  onSuccess,
  isArchived = false,
  archiveOnly = false,
}: SimpleDeleteDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  // For archived items the checkbox toggles "restore vs delete". For normal items
  // it toggles "archive vs permanently delete" — but in archiveOnly mode it is forced to archive.
  const [isSoftDelete, setIsSoftDelete] = useState(true);
  const [interestedCount, setInterestedCount] = useState(0);
  const [showInterestInfo, setShowInterestInfo] = useState(false);

  const {
    isProcessing,
    error,
    checkInterestedCount,
    archiveItem,
    deleteItem,
    restoreItem,
  } = useItemOperations({
    onSuccess: (operationType?: OperationType) => {
      onClose();
      if (onSuccess) onSuccess(operationType);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsSoftDelete(!isArchived || archiveOnly ? true : true);
      setShowInterestInfo(false);

      if (!isArchived) {
        checkInterestedCount(itemId)
          .then((count) => {
            setInterestedCount(count);
            if (count > 0) setShowInterestInfo(true);
          })
          .catch((err) => console.error("Failed to check interest count:", err));
      }
    }
  }, [isOpen, itemId, checkInterestedCount, isArchived, archiveOnly]);

  const handleConfirm = async () => {
    if (isArchived) {
      if (isSoftDelete) {
        await restoreItem(itemId);
      } else {
        await deleteItem(itemId, reason);
      }
    } else {
      // archiveOnly forces archive, regardless of checkbox state
      if (archiveOnly || isSoftDelete) {
        await archiveItem(itemId, reason);
      } else {
        await deleteItem(itemId, reason);
      }
    }
  };

  const getDialogTitle = () => {
    if (isArchived) return isSoftDelete ? t('interactions.restore') : t('interactions.delete_permanently');
    if (archiveOnly) return t('interactions.archive_only_dialog_title');
    return t('interactions.delete') ?? "Delete Item";
  };

  const getDialogDescription = () => {
    if (isArchived) {
      return isSoftDelete
        ? t('interactions.item_restored_description')
        : t('interactions.delete_archived_confirm_description');
    }
    if (archiveOnly) return t('interactions.archive_only_dialog_description');
    return isSoftDelete
      ? "You can archive this item to hide it. You can restore it later."
      : "Are you sure you want to permanently delete this item? This action cannot be undone.";
  };

  const showArchiveCheckbox = !isArchived && !archiveOnly;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>
        )}

        {showInterestInfo && interestedCount > 0 && (
          <div className="text-amber-600 text-sm font-medium">
            <p>Warning: {interestedCount} {interestedCount === 1 ? 'person is' : 'people are'} interested in this item.</p>
            <p className="text-muted-foreground font-normal">They will be notified if you proceed.</p>
          </div>
        )}

        {showArchiveCheckbox && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="soft-delete"
              checked={isSoftDelete}
              onCheckedChange={(checked) => setIsSoftDelete(!!checked)}
              disabled={isProcessing}
            />
            <Label htmlFor="soft-delete" className="cursor-pointer">
              Archive instead of permanently delete
            </Label>
          </div>
        )}

        {isArchived && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="restore-item"
              checked={isSoftDelete}
              onCheckedChange={(checked) => setIsSoftDelete(!!checked)}
              disabled={isProcessing}
            />
            <Label htmlFor="restore-item" className="cursor-pointer">
              {t('interactions.restore')}
            </Label>
          </div>
        )}

        {(!isArchived && !archiveOnly && !isSoftDelete) || (isArchived && !isSoftDelete) ? (
          <div>
            <Label htmlFor="delete-reason">Reason (optional)</Label>
            <Textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              disabled={isProcessing}
            />
          </div>
        ) : null}

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            {t('interactions.cancel')}
          </Button>
          <Button
            type="button"
            variant={(archiveOnly || (isSoftDelete && !isArchived)) ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />...</>
            ) : isArchived
              ? (isSoftDelete ? t('interactions.restore') : t('interactions.delete_permanently'))
              : (archiveOnly || isSoftDelete ? t('interactions.status_archived') : t('interactions.delete_permanently'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
