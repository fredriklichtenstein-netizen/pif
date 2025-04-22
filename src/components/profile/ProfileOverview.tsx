
import { Card } from "@/components/ui/card";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { AvatarImage } from "@/components/ui/optimized-image";

export function ProfileOverview({ user }: { user: any }) {
  // Add actual stats queries as needed!
  return (
    <Card className="p-6 flex flex-col items-center mb-4">
      <AvatarImage
        src={user.avatar_url}
        alt={user.first_name || user.email}
        size={96}
        className="mb-3 border"
      />
      <div className="text-2xl font-semibold">{user.first_name} {user.last_name?.[0]}</div>
      <div className="text-gray-500 mb-2">{user.email}</div>
      {/* Stats and sustainability info can go here */}
      <div className="flex gap-6 mt-4">
        <div className="text-center">
          <div className="font-bold text-lg">–</div>
          <div className="text-xs text-gray-400">PIFs posted</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg">–</div>
          <div className="text-xs text-gray-400">Interests shown</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg">–</div>
          <div className="text-xs text-gray-400">Items received</div>
        </div>
      </div>
      {/* Add more stats and summary for sustainability, circularity here */}
    </Card>
  );
}
