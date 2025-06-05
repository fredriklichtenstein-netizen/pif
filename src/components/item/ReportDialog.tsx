
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

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

  const reasons = {
    item: [
      "Otillåtet innehåll",
      "Spam eller skräp",
      "Vilseledande information",
      "Olämpligt för plattformen",
      "Annat"
    ],
    user: [
      "Olämpligt beteende",
      "Trakasserier",
      "Spam",
      "Bedrägeri",
      "Annat"
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
            <span>Rapportera {type === 'item' ? 'inlägg' : 'användare'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Anledning</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
              {reasons[type].map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="text-sm">{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">Ytterligare information (valfritt)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv problemet mer detaljerat..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Avbryt
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!reason || isSubmitting}
              variant="destructive"
              className="flex-1"
            >
              {isSubmitting ? "Rapporterar..." : "Rapportera"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
