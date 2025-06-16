
interface PostFormProgressProps {
  steps: any[];
  currentStep: number;
}

export function PostFormProgress({ steps, currentStep }: PostFormProgressProps) {
  return (
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
  );
}
