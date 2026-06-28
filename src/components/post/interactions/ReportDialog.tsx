
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReportDialogProps {
  onReport: () => void;
}

export function ReportDialog({ onReport }: ReportDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger data-report-trigger className="hidden">
        {t("interactions.report_item_action")}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-primary">
            {t("interactions.report_item")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {t("interactions.report_item_description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onReport}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("interactions.report_item_action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
