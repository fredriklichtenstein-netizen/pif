
import React, { useCallback } from "react";
import { PostFormSteps } from "./PostFormSteps";
import { PostFormHeader } from "./PostFormHeader";
import { PostFormImages } from "./PostFormImages";
import { PostFormInformation } from "./PostFormInformation";
import { PostFormLocation } from "./PostFormLocation";
import { PostFormProgress } from "./PostFormProgress";
import { PostFormNavigation } from "./PostFormNavigation";
import { Card } from "@/components/ui/card";
import { usePostFormValidation } from "@/hooks/post/usePostFormValidation";
import { usePostFormNavigation } from "@/hooks/post/usePostFormNavigation";

interface PostFormContainerProps {
  formData: any;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  onImageUpload: (file: File) => void;
  onImagesChange: (images: string[]) => void;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (data: any) => void;
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  isFormValid: boolean;
}

export function PostFormContainer({
  formData,
  isSubmitting,
  isAnalyzing,
  onFormSubmit,
  onImageUpload,
  onImagesChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
  isFormValid,
}: PostFormContainerProps) {
  const isRequest = formData.item_type === 'request';

  const steps = [
    { title: "Typ", component: "steps" },
    { title: isRequest ? "Referensbild" : "Bilder", component: "images" },
    { title: "Information", component: "information" },
    { title: isRequest ? "Sökområde" : "Plats", component: "location" },
  ];

  // Initialize navigation first
  const { currentStep, nextStep, prevStep, isOnFinalStep } = usePostFormNavigation({
    steps,
    canProceed: () => false // Temporary, will be updated below
  });

  // Now create validation with current step
  const validation = usePostFormValidation({
    formData,
    currentStep,
    steps
  });

  // Update navigation with the real canProceed function
  const { currentStep: finalCurrentStep, nextStep: finalNextStep, prevStep: finalPrevStep, isOnFinalStep: finalIsOnFinalStep } = usePostFormNavigation({
    steps,
    canProceed: validation.canProceed
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Form submit attempted on step ${finalCurrentStep}, final step is ${steps.length - 1}`);
    
    if (finalCurrentStep === steps.length - 1) {
      console.log('Submitting form from final step');
      onFormSubmit(e);
    } else {
      console.log('Preventing form submission - not on final step');
    }
  };

  const renderCurrentStep = () => {
    switch (steps[finalCurrentStep].component) {
      case "steps":
        return (
          <PostFormSteps
            formData={formData}
            setFormData={setFormData}
          />
        );
      case "images":
        return (
          <PostFormImages
            images={formData.images || []}
            isAnalyzing={isAnalyzing}
            onImageUpload={handleImageUpload}
            onImagesChange={onImagesChange}
            itemType={formData.item_type}
          />
        );
      case "information":
        return (
          <PostFormInformation
            formData={formData}
            setFormData={setFormData}
            onMeasurementChange={onMeasurementChange}
          />
        );
      case "location":
        return (
          <PostFormLocation
            formData={formData}
            setFormData={setFormData}
            onAddressSelect={onAddressSelect}
          />
        );
      default:
        return null;
    }
  };

  const canProceedNow = validation.canProceed();

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 pb-20">
      <PostFormHeader 
        title={isRequest ? 'Önska något' : 'Piffa något'}
        subtitle={isRequest ? 'Beskriv vad du behöver och ditt sökområde' : 'Ge bort något du inte behöver'}
      />

      <PostFormProgress steps={steps} currentStep={finalCurrentStep} />

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <Card className="p-6">
          {renderCurrentStep()}
        </Card>

        <PostFormNavigation
          currentStep={finalCurrentStep}
          isOnFinalStep={finalIsOnFinalStep}
          canProceedNow={canProceedNow}
          isFormValid={isFormValid}
          isSubmitting={isSubmitting}
          isRequest={isRequest}
          onPrevStep={finalPrevStep}
          onNextStep={finalNextStep}
        />
      </form>
    </div>
  );
}
