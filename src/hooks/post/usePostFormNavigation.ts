
import { useState, useCallback } from "react";

interface PostFormNavigationProps {
  steps: any[];
  /** Receives the step index to validate. Taking it as an argument (rather
   * than closing over the hook's own currentStep) is what lets the caller use
   * a SINGLE navigation instance — previously the circular dependency was
   * worked around by creating two, and validation was wired to the throwaway
   * one that never advanced past step 0. */
  canProceed: (stepIndex: number) => boolean;
}

export function usePostFormNavigation({ steps, canProceed }: PostFormNavigationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);

  const nextStep = useCallback(() => {
    setTimeout(() => {
      const canGoNext = canProceed(currentStep);
      if (currentStep < steps.length - 1 && canGoNext) {
        const next = currentStep + 1;
        setCurrentStep(next);
        setMaxVisitedStep((m) => Math.max(m, next));
      }
    }, 100);
  }, [currentStep, steps.length, canProceed]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return;
    if (index <= maxVisitedStep) {
      setCurrentStep(index);
    }
  }, [maxVisitedStep, steps.length]);

  const isOnFinalStep = currentStep === steps.length - 1;

  return {
    currentStep,
    maxVisitedStep,
    nextStep,
    prevStep,
    goToStep,
    isOnFinalStep
  };
}
