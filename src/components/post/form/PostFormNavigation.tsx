
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 0}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('post.previous')}
      </Button>

      {!isOnFinalStep ? (
        <Button
          type="button"
          onClick={onNextStep}
          disabled={!canProceedNow}
        >
          {t('post.next')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? t('post.creating') : isRequest ? t('post.create_request_final') : t('post.create_offer_final')}
        </Button>
      )}
    </div>
  );
}
