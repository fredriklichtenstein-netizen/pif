
import { Archive } from "lucide-react";

export function ItemArchivedBanner() {
  return (
    <div className="bg-yellow-50 p-2 flex items-center gap-2 text-sm text-amber-700">
      <Archive className="h-4 w-4" />
      <span>This item has been archived</span>
    </div>
  );
}
