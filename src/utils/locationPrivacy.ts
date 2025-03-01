
// This file re-exports all location privacy functions from the modular structure
// This allows existing code to continue functioning without changes

import { isUrbanArea } from "./location/urbanDetection";
import { isWaterLocation } from "./location/waterDetection";
import { addLocationPrivacy } from "./location/privacyOffset";

export {
  isUrbanArea,
  isWaterLocation,
  addLocationPrivacy
};
