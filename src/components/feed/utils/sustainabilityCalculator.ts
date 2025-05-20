
import { ECO_FRIENDLY_CATEGORIES } from "./constants";

// CO2 equivalent savings in kg by category (realistic average estimates)
export const CATEGORY_CO2_SAVINGS: Record<string, { min: number; max: number }> = {
  "Furniture": { min: 20, max: 120 },
  "Clothing": { min: 5, max: 30 },
  "Electronics": { min: 30, max: 100 },
  "Books": { min: 2, max: 8 },
  "Kitchen": { min: 5, max: 25 },
  "Toys": { min: 3, max: 15 },
  "Garden": { min: 4, max: 40 },
  "Sports": { min: 5, max: 30 },
  "Art": { min: 2, max: 10 },
  "Tools": { min: 10, max: 50 },
  "Baby": { min: 8, max: 40 },
  "Automotive": { min: 15, max: 100 },
  "Other": { min: 5, max: 25 }
};

// Multiplier based on condition
export const CONDITION_MULTIPLIER: Record<string, number> = {
  "New": 1.0,
  "Like New": 0.95,
  "Good": 0.85,
  "Fair": 0.7,
  "Poor": 0.5,
  "unknown": 0.75 // Default for unknown condition
};

// Resources saved descriptions by category
export const RESOURCE_SAVINGS: Record<string, string> = {
  "Furniture": "wood",
  "Clothing": "water",
  "Electronics": "minerals & metals",
  "Books": "paper & trees",
  "Kitchen": "plastic & metals",
  "Toys": "plastic & resources",
  "Garden": "soil & water",
  "Sports": "materials",
  "Art": "creative materials",
  "Tools": "metal & resources",
  "Baby": "materials",
  "Automotive": "metal & resources",
  "Other": "materials"
};

/**
 * Deterministically calculate CO2 savings based on item properties
 * Uses a combination of category, condition, and item ID for consistency
 */
export function calculateCO2Savings(
  itemId: string | number, 
  category: string = "Other",
  condition: string = "unknown",
  measurements?: Record<string, string>
): number {
  // Get the CO2 range for this category
  const categoryRange = CATEGORY_CO2_SAVINGS[category] || CATEGORY_CO2_SAVINGS["Other"];
  const { min, max } = categoryRange;
  
  // Calculate the base range
  const range = max - min;
  
  // Use the item ID to create a deterministic position within the range
  // This ensures the same item always gets the same value
  const itemIdString = String(itemId);
  let hashValue = 0;
  for (let i = 0; i < itemIdString.length; i++) {
    hashValue += itemIdString.charCodeAt(i);
  }
  
  // Use the hash to get a value between 0 and 1
  const normalizedHash = (hashValue % 100) / 100;
  
  // Apply size adjustments if measurements exist
  let sizeMultiplier = 1.0;
  if (measurements && Object.keys(measurements).length > 0) {
    // Extract any numeric values from measurements to estimate size
    const numericValues = Object.values(measurements)
      .map(val => parseFloat(val))
      .filter(num => !isNaN(num));
      
    if (numericValues.length > 0) {
      // Higher measurements generally mean larger items with more materials
      const avgMeasurement = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      sizeMultiplier = Math.min(Math.max(avgMeasurement / 50, 0.8), 1.5); // Clamp between 0.8 and 1.5
    }
  }
  
  // Apply condition multiplier
  const conditionFactor = CONDITION_MULTIPLIER[condition] || CONDITION_MULTIPLIER["unknown"];
  
  // Calculate final CO2 saving
  const baseSaving = min + (normalizedHash * range);
  const finalSaving = baseSaving * conditionFactor * sizeMultiplier;
  
  // Round to 1 decimal place for display
  return Math.round(finalSaving * 10) / 10;
}

/**
 * Get a description of resources saved for an item's category
 */
export function getResourcesSaved(category: string): string {
  return RESOURCE_SAVINGS[category] || RESOURCE_SAVINGS["Other"];
}

/**
 * Calculate the sustainability impact for an item
 * Returns both CO2 savings and resource type saved
 */
export function getSustainabilityImpact(post: any) {
  const co2Saved = calculateCO2Savings(
    post.id,
    post.category,
    post.condition,
    post.measurements
  );
  
  const resourcesSaved = getResourcesSaved(post.category);
  
  return {
    co2Saved,
    resourcesSaved
  };
}

/**
 * Get total sustainability impact for multiple items
 */
export function calculateTotalCommunityImpact(posts: any[]) {
  let totalCO2Saved = 0;
  let itemCount = 0;
  
  posts.forEach(post => {
    if (!post.__deleted) { // Don't count deleted posts
      totalCO2Saved += calculateCO2Savings(
        post.id,
        post.category,
        post.condition,
        post.measurements
      );
      itemCount++;
    }
  });
  
  // Round the total to a reasonable precision
  totalCO2Saved = Math.round(totalCO2Saved * 10) / 10;
  
  return {
    totalCO2Saved,
    itemCount
  };
}
