import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";

export function HowItWorksBanner() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-green-100 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-white transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        {t("home.how_it_works_banner")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-y-auto max-h-[85vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("home.how_it_works_title")}</DialogTitle>
          </DialogHeader>
          <HowItWorksSteps />
        </DialogContent>
      </Dialog>
    </>
  );
}
