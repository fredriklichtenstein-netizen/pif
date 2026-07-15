
import { useState } from "react";

export function useExpandableContent() {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  return {
    expanded,
    toggleExpanded,
  };
}
