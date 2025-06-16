
import { useCallback } from "react";

interface PostFormValidationProps {
  formData: any;
  currentStep: number;
  steps: any[];
}

export function usePostFormValidation({ formData, currentStep, steps }: PostFormValidationProps) {
  const validateCurrentStep = useCallback(() => {
    console.log(`Validating step ${currentStep}:`, {
      stepName: steps[currentStep]?.title,
      formData: {
        item_type: formData.item_type,
        images: formData.images?.length,
        title: !!formData.title,
        category: !!formData.category,
        condition: !!formData.condition,
        coordinates: !!formData.coordinates,
        description: !!formData.description?.trim(),
      }
    });

    switch (currentStep) {
      case 0: // Type step
        return !!formData.item_type;
      case 1: // Images step
        return formData.images?.length > 0;
      case 2: // Details step
        return !!(formData.title?.trim() && formData.category && formData.condition && formData.coordinates);
      case 3: // Description step
        return !!formData.description?.trim();
      case 4: // Measurements/Preferences step
        return true; // This step is optional
      default:
        return false;
    }
  }, [currentStep, formData, steps]);

  const canProceed = useCallback(() => {
    const isValid = validateCurrentStep();
    console.log(`Can proceed from step ${currentStep}: ${isValid}`);
    return isValid;
  }, [validateCurrentStep, currentStep]);

  return {
    validateCurrentStep,
    canProceed
  };
}
