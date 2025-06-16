
import React, { useState, useCallback } from "react";
import { PostFormSteps } from "./PostFormSteps";
import { PostFormHeader } from "./PostFormHeader";
import { PostFormImages } from "./PostFormImages";
import { PostFormDetails } from "./PostFormDetails";
import { PostFormDescription } from "./PostFormDescription";
import { PostFormMeasurements } from "./PostFormMeasurements";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

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
  const [currentStep, setCurrentStep] = useState(0);

  const isRequest = formData.item_type === 'request';

  const steps = [
    { title: "Typ", component: "steps" },
    { title: isRequest ? "Referensbild" : "Bilder", component: "images" },
    { title: "Detaljer", component: "details" },
    { title: "Beskrivning", component: "description" },
    { title: isRequest ? "Preferenser" : "Mått", component: "measurements" },
  ];

  // Explicit validation for each step
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

  // Enhanced canProceed with better validation
  const canProceed = useCallback(() => {
    const isValid = validateCurrentStep();
    console.log(`Can proceed from step ${currentStep}: ${isValid}`);
    return isValid;
  }, [validateCurrentStep, currentStep]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Enhanced form submit handler with explicit final step check
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Form submit attempted on step ${currentStep}, final step is ${steps.length - 1}`);
    
    // Only submit if we're explicitly on the last step (step 4 for 5 steps total)
    if (currentStep === steps.length - 1) {
      console.log('Submitting form from final step');
      onFormSubmit(e);
    } else {
      console.log('Preventing form submission - not on final step');
    }
  };

  // Enhanced description change handler with immediate state update
  const handleDescriptionChange = useCallback((description: string) => {
    console.log('Description changed:', description);
    setFormData({ ...formData, description });
  }, [formData, setFormData]);

  const renderCurrentStep = () => {
    switch (steps[currentStep].component) {
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
      case "details":
        return (
          <PostFormDetails
            formData={formData}
            onMeasurementChange={onMeasurementChange}
            setFormData={setFormData}
            onAddressSelect={onAddressSelect}
          />
        );
      case "description":
        return (
          <PostFormDescription
            description={formData.description || ""}
            onDescriptionChange={handleDescriptionChange}
            itemType={formData.item_type}
          />
        );
      case "measurements":
        return (
          <PostFormMeasurements
            category={formData.category || ""}
            measurements={formData.measurements || {}}
            onMeasurementChange={onMeasurementChange}
            itemType={formData.item_type}
          />
        );
      default:
        return null;
    }
  };

  // Check if we're on the final step
  const isOnFinalStep = currentStep === steps.length - 1;
  const canProceedNow = canProceed();

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 pb-20">
      <PostFormHeader 
        title={isRequest ? 'Önska något' : 'Piffa något'}
        subtitle={isRequest ? 'Beskriv vad du behöver och ditt sökområde' : 'Ge bort något du inte behöver'}
      />

      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 ${
                index < currentStep ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <Card className="p-6">
          {renderCurrentStep()}
        </Card>

        {/* Enhanced navigation buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>

          {!isOnFinalStep ? (
            <Button
              type="button"
              onClick={nextStep}
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

        {/* Debug information (remove in production) */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Steg: {currentStep + 1}/{steps.length} ({steps[currentStep]?.title}) | 
          Kan fortsätta: {canProceedNow ? 'Ja' : 'Nej'} | 
          Sista steget: {isOnFinalStep ? 'Ja' : 'Nej'}
        </div>
      </form>
    </div>
  );
}
