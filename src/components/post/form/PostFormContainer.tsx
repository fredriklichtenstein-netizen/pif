
import React, { useEffect, useRef, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertCircle } from "lucide-react";
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
import type { ImageCrop } from "@/types/post";

interface PostFormContainerProps {
  formData: any;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  isEditMode?: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  onImageUpload: (files: File[], crops: (ImageCrop | null)[]) => void;
  onImagesChange: (images: string[]) => void;
  onImageCropsChange: (crops: (ImageCrop | null)[]) => void;
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
  onImageCropsChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
  isFormValid,
  profileDefaults,
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

  // Single navigation instance. canProceed takes the step index, so there's no
  // circular dependency between navigation and validation to work around.
  const validation = usePostFormValidation();

  const {
    currentStep: finalCurrentStep,
    nextStep: finalNextStep,
    prevStep: finalPrevStep,
    isOnFinalStep: finalIsOnFinalStep,
    maxVisitedStep: finalMaxVisited,
    goToStep: finalGoToStep,
  } = usePostFormNavigation({
    steps,
    canProceed: (idx) => validation.validateCurrentStep(formData, idx, steps),
  });


  // Inline validation surface: only show errors after the user attempts to
  // advance/submit. Cleared whenever the active step changes — EXCEPT when we
  // deliberately navigated to a step in order to surface its errors, which is
  // what pendingErrorStepRef marks.
  const [showErrors, setShowErrors] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const pendingErrorStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingErrorStepRef.current === finalCurrentStep) {
      pendingErrorStepRef.current = null;
      setShowErrors(true);
      scrollToFirstError();
      return;
    }
    setShowErrors(false);
    setSummaryError(null);
  }, [finalCurrentStep]);

  const stepErrors = validation.getStepErrors(formData, finalCurrentStep, steps);
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

  /**
   * Route the user to the earliest step that's still missing something and
   * surface that step's errors. Returns true if a problem was found.
   */
  const goToFirstProblem = (): boolean => {
    const idx = validation.firstInvalidStep(formData, steps);
    if (idx === -1) return false;

    const errs = validation.getStepErrors(formData, idx, steps);
    setSummaryError(
      errs.length ? t(errs[0].messageKey) : t('post.validation.incomplete_summary')
    );

    if (idx === finalCurrentStep) {
      setShowErrors(true);
      scrollToFirstError();
    } else {
      // The step-change effect would immediately clear showErrors, so mark the
      // target and let that effect turn the errors on once we've landed.
      pendingErrorStepRef.current = idx;
      finalGoToStep(idx);
    }
    return true;
  };

  const attemptNext = () => {
    if (validation.validateCurrentStep(formData, finalCurrentStep, steps)) {
      setShowErrors(false);
      setSummaryError(null);
      finalNextStep();
    } else {
      setShowErrors(true);
      setSummaryError(t('post.validation.step_incomplete_summary'));
      scrollToFirstError();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalCurrentStep !== steps.length - 1) return;
    // Validate EVERY step, not just the current one. The progress indicator
    // lets the user jump back to a visited step and clear a required field,
    // so reaching the last step doesn't mean the earlier ones are still valid
    // — and an error on a non-rendered step used to fail completely silently.
    if (goToFirstProblem()) return;
    if (!isFormValid) {
      setSummaryError(t('post.validation.incomplete_summary'));
      setShowErrors(true);
      scrollToFirstError();
      return;
    }
    onFormSubmit(e);
  };

  /**
   * Progress-indicator jumps: back is always allowed, but jumping FORWARD past
   * a step that's still incomplete drops the user on that step with its errors
   * shown instead.
   */
  const handleStepClick = (index: number) => {
    if (index > finalCurrentStep) {
      for (let i = 0; i < index; i++) {
        const errs = validation.getStepErrors(formData, i, steps);
        if (errs.length > 0) {
          setSummaryError(t(errs[0].messageKey));
          if (i === finalCurrentStep) {
            setShowErrors(true);
            scrollToFirstError();
          } else {
            pendingErrorStepRef.current = i;
            finalGoToStep(i);
          }
          return;
        }
      }
    }
    finalGoToStep(index);
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
            imageCrops={formData.imageCrops || []}
            isAnalyzing={isAnalyzing}
            onImageUpload={onImageUpload}
            onImagesChange={onImagesChange}
            onImageCropsChange={onImageCropsChange}
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
            profileDefaults={profileDefaults}
            isEditMode={isEditMode}
          />
        );
      default:
        return null;
    }
  };

  // Keep Next/Submit buttons enabled; the click handler surfaces inline errors.
  const canProceedNow = true;


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
          className="absolute right-0 top-0 h-9 w-9 rounded-full bg-white/80 text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.2)] ring-1 ring-black/10 backdrop-blur-sm hover:bg-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <PostFormProgress
        steps={steps}
        currentStep={finalCurrentStep}
        maxVisitedStep={finalMaxVisited}
        onStepClick={handleStepClick}
      />

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {summaryError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{summaryError}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          {renderCurrentStep()}
        </Card>

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
