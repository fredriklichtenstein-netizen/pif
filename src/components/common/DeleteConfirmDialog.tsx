import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, isSoftDelete: boolean) => void;
  title: string;
  description: string;
  hasInterestedUsers?: boolean;
  interestCount?: number;
  isLoading?: boolean;
  isLoadingInterested?: boolean;
}
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  hasInterestedUsers = false,
  interestCount = 0,
  isLoading = false,
  isLoadingInterested = false
}: DeleteConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [isSoftDelete, setIsSoftDelete] = useState(true);
  const handleConfirm = () => {
    onConfirm(reason, isSoftDelete);
  };
  return <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {isLoadingInterested ? <div className="space-y-2 my-4">
            <p className="text-sm text-gray-500 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking if anyone is interested in this item...
            </p>
            <Skeleton className="h-4 w-3/4" />
          </div> : hasInterestedUsers && <div className="mb-4">
            <p className="text-sm text-amber-600 font-medium">
              Warning: {interestCount} {interestCount === 1 ? 'person is' : 'people are'} interested in this item.
            </p>
            <p className="text-sm text-gray-500">They will be notified if you proceed.</p>
          </div>}

        <div className="mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="soft-delete" checked={isSoftDelete} onCheckedChange={checked => setIsSoftDelete(Boolean(checked))} />
              <Label htmlFor="soft-delete" className="cursor-pointer">
                Archive instead of permanently delete
              </Label>
            </div>
            <p className="text-xs text-gray-500 pl-6">
              {isSoftDelete ? "The item will be archived and can be restored later." : "The item will be permanently deleted and cannot be recovered."}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="delete-reason">Reason (optional)</Label>
          <Textarea id="delete-reason" placeholder={isSoftDelete ? "Why are you archiving this item?" : "Why are you deleting this item?"} value={reason} onChange={e => setReason(e.target.value)} className="mt-1" />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700" disabled={isLoading || isLoadingInterested}>
            {isLoading ? <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </> : isSoftDelete ? "Archive" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
}