
import { useState } from "react";

export function useExpandableContent(description: string, hasDetails: boolean) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine if we should show the expand/collapse toggle
  const showToggle = description.length > 150 || hasDetails;
  
  const toggleExpanded = () => setExpanded(!expanded);
  
  return {
    expanded,
    toggleExpanded,
    showToggle
  };
}
