
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { Settings, AlertCircle } from "lucide-react";

import { ProfileOverviewTab } from "./ProfileOverviewTab";
import { MyPifsTab } from "./MyPifsTab";
import { MyInterestsTab } from "./MyInterestsTab";
import { InterestsInMyPifsTab } from "./InterestsInMyPifsTab";

const Profile = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "my-pifs" | "my-interests" | "interests-in-my-pifs">("overview");

  const handleTabChange = (value: string) => {
    if (["overview", "my-pifs", "my-interests", "interests-in-my-pifs"].includes(value)) {
      setActiveTab(value as typeof activeTab);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">Loading profile...</span>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="flex flex-col items-center p-8 gap-4">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <div className="text-xl font-bold">Authentication required</div>
          <div className="text-gray-600">Please sign in to view your profile</div>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 flex flex-col items-center pb-28">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <div className="flex gap-2">
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
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full flex gap-2 border rounded-lg bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="my-pifs">My PIFs</TabsTrigger>
            <TabsTrigger value="my-interests">My Interests</TabsTrigger>
            <TabsTrigger value="interests-in-my-pifs">Interests in My PIFs</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <ProfileOverviewTab user={user} />
          </TabsContent>
          <TabsContent value="my-pifs">
            <MyPifsTab userId={user.id} />
          </TabsContent>
          <TabsContent value="my-interests">
            <MyInterestsTab userId={user.id} />
          </TabsContent>
          <TabsContent value="interests-in-my-pifs">
            <InterestsInMyPifsTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
export default Profile;
