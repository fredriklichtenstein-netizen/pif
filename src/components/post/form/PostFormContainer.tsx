
import React, { useState } from "react";
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
    { title: "Bilder", component: "images" },
    { title: "Detaljer", component: "details" },
    { title: "Beskrivning", component: "description" },
    { title: "Mått", component: "measurements" },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.item_type;
      case 1: return formData.images?.length > 0;
      case 2: return formData.title && formData.category && formData.condition && formData.coordinates;
      case 3: return formData.description;
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

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
            onDescriptionChange={(description) => setFormData({ ...formData, description })}
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

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 pb-20">
      <PostFormHeader 
        title={isRequest ? 'Önska något' : 'Piffa något'}
        subtitle={isRequest ? 'Berätta vad du behöver' : 'Ge bort något du inte behöver'}
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

      <form onSubmit={onFormSubmit} className="space-y-6">
        <Card className="p-6">
          {renderCurrentStep()}
        </Card>

        {/* Navigation buttons */}
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

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
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
              {isSubmitting ? 'Skapar...' : isRequest ? 'Skapa önskan' : 'Skapa PIF'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
