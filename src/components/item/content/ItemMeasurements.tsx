
interface ItemMeasurementsProps {
  measurements: Record<string, string>;
}

export function ItemMeasurements({ measurements }: ItemMeasurementsProps) {
  if (Object.keys(measurements).length === 0) {
    return null;
  }
  
  return (
    <div className="mt-1 space-y-1">
      <div className="grid grid-cols-2 gap-1 text-xs">
        {Object.entries(measurements).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-medium mr-1">{key}:</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
