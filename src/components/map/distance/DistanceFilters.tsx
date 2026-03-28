
import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

interface DistanceFiltersProps {
  selectedDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  userLocation: [number, number] | null;
}

// Slider steps: 1, 2, 3, 5, 10, 15, 25, null(All)
const DISTANCE_STEPS = [1, 2, 3, 5, 10, 15, 25];
const MAX_STEP = DISTANCE_STEPS.length; // index for "All"

function distanceToStep(distance: number | null): number {
  if (distance === null) return MAX_STEP;
  const idx = DISTANCE_STEPS.indexOf(distance);
  return idx >= 0 ? idx : MAX_STEP;
}

function stepToDistance(step: number): number | null {
  if (step >= MAX_STEP) return null;
  return DISTANCE_STEPS[step];
}

export const DistanceFilters = ({ selectedDistance, onDistanceChange, userLocation }: DistanceFiltersProps) => {
  const { t } = useTranslation();

  const currentStep = useMemo(() => distanceToStep(selectedDistance), [selectedDistance]);

  const handleSliderChange = (value: number[]) => {
    onDistanceChange(stepToDistance(value[0]));
  };

  if (!userLocation) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground px-1">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">{t('interactions.enable_location_filters')}</span>
      </div>
    );
  }

  const label = selectedDistance ? `${selectedDistance} km` : t('interactions.all');

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
        {t('interactions.distance')}:
      </span>
      <Slider
        value={[currentStep]}
        min={0}
        max={MAX_STEP}
        step={1}
        onValueChange={handleSliderChange}
        className="w-32"
      />
      <span className="text-xs font-semibold text-foreground whitespace-nowrap shrink-0 min-w-[3rem] text-right">
        {label}
      </span>
    </div>
  );
};
