
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PostFormNavigationProps {
  currentStep: number;
  isOnFinalStep: boolean;
  canProceedNow: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
  isRequest: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export function PostFormNavigation({
  currentStep,
  isOnFinalStep,
  canProceedNow,
  isFormValid,
  isSubmitting,
  isRequest,
  onPrevStep,
  onNextStep
}: PostFormNavigationProps) {
  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 0}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka
      </Button>

      {!isOnFinalStep ? (
        <Button
          type="button"
          onClick={onNextStep}
          disabled={!canProceedNow}
        >
          Nästa
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? 'Skapar...' : isRequest ? 'Skapa önskning' : 'Skapa PIF'}
        </Button>
      )}
    </div>
  );
}
