
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
import { X, AlertCircle, CalendarClock, ChevronDown, FileText } from "lucide-react";
import { ScheduleDialog } from "@/components/drafts/ScheduleDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DRAFTS_FEED_PATH } from "@/lib/feedLinks";
import { useMyDrafts } from "@/hooks/drafts/useMyDrafts";
import { formatScheduleTime } from "@/lib/schedule";
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

const DRAFTS_MENU_LIMIT = 5;

interface PostFormContainerProps {
  formData: any;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  isEditMode?: boolean;
  /** Editing a saved draft (item_drafts), not a published item. */
  isDraftMode?: boolean;
  currentDraftId?: number | null;
  scheduledAt?: Date | null;
  onFormSubmit: (e: React.FormEvent) => void;
  /** Omitted when drafts aren't available (editing a live item, demo mode). */
  /** Saves, then navigates to `navigateTo` (default: the feed's drafts view). */
  onSaveDraft?: (navigateTo?: string) => Promise<boolean>;
  onSchedule?: (scheduledAt: Date) => Promise<boolean>;
  onImageUpload: (files: File[], crops: (ImageCrop | null)[]) => void;
  onImageReplace: (index: number, file: File | null, crop: ImageCrop | null) => void;
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
  isDraftMode = false,
  currentDraftId = null,
  scheduledAt = null,
  onFormSubmit,
  onSaveDraft,
  onSchedule,
  onImageUpload,
  onImageReplace,
  onImagesChange,
  onImageCropsChange,
  onMeasurementChange,
  setFormData,
  onAddressSelect,
  isFormValid,
  profileDefaults,
}: PostFormContainerProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const canUseDrafts = !isEditMode && !!onSaveDraft;
  const hasContent =
    !!formData.title?.trim() || !!formData.description?.trim() || (formData.images?.length ?? 0) > 0;
  const { data: myDrafts } = useMyDrafts();
  // The drafts menu next to "Spara utkast": other drafts, newest first
  // (fetchMyDrafts' order), capped so the menu stays short.
  const otherDrafts = canUseDrafts ? (myDrafts ?? []).filter((d) => d.id !== currentDraftId) : [];
  const menuDrafts = otherDrafts.slice(0, DRAFTS_MENU_LIMIT);
  const [switchToDraftId, setSwitchToDraftId] = useState<number | null>(null);
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

  // Clear the surfaced errors as soon as the step is actually complete, so the
  // banner doesn't linger after the user has filled in what was missing.
  useEffect(() => {
    if (stepErrors.length === 0) {
      setShowErrors(false);
      setSummaryError(null);
    }
  }, [stepErrors.length]);

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
    navigate(isDraftMode ? DRAFTS_FEED_PATH : "/feed");
  };

  /** Opening another draft would drop what's in the form, so ask first. */
  const handleOpenDraft = (draftId: number) => {
    if (!hasContent) {
      navigate(`/post/draft/${draftId}`);
      return;
    }
    // Open the confirm dialog only after the menu has finished closing --
    // a Radix dialog opened from a menu item can leave pointer-events: none
    // on <body>, freezing the page.
    setTimeout(() => setSwitchToDraftId(draftId), 0);
  };

  const handleSwitchDraft = async (save: boolean) => {
    const target = switchToDraftId;
    setSwitchToDraftId(null);
    if (target == null) return;
    if (save) await onSaveDraft?.(`/post/draft/${target}`);
    else navigate(`/post/draft/${target}`);
  };

  const handleSaveDraftFromCancel = async () => {
    setCancelDialogOpen(false);
    await onSaveDraft?.();
  };

  /** Scheduling needs everything publishing needs, so validate like submit. */
  const handleScheduleClick = () => {
    if (goToFirstProblem()) return;
    if (!isFormValid) {
      setSummaryError(t('post.validation.incomplete_summary'));
      setShowErrors(true);
      scrollToFirstError();
      return;
    }
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = async (date: Date) => {
    const ok = await onSchedule?.(date);
    if (ok) setScheduleDialogOpen(false);
  };

  const offerToSaveDraft = canUseDrafts && hasContent;

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
            onImageReplace={onImageReplace}
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
    // Bottom padding must clear the floating MainNav pill, which sits at
    // bottom: max(1rem, env(safe-area-inset-bottom)) and is ~56px tall — so on
    // devices with a home indicator the previous pb-20 (80px) left the
    // Föregående/Nästa buttons partially underneath it at full scroll.
    //
    // App-wide width sweep: max-w-2xl (672px) widened to max-w-3xl (768px)
    // to match the standard now used everywhere else (Profile/
    // AccountSettings/Feed/Messages/etc.) -- see Feed.tsx for the sweep's
    // rationale. This is the REAL width for the pif/wish creation flow
    // (Post.tsx's own wrapper has none; PostForm.tsx's max-w-2xl instances
    // only cover early-return demo-mode banners, not the actual form).
    <div className="container max-w-3xl mx-auto py-8 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="relative">
        <PostFormHeader
          title={isDraftMode ? t('drafts.edit_title') : isRequest ? t('post.create_request') : t('post.create_offer')}
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

      {isDraftMode && scheduledAt && (
        <Alert className="mb-4">
          <CalendarClock className="h-4 w-4" />
          <AlertDescription>
            {t('drafts.scheduled_for', { when: formatScheduleTime(scheduledAt, i18n.language) })}
          </AlertDescription>
        </Alert>
      )}

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
          isDraftMode={isDraftMode}
          onPrevStep={finalPrevStep}
          onNextStep={attemptNext}
          onCancel={() => setCancelDialogOpen(true)}
        />
        {canUseDrafts && (
          <div className="flex flex-wrap justify-end gap-2">
            <div className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={otherDrafts.length > 0 ? "rounded-r-none" : undefined}
                onClick={() => onSaveDraft?.()}
                disabled={isSubmitting || !hasContent}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                {isDraftMode ? t('drafts.save_changes') : t('drafts.save_draft')}
              </Button>
              {otherDrafts.length > 0 && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-l-none border-l px-2"
                      disabled={isSubmitting}
                      aria-label={t('drafts.open_other_draft')}
                    >
                      <span className="text-xs text-muted-foreground mr-1">{otherDrafts.length}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>{t('drafts.open_other_draft')}</DropdownMenuLabel>
                    {menuDrafts.map((d) => (
                      <DropdownMenuItem key={d.id} onSelect={() => handleOpenDraft(d.id)} className="gap-2">
                        {d.scheduled_at ? (
                          <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{d.title?.trim() || t('drafts.untitled')}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate(DRAFTS_FEED_PATH)}>
                      {t('drafts.show_all_drafts', { count: otherDrafts.length + (isDraftMode ? 1 : 0) })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {finalIsOnFinalStep && onSchedule && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleScheduleClick}
                disabled={isSubmitting}
              >
                <CalendarClock className="h-4 w-4 mr-1.5" />
                {scheduledAt ? t('drafts.change_schedule') : t('drafts.schedule_button')}
              </Button>
            )}
          </div>
        )}
      </form>

      {onSchedule && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          initial={scheduledAt}
          isSubmitting={isSubmitting}
          onConfirm={handleScheduleConfirm}
        />
      )}


      <AlertDialog open={switchToDraftId !== null} onOpenChange={(open) => !open && setSwitchToDraftId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drafts.switch_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {isDraftMode ? t('drafts.switch_message_draft') : t('drafts.switch_message_new')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>{t('post.cancel_keep_editing')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSwitchDraft(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {t('drafts.switch_without_saving')}
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleSwitchDraft(true)}>
              {t('drafts.switch_save_and_open')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {offerToSaveDraft ? t('drafts.cancel_save_title') : t('post.cancel_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {offerToSaveDraft
                ? isDraftMode
                  ? t('drafts.cancel_save_changes_message')
                  : t('drafts.cancel_save_message')
                : t('post.cancel_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>{t('post.cancel_keep_editing')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className={offerToSaveDraft ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : undefined}
            >
              {offerToSaveDraft && isDraftMode ? t('drafts.discard_changes') : t('post.cancel_discard')}
            </AlertDialogAction>
            {offerToSaveDraft && (
              <AlertDialogAction onClick={handleSaveDraftFromCancel}>
                {isDraftMode ? t('drafts.save_changes') : t('drafts.save_draft')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
