interface PostFormProgressProps {
  steps: any[];
  currentStep: number;
  maxVisitedStep?: number;
  onStepClick?: (index: number) => void;
}

export function PostFormProgress({ steps, currentStep, maxVisitedStep = 0, onStepClick }: PostFormProgressProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isReachable = index <= maxVisitedStep;
        const isActive = index <= currentStep;
        return (
          <div key={index} className="flex items-center">
            <button
              type="button"
              disabled={!isReachable || !onStepClick}
              onClick={() => onStepClick?.(index)}
              aria-label={`Steg ${index + 1}`}
              aria-current={index === currentStep ? 'step' : undefined}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              } ${isReachable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-70'}`}
            >
              {index + 1}
            </button>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 ${
                index < currentStep ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
