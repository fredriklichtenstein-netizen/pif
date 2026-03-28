
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
  isSubmitting?: boolean;
  type: 'item' | 'user';
}

export function ReportDialog({ 
  open, 
  onClose, 
  onSubmit, 
  isSubmitting = false,
  type 
}: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const { t } = useTranslation();

  const reasonKeys = {
    item: [
      { key: "interactions.report_reason_inappropriate_content" },
      { key: "interactions.report_reason_spam" },
      { key: "interactions.report_reason_misleading" },
      { key: "interactions.report_reason_not_suitable" },
      { key: "interactions.report_reason_other" },
    ],
    user: [
      { key: "interactions.report_reason_inappropriate_behavior" },
      { key: "interactions.report_reason_harassment" },
      { key: "interactions.report_reason_spam" },
      { key: "interactions.report_reason_fraud" },
      { key: "interactions.report_reason_other" },
    ]
  };

  const handleSubmit = () => {
    if (reason) {
      onSubmit(reason, description.trim() || undefined);
      setReason("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>{type === 'item' ? t('interactions.report_item') : t('interactions.report_user')}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{t('interactions.report_reason')}</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
              {reasonKeys[type].map((r) => {
                const label = t(r.key);
                return (
                  <div key={r.key} className="flex items-center space-x-2">
                    <RadioGroupItem value={label} id={r.key} />
                    <Label htmlFor={r.key} className="text-sm">{label}</Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">{t('interactions.report_additional_info')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('interactions.report_describe')}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('interactions.cancel')}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!reason || isSubmitting}
              variant="destructive"
              className="flex-1"
            >
              {isSubmitting ? t('interactions.reporting') : t('interactions.report_submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
