
import { Input } from "@/components/ui/input";

interface MapboxTokenInputProps {
  mapboxToken: string;
  setMapboxToken: (token: string) => void;
}

export function MapboxTokenInput({ mapboxToken, setMapboxToken }: MapboxTokenInputProps) {
  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Create Post</h1>
      <div className="max-w-md mx-auto space-y-4">
        <p className="text-gray-600">
          Please enter your Mapbox public token to create a post. You can get one
          from{" "}
          <a
            href="https://mapbox.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Mapbox
          </a>
        </p>
        <Input
          type="text"
          placeholder="Enter Mapbox token"
          value={mapboxToken}
          onChange={(e) => setMapboxToken(e.target.value)}
        />
      </div>
    </div>
  );
}
