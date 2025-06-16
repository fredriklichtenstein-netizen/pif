
import { useState, useCallback } from "react";

interface PostFormNavigationProps {
  steps: any[];
  canProceed: () => boolean;
}

export function usePostFormNavigation({ steps, canProceed }: PostFormNavigationProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    console.log(`Next step requested from step ${currentStep}`);
    
    // Add a small delay to ensure state has updated
    setTimeout(() => {
      const canGoNext = canProceed();
      console.log(`After delay - can proceed: ${canGoNext}`);
      
      if (currentStep < steps.length - 1 && canGoNext) {
        console.log(`Moving to step ${currentStep + 1}`);
        setCurrentStep(currentStep + 1);
      } else {
        console.log(`Cannot proceed: currentStep=${currentStep}, maxStep=${steps.length - 1}, canProceed=${canGoNext}`);
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
