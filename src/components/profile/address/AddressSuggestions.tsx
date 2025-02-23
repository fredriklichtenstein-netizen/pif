
import { Button } from "@/components/ui/button";

interface AddressSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function AddressSuggestions({ suggestions, onSelect }: AddressSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
