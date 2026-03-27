
interface PostFormDebugInfoProps {
  currentStep: number;
  stepsLength: number;
  currentStepTitle: string;
  canProceedNow: boolean;
  isOnFinalStep: boolean;
}

export function PostFormDebugInfo({
  currentStep,
  stepsLength,
  currentStepTitle,
  canProceedNow,
  isOnFinalStep
}: PostFormDebugInfoProps) {
  return (
    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
      Step: {currentStep + 1}/{stepsLength} ({currentStepTitle}) | 
      Can proceed: {canProceedNow ? 'Yes' : 'No'} | 
      Final step: {isOnFinalStep ? 'Yes' : 'No'}
    </div>
  );
}
