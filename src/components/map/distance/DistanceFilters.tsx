
import { useMemo } from 'react';
import { MapPin, ChevronRight, Home } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { usePifAddress } from '@/hooks/usePifAddress';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

interface DistanceFiltersProps {
  selectedDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  userLocation: [number, number] | null;
  onRequestLocation?: () => void;
  onUsePifAddress?: (coords: [number, number]) => void;
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

export const DistanceFilters = ({ selectedDistance, onDistanceChange, userLocation, onRequestLocation, onUsePifAddress }: DistanceFiltersProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const { fetchPifAddress, isLoading: pifLoading } = usePifAddress();

  const currentStep = useMemo(() => distanceToStep(selectedDistance), [selectedDistance]);

  const handleSliderChange = (value: number[]) => {
    onDistanceChange(stepToDistance(value[0]));
  };

  const handleCurrentLocation = () => {
    try { sessionStorage.setItem('map_location_mode', 'current'); } catch {}
    onRequestLocation?.();
  };

  const handleUsePifAddress = async () => {
    if (!user) {
      toast({
        title: t('interactions.pif_address_not_found_title'),
        description: t('interactions.pif_address_login_required'),
        variant: 'destructive',
      });
      return;
    }
    const result = await fetchPifAddress();
    if (!result.coordinates) {
      toast({
        title: t('interactions.pif_address_not_found_title'),
        description: t('interactions.pif_address_not_found_description'),
        variant: 'destructive',
      });
      return;
    }
    try { sessionStorage.setItem('map_location_mode', 'pif'); } catch {}
    onUsePifAddress?.([result.coordinates.lng, result.coordinates.lat]);
  };

  const locationButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onRequestLocation}
        className="flex items-center gap-1.5 text-muted-foreground px-2 py-0.5 rounded border border-border cursor-pointer hover:text-foreground hover:bg-muted/50 transition-colors group"
        type="button"
        title={t('interactions.enable_location_filters')}
      >
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="text-xs">{t('interactions.current_location_short', 'Current')}</span>
        {!userLocation && <ChevronRight className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
      </button>
      <button
        onClick={handleUsePifAddress}
        disabled={pifLoading}
        className="flex items-center gap-1.5 text-muted-foreground px-2 py-0.5 rounded border border-border cursor-pointer hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
        type="button"
      >
        <Home className="h-3 w-3 shrink-0" />
        <span className="text-xs">{t('interactions.use_pif_address_short')}</span>
      </button>
    </div>
  );

  if (!userLocation) {
    return locationButtons;
  }

  const label = selectedDistance ? `${selectedDistance} km` : t('interactions.all');

  return (
    <div className="flex items-center gap-3 min-w-0 flex-wrap">
      {locationButtons}
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
    </div>
  );
};
