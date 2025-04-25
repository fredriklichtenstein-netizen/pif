
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number | string;
  onReportSubmit?: () => void;
}

const REPORT_REASONS = [
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "spam", label: "Spam or misleading" },
  { id: "offensive", label: "Offensive content" },
  { id: "illegal", label: "Illegal content" },
  { id: "other", label: "Other" },
];

export function ReportDialog({ open, onOpenChange, itemId, onReportSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useGlobalAuth();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report items",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would implement the actual reporting logic to your backend
      // In a production app, this would save to a reports table
      console.log("Reporting item", {
        itemId,
        reason,
        details,
        userId: user.id,
      });
      
      // Wait to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast({
        title: "Report submitted",
        description: "Thank you for your report. We will review it shortly.",
      });
      
      if (onReportSubmit) {
        onReportSubmit();
      }
      
      onOpenChange(false);
      setReason("");
      setDetails("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report Item</AlertDialogTitle>
          <AlertDialogDescription>
            Please let us know why you're reporting this item. Our moderators will review your report.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-base font-medium">Reason for reporting</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
                {REPORT_REASONS.map((reportReason) => (
                  <div key={reportReason.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={reportReason.id} id={`reason-${reportReason.id}`} />
                    <Label htmlFor={`reason-${reportReason.id}`}>{reportReason.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="details" className="text-base font-medium">Additional details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional information that might help us understand the issue."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
