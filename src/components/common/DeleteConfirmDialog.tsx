
import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, isSoftDelete: boolean) => Promise<void>;
  title: string;
  description: string;
  hasInterestedUsers?: boolean;
  interestCount?: number;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  hasInterestedUsers = false,
  interestCount = 0,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteType, setDeleteType] = useState<"permanent" | "archive">("archive");
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onConfirm(deleteReason, deleteType === "archive");
      
      toast({
        title: deleteType === "archive" ? "Item archived" : "Item deleted",
        description: deleteType === "archive" 
          ? "The item has been archived and can be restored later" 
          : "The item has been permanently deleted",
      });
      
      onClose();
    } catch (error) {
      console.error("Error during deletion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>{description}</p>
            
            {hasInterestedUsers && (
              <div className="my-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  This item has {interestCount} {interestCount === 1 ? "user" : "users"} interested in it. 
                  They will be notified when you delete this item.
                </p>
              </div>
            )}

            <div className="space-y-3 mt-4">
              <div>
                <Label htmlFor="delete-reason">Why are you removing this item? (optional)</Label>
                <Textarea 
                  id="delete-reason"
                  placeholder="e.g., No longer available, found a recipient, etc."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <RadioGroup value={deleteType} onValueChange={(value) => setDeleteType(value as "permanent" | "archive")}>
                <div className="flex items-start space-x-2 mb-2">
                  <RadioGroupItem value="archive" id="archive" />
                  <div>
                    <Label htmlFor="archive" className="font-medium">Archive instead</Label>
                    <p className="text-sm text-muted-foreground">Hide the item but keep it in your profile. You can restore it later.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="permanent" id="permanent" />
                  <div>
                    <Label htmlFor="permanent" className="font-medium">Permanently delete</Label>
                    <p className="text-sm text-muted-foreground">Remove the item completely. This cannot be undone.</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>{deleteType === "archive" ? "Archive Item" : "Delete Item"}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
