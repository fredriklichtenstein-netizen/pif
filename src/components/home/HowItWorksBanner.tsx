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
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-md ring-2 ring-primary/20 hover:bg-primary/90 transition-colors"
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
