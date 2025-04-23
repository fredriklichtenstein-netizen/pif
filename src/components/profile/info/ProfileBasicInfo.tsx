
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AvatarImage } from "@/components/ui/optimized-image";
import { ProfileLocationMap } from "../map/ProfileLocationMap";

interface ProfileBasicInfoProps {
  avatarUrl: string | null;
  displayName: string;
  gender: string | null;
  coordinates: { lng: number; lat: number } | null;
}

export function ProfileBasicInfo({ avatarUrl, displayName, gender, coordinates }: ProfileBasicInfoProps) {
  return (
    <>
      <AvatarImage
        src={avatarUrl}
        alt={displayName || "User"}
        size={96}
        className="mb-3 border"
      />
      <div className="text-2xl font-semibold mb-1">{displayName || "User"}</div>
      <div className="text-gray-600 capitalize mb-1">
        {gender ? gender.replace('_', ' ') : "Gender undisclosed"}
      </div>
      {!!coordinates && (
        <div className="w-full mb-2">
          <ProfileLocationMap coordinates={coordinates} />
        </div>
      )}
      <div className="flex gap-3 mt-2">
        <Link to="/profile/edit">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings size={16} />
            Edit Profile
          </Button>
        </Link>
        <Link to="/account-settings">
          <Button variant="outline" size="sm">Account Settings</Button>
        </Link>
      </div>
    </>
  );
}
