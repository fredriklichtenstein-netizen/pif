
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  profileDefaults?: import("@/types/post").PickupProfileDefaults;
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
  const [searchParams] = useSearchParams();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const isRequest = formData.item_type === 'request';
  // When the user deep-links from the feed buttons with ?type=offer|request,
  // skip the type-picker step entirely so they land directly on images.
  const deepLinkedType = searchParams.get('type');
  const skipTypeStep = deepLinkedType === 'offer' || deepLinkedType === 'request';

  const steps = [
    ...(skipTypeStep ? [] : [{ title: t('post.step_type'), component: "steps" }]),
    { title: isRequest ? t('post.step_reference_image') : t('post.step_images'), component: "images" },
    { title: t('post.step_information'), component: "information" },
    { title: isRequest ? t('post.step_search_area') : t('post.step_location'), component: "location" },
  ];

  // Initialize navigation first
  const { currentStep, nextStep, prevStep, isOnFinalStep, maxVisitedStep, goToStep } = usePostFormNavigation({
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
  const {
    currentStep: finalCurrentStep,
    nextStep: finalNextStep,
    prevStep: finalPrevStep,
    isOnFinalStep: finalIsOnFinalStep,
    maxVisitedStep: finalMaxVisited,
    goToStep: finalGoToStep,
  } = usePostFormNavigation({
    steps,
    canProceed: validation.canProceed
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Inline validation surface: only show errors after the user attempts to
  // advance/submit. Cleared whenever the active step changes.
  const [showErrors, setShowErrors] = useState(false);
  useEffect(() => { setShowErrors(false); }, [finalCurrentStep]);

  const stepErrors = validation.currentStepErrors();
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const err of stepErrors) {
    fieldErrors[err.field] = t(err.messageKey);
  }

  const scrollToFirstError = () => {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-post-error="true"]') as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = el.querySelector('input, textarea, select, button') as HTMLElement | null;
        focusable?.focus();
      }
    });
  };

  const attemptNext = () => {
    if (validation.canProceed()) {
      setShowErrors(false);
      finalNextStep();
    } else {
      setShowErrors(true);
      scrollToFirstError();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalCurrentStep !== steps.length - 1) return;
    if (!isFormValid || !validation.canProceed()) {
      setShowErrors(true);
      scrollToFirstError();
      return;
    }
    onFormSubmit(e);
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    navigate("/feed");
  };

  const errorsForStep = showErrors ? fieldErrors : {};

  const renderCurrentStep = () => {
    switch (steps[finalCurrentStep].component) {
      case "steps":
        return (
          <PostFormSteps
            formData={formData}
            setFormData={setFormData}
            fieldErrors={errorsForStep}
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
            fieldErrors={errorsForStep}
          />
        );
      case "information":
        return (
          <PostFormInformation
            formData={formData}
            setFormData={setFormData}
            onMeasurementChange={onMeasurementChange}
            fieldErrors={errorsForStep}
          />
        );
      case "location":
        return (
          <PostFormLocation
            formData={formData}
            setFormData={setFormData}
            onAddressSelect={onAddressSelect}
            fieldErrors={errorsForStep}
          />
        );
      default:
        return null;
    }
  };

  // Keep Next/Submit buttons enabled; the click handler surfaces inline errors.
  const canProceedNow = true;


  return (
    <div className="container max-w-2xl mx-auto px-4 pt-6 flex-1 flex flex-col min-h-0">
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
          className="absolute right-0 top-0 h-9 w-9 rounded-full bg-white/80 text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.2)] ring-1 ring-black/10 backdrop-blur-sm hover:bg-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <PostFormProgress
        steps={steps}
        currentStep={finalCurrentStep}
        maxVisitedStep={finalMaxVisited}
        onStepClick={finalGoToStep}
      />

      <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
        <Card className="p-6 mb-6">
          {renderCurrentStep()}
        </Card>

        <div className="mt-auto pt-4 pb-24 bg-background">
          <PostFormNavigation
            currentStep={finalCurrentStep}
            isOnFinalStep={finalIsOnFinalStep}
            canProceedNow={canProceedNow}
            isFormValid={true /* surfacing happens via inline errors */}
            isSubmitting={isSubmitting}
            isRequest={isRequest}
            isEditMode={isEditMode}
            onPrevStep={finalPrevStep}
            onNextStep={attemptNext}
            onCancel={() => setCancelDialogOpen(true)}
          />
        </div>
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
