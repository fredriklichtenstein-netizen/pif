
import { useState, useCallback } from "react";

interface PostFormNavigationProps {
  steps: any[];
  canProceed: () => boolean;
}

export function usePostFormNavigation({ steps, canProceed }: PostFormNavigationProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    // Add a small delay to ensure state has updated
    setTimeout(() => {
      const canGoNext = canProceed();
      if (currentStep < steps.length - 1 && canGoNext) {
        setCurrentStep(currentStep + 1);
      } else {
      }
    }, 100);
  }, [currentStep, steps.length, canProceed]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const isOnFinalStep = currentStep === steps.length - 1;

  return {
    currentStep,
    nextStep,
    prevStep,
    isOnFinalStep
  };
}
