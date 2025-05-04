
import { Ruler } from "lucide-react";

interface ItemMeasurementsProps {
  measurements: Record<string, string>;
}

export function ItemMeasurements({ measurements }: ItemMeasurementsProps) {
  if (Object.keys(measurements).length === 0) {
    return null;
  }
  
  // Format the measurements by category
  const formatMeasurements = () => {
    const result: Record<string, Record<string, string>> = {};
    
    // Handle size separately if it exists
    let size = null;
    if (measurements.size) {
      size = measurements.size;
    }
    
    // Handle dimensions together
    const hasDimensions = measurements.width || measurements.height || measurements.depth;
    if (hasDimensions) {
      result.dimensions = {};
      if (measurements.width) result.dimensions.width = measurements.width;
      if (measurements.height) result.dimensions.height = measurements.height;
      if (measurements.depth) result.dimensions.depth = measurements.depth;
    }
    
    // Handle weight separately
    let weight = null;
    if (measurements.weight) {
      weight = measurements.weight;
    }
    
    // Add all other measurements
    result.other = {};
    for (const [key, value] of Object.entries(measurements)) {
      // Skip already processed measurements
      if (
        key === "size" || 
        key === "width" || 
        key === "height" || 
        key === "depth" || 
        key === "weight"
      ) {
        continue;
      }
      
      // Only add if value exists
      if (value) {
        result.other[key] = value;
      }
    }
    
    // Remove empty categories
    if (Object.keys(result.other).length === 0) {
      delete result.other;
    }
    
    return { size, weight, categories: result };
  };
  
  const { size, weight, categories } = formatMeasurements();

  return (
    <div className="mb-2 space-y-2">
      <div className="flex items-center gap-1.5 mb-1 text-gray-700">
        <Ruler className="h-4 w-4" />
        <span className="font-semibold">Size & Measurements</span>
      </div>
      
      {/* Display size prominently if available */}
      {size && (
        <div className="font-medium text-sm bg-gray-50 px-2 py-1 rounded inline-block mb-1">
          Size: {size}
        </div>
      )}
      
      {/* Show weight if available */}
      {weight && (
        <div className="text-sm ml-1 mb-1">
          <span className="font-medium">Weight:</span> {weight}
        </div>
      )}
      
      {/* Display dimensions */}
      {categories.dimensions && (
        <div className="text-sm ml-1 mb-1">
          <span className="font-medium">Dimensions:</span>{" "}
          {categories.dimensions.width && `W: ${categories.dimensions.width}`}
          {categories.dimensions.width && categories.dimensions.height && " x "}
          {categories.dimensions.height && `H: ${categories.dimensions.height}`}
          {(categories.dimensions.width || categories.dimensions.height) && categories.dimensions.depth && " x "}
          {categories.dimensions.depth && `D: ${categories.dimensions.depth}`}
        </div>
      )}
      
      {/* Display other measurements */}
      {categories.other && Object.keys(categories.other).length > 0 && (
        <div className="grid grid-cols-2 gap-1 text-xs mt-1">
          {Object.entries(categories.other).map(([key, value]) => (
            <div key={key} className="flex">
              <span className="font-medium mr-1">{key}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
