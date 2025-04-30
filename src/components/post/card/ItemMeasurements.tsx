
import { useState } from "react";

interface ItemMeasurementsProps {
  measurements: Record<string, string>;
}

export function ItemMeasurements({ measurements }: ItemMeasurementsProps) {
  const [showMeasurements, setShowMeasurements] = useState(false);
  const hasMeasurements = Object.keys(measurements).length > 0;

  if (!hasMeasurements) return null;

  const toggleMeasurements = () => {
    setShowMeasurements(!showMeasurements);
  };

  return (
    <div className="mb-3">
      <button 
        onClick={toggleMeasurements}
        className="text-sm text-primary hover:underline font-medium"
      >
        {showMeasurements ? "Hide measurements" : "Show measurements"}
      </button>
      
      {showMeasurements && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-1">
              <span className="text-gray-600">{key}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
