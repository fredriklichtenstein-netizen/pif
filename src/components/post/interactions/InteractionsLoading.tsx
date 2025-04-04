
import { Skeleton } from "@/components/ui/skeleton";

export function InteractionsLoading() {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center text-sm text-gray-600 px-1 py-2 border-b border-gray-200">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-24 ml-auto" />
      </div>
      <div className="flex items-center justify-between py-[5px]">
        <Skeleton className="h-10 flex-1 mx-1" />
        <Skeleton className="h-10 flex-1 mx-1" />
        <Skeleton className="h-10 flex-1 mx-1" />
      </div>
    </div>
  );
}
