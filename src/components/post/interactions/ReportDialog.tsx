
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReportDialogProps {
  onReport: () => void;
}

export function ReportDialog({ onReport }: ReportDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger data-report-trigger className="hidden">
        Report
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-primary">
            Report this item
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to report this item? This action cannot be undone.
            Our moderators will review the item and take appropriate action.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onReport}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Report Item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
