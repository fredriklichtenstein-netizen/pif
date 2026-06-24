
import type { PostFormData } from "@/types/post";

export type PostFieldKey = 'item_type' | 'images' | 'title' | 'category' | 'condition' | 'location';

export interface PostFieldError {
  field: PostFieldKey;
  /** i18n key under `post.validation.*` */
  messageKey: string;
}

interface UsePostFormValidationProps {
  formData: PostFormData;
  currentStep: number;
  steps: any[];
}

function collectStepErrors(
  formData: PostFormData,
  stepComponent: string | undefined,
): PostFieldError[] {
  const errors: PostFieldError[] = [];
  switch (stepComponent) {
    case "steps":
      if (!formData.item_type) errors.push({ field: 'item_type', messageKey: 'post.validation.item_type_required' });
      break;
    case "images":
      if (!formData.images || formData.images.length === 0) {
        errors.push({ field: 'images', messageKey: 'post.validation.images_required' });
      }
      break;
    case "information":
      if (!formData.title?.trim()) errors.push({ field: 'title', messageKey: 'post.validation.title_required' });
      if (!formData.category) errors.push({ field: 'category', messageKey: 'post.validation.category_required' });
      if (!formData.condition) errors.push({ field: 'condition', messageKey: 'post.validation.condition_required' });
      break;
    case "location":
      if (!formData.location || !formData.coordinates) {
        errors.push({ field: 'location', messageKey: 'post.validation.location_required' });
      }
      break;
  }
  return errors;
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
    return collectStepErrors(formData, steps[currentStep].component).length === 0;
  };

  const getStepErrors = (
    formData: PostFormData,
    currentStep: number,
    steps: any[],
  ): PostFieldError[] => {
    if (!steps[currentStep]) return [];
    return collectStepErrors(formData, steps[currentStep].component);
  };

  const canProceed = (): boolean => {
    if (!props) return false;
    return validateCurrentStep(props.formData, props.currentStep, props.steps);
  };

  const currentStepErrors = (): PostFieldError[] => {
    if (!props) return [];
    return getStepErrors(props.formData, props.currentStep, props.steps);
  };

  return {
    validateForm,
    validateCurrentStep,
    getStepErrors,
    canProceed,
    currentStepErrors,
  };
}
