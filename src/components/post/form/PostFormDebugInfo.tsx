
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
    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
      Steg: {currentStep + 1}/{stepsLength} ({currentStepTitle}) | 
      Kan fortsätta: {canProceedNow ? 'Ja' : 'Nej'} | 
      Sista steget: {isOnFinalStep ? 'Ja' : 'Nej'}
    </div>
  );
}
