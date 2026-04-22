
import { useMemo, useState } from 'react';
import { MapPin, ChevronRight, Home } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { usePifAddress } from '@/hooks/usePifAddress';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

type LocationMode = 'current' | 'pif' | null;

function readMode(): LocationMode {
  try {
    const v = sessionStorage.getItem('map_location_mode');
    if (v === 'current' || v === 'pif') return v;
  } catch {}
  return null;
}

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
  const [activeMode, setActiveMode] = useState<LocationMode>(() => readMode());

  const currentStep = useMemo(() => distanceToStep(selectedDistance), [selectedDistance]);

  const handleSliderChange = (value: number[]) => {
    onDistanceChange(stepToDistance(value[0]));
  };

  const handleCurrentLocation = () => {
    try { sessionStorage.setItem('map_location_mode', 'current'); } catch {}
    setActiveMode('current');
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
    setActiveMode('pif');
    onUsePifAddress?.([result.coordinates.lng, result.coordinates.lat]);
  };

  const activeClasses = 'border-primary bg-primary/10 text-foreground';
  const inactiveClasses = 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50';

  const modeBadge = activeMode && userLocation ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/30"
      aria-label={t('interactions.active_location_mode', 'Active location mode')}
    >
      {activeMode === 'current' ? (
        <MapPin className="h-2.5 w-2.5" />
      ) : (
        <Home className="h-2.5 w-2.5" />
      )}
      {activeMode === 'current'
        ? t('interactions.current_location_short', 'Current')
        : t('interactions.use_pif_address_short')}
    </span>
  ) : null;

  const locationButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleCurrentLocation}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded border cursor-pointer transition-colors group ${activeMode === 'current' ? activeClasses : inactiveClasses}`}
        type="button"
        title={t('interactions.enable_location_filters')}
        aria-pressed={activeMode === 'current'}
      >
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="text-xs">{t('interactions.current_location_short', 'Current')}</span>
        {!userLocation && <ChevronRight className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
      </button>
      <button
        onClick={handleUsePifAddress}
        disabled={pifLoading}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded border cursor-pointer transition-colors disabled:opacity-50 ${activeMode === 'pif' ? activeClasses : inactiveClasses}`}
        type="button"
        aria-pressed={activeMode === 'pif'}
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
      {modeBadge}
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
