import { Map as MapIcon } from "lucide-react";

const Map = () => {
  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Map View</h1>
      <div className="h-[calc(100vh-200px)] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-gray-500">
          <MapIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>Map feature coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Map;