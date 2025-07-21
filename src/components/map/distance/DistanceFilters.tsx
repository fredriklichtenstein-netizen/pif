
import { useState } from 'react';
import { MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DistanceFiltersProps {
  selectedDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  userLocation: [number, number] | null;
}

const DISTANCE_OPTIONS = [
  { value: 1, label: '1km' },
  { value: 5, label: '5km' },
  { value: 10, label: '10km' },
  { value: 25, label: '25km' }
];

export const DistanceFilters = ({ selectedDistance, onDistanceChange, userLocation }: DistanceFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!userLocation) {
    return (
      <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Enable location for distance filters</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-3"
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Distance</span>
        {selectedDistance && (
          <Badge variant="secondary" className="ml-1">
            {selectedDistance}km
          </Badge>
        )}
      </Button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedDistance === null ? "default" : "outline"}
              size="sm"
              onClick={() => onDistanceChange(null)}
              className="text-xs"
            >
              All
            </Button>
            {DISTANCE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedDistance === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => onDistanceChange(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
