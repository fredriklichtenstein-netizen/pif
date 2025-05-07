
import { useEffect, useState } from "react";
import { parseCoordinatesFromDB } from "@/types/post";

export function useCoordinatesParser(coordinates: any) {
  const [parsedCoordinates, setParsedCoordinates] = useState(coordinates);

  useEffect(() => {
    // Parse coordinates if they're in string format
    if (coordinates && typeof coordinates === 'string') {
      try {
        setParsedCoordinates(parseCoordinatesFromDB(coordinates));
      } catch (e) {
        console.error('Error parsing coordinates:', e);
        setParsedCoordinates(null);
      }
    } else {
      setParsedCoordinates(coordinates);
    }
  }, [coordinates]);

  return { parsedCoordinates };
}
