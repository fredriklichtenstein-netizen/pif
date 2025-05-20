
import { isUrbanArea } from './urbanDetection';
import { isWaterLocation } from './waterDetection';
import { getCachedCoordinates, cacheCoordinates } from './persistentCoordinateCache';

export interface PrivacyCoordinateTask {
  id: string;
  originalLng: number;
  originalLat: number;
  onComplete: (result: [number, number]) => void;
}

interface BatchProcessorOptions {
  batchSize?: number;
  processingDelay?: number;
}

// Queue of coordinate processing tasks
const queue: PrivacyCoordinateTask[] = [];
let isProcessing = false;

// Default options
const defaultOptions: Required<BatchProcessorOptions> = {
  batchSize: 5,
  processingDelay: 50, // ms between tasks to prevent UI blocking
};

let processorOptions: Required<BatchProcessorOptions> = { ...defaultOptions };

// Configure the batch processor
export const configureProcessor = (options: BatchProcessorOptions) => {
  processorOptions = { ...processorOptions, ...options };
};

// Start processing the queue
const startProcessing = async () => {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  console.log(`Starting batch coordinate privacy processing with ${queue.length} items`);
  
  try {
    // Process in batches
    while (queue.length > 0) {
      const batch = queue.splice(0, processorOptions.batchSize);
      
      // Process each task in the batch
      await Promise.all(batch.map(async (task) => {
        try {
          const result = await processPrivacyCoordinates(task);
          task.onComplete(result);
        } catch (error) {
          console.error(`Error processing coordinates for ${task.id}:`, error);
          // Use minimally adjusted coordinates in case of error
          const fallbackCoords: [number, number] = [
            task.originalLng + (Math.random() - 0.5) * 0.001,
            task.originalLat + (Math.random() - 0.5) * 0.001
          ];
          task.onComplete(fallbackCoords);
        }
      }));
      
      // Add a small delay between batches to prevent UI blocking
      if (queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, processorOptions.processingDelay));
      }
    }
  } catch (error) {
    console.error('Error in batch coordinate processing:', error);
  } finally {
    isProcessing = false;
  }
};

// Process a single coordinate privacy task
const processPrivacyCoordinates = async (
  task: PrivacyCoordinateTask
): Promise<[number, number]> => {
  const { originalLng, originalLat } = task;
  
  // Check cache first
  const cached = getCachedCoordinates(originalLng, originalLat);
  if (cached) {
    return cached;
  }
  
  // Validate input coordinates
  if (isNaN(originalLng) || isNaN(originalLat)) {
    throw new Error("Invalid coordinates for privacy calculation");
  }
  
  // Check if location is in an urban area (more anonymization needed)
  const isUrban = await isUrbanArea(originalLat, originalLng);
  
  // Determine privacy radius based on location type
  // Urban areas use smaller radius (higher density of potential PIF users)
  const privacyRadiusUrban = 300; // meters for urban areas
  const privacyRadiusRural = 800; // meters for rural areas
  
  const privacyRadius = isUrban ? privacyRadiusUrban : privacyRadiusRural;
  
  // Calculate privacy offset
  const offsetMeters = Math.random() * privacyRadius;
  const angle = Math.random() * 2 * Math.PI; // Random angle in radians
  
  // Convert meters to approximate degrees
  const latOffset = offsetMeters / 111000;
  const lngOffset = offsetMeters / (111000 * Math.cos(originalLat * Math.PI / 180));
  
  // Apply the offset
  let adjustedLng = originalLng + lngOffset * Math.cos(angle);
  let adjustedLat = originalLat + latOffset * Math.sin(angle);
  
  // Check if new location is in water, if so retry up to 3 times
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const isWater = await isWaterLocation(adjustedLng, adjustedLat);
    
    if (!isWater) {
      break; // Found a valid location
    }
    
    console.log('Privacy offset landed in water, retrying...');
    
    // Calculate new offset with smaller radius each attempt
    const retryRadius = privacyRadius * (1 - (attempts + 1) / maxAttempts);
    const retryOffset = Math.random() * retryRadius;
    const retryAngle = Math.random() * 2 * Math.PI;
    
    const retryLatOffset = retryOffset / 111000;
    const retryLngOffset = retryOffset / (111000 * Math.cos(originalLat * Math.PI / 180));
    
    adjustedLng = originalLng + retryLngOffset * Math.cos(retryAngle);
    adjustedLat = originalLat + retryLatOffset * Math.sin(retryAngle);
    
    attempts++;
  }
  
  // Cache the result
  const result: [number, number] = [adjustedLng, adjustedLat];
  cacheCoordinates(originalLng, originalLat, result);
  
  return result;
};

// Add a task to the queue
export const queueCoordinateProcessing = (
  id: string,
  lng: number,
  lat: number,
  onComplete: (result: [number, number]) => void
): void => {
  // Check cache first for immediate return
  const cached = getCachedCoordinates(lng, lat);
  if (cached) {
    onComplete(cached);
    return;
  }
  
  // Add to queue
  queue.push({
    id,
    originalLng: lng,
    originalLat: lat,
    onComplete
  });
  
  // Start processing if not already
  if (!isProcessing) {
    startProcessing();
  }
};

// Get current queue stats
export const getQueueStats = () => {
  return {
    queueLength: queue.length,
    isProcessing
  };
};
