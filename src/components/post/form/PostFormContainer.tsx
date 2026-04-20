
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PostFormSteps } from "./PostFormSteps";
import { PostFormHeader } from "./PostFormHeader";
import { PostFormImages } from "./PostFormImages";
import { PostFormInformation } from "./PostFormInformation";
import { PostFormLocation } from "./PostFormLocation";
import { PostFormProgress } from "./PostFormProgress";
import { PostFormNavigation } from "./PostFormNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePostFormValidation } from "@/hooks/post/usePostFormValidation";
import { usePostFormNavigation } from "@/hooks/post/usePostFormNavigation";
import { useTranslation } from 'react-i18next';

interface PostFormContainerProps {
  formData: any;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  isEditMode?: boolean;
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
  isEditMode = false,
  onFormSubmit,
  onImageUpload,
  onImagesChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
  isFormValid,
}: PostFormContainerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const isRequest = formData.item_type === 'request';

  const steps = [
    { title: t('post.step_type'), component: "steps" },
    { title: isRequest ? t('post.step_reference_image') : t('post.step_images'), component: "images" },
    { title: t('post.step_information'), component: "information" },
    { title: isRequest ? t('post.step_search_area') : t('post.step_location'), component: "location" },
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
    if (finalCurrentStep === steps.length - 1) {
      onFormSubmit(e);
    } else {
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    navigate("/feed");
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
      <div className="relative">
        <PostFormHeader
          title={isRequest ? t('post.create_request') : t('post.create_offer')}
          subtitle={isRequest ? t('post.request_subtitle') : t('post.offer_subtitle')}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setCancelDialogOpen(true)}
          aria-label={t('post.cancel_button_aria')}
          className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

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
          isEditMode={isEditMode}
          onPrevStep={finalPrevStep}
          onNextStep={finalNextStep}
          onCancel={() => setCancelDialogOpen(true)}
        />
      </form>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('post.cancel_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('post.cancel_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('post.cancel_keep_editing')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              {t('post.cancel_discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
