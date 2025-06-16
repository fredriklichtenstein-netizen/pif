
import type { PostFormData } from "@/types/post";

interface UsePostFormValidationProps {
  formData: PostFormData;
  currentStep: number;
  steps: any[];
}

export function usePostFormValidation(props?: UsePostFormValidationProps) {
  const validateForm = (formData: PostFormData): boolean => {
    return !!(
      formData.title?.trim() &&
      formData.category &&
      formData.condition &&
      formData.coordinates &&
      formData.images.length > 0
    );
  };

  const validateCurrentStep = (formData: PostFormData, currentStep: number, steps: any[]): boolean => {
    if (!steps[currentStep]) return false;
    
    const stepComponent = steps[currentStep].component;
    
    switch (stepComponent) {
      case "steps":
        return !!(formData.item_type);
      case "images":
        return formData.images.length > 0;
      case "details":
        return !!(formData.title?.trim() && formData.category && formData.condition && formData.coordinates);
      case "description":
        return !!(formData.description?.trim());
      case "measurements":
        return true; // Measurements are optional
      default:
        return false;
    }
  };

  const canProceed = (): boolean => {
    if (!props) return false;
    return validateCurrentStep(props.formData, props.currentStep, props.steps);
  };

  return {
    validateForm,
    validateCurrentStep,
    canProceed,
  };
}
