
import { useState } from "react";

export function useExpandableContent(description: string, hasDetails: boolean) {
  const [expanded, setExpanded] = useState(false);
  
  // Always show the toggle button regardless of description length
  const showToggle = true;
  
  const toggleExpanded = () => setExpanded(!expanded);
  
  return {
    expanded,
    toggleExpanded,
    showToggle
  };
}
