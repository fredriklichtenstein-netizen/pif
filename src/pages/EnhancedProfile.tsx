
import { ProfileDashboard } from '@/components/profile/ProfileDashboard';
import { CommunityDiscovery } from '@/components/community/CommunityDiscovery';
import { MainHeader } from '@/components/layout/MainHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Users, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EnhancedProfile() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main" aria-label="Enhanced profile">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Community
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <ProfileDashboard />
            </TabsContent>

            <TabsContent value="community">
              <CommunityDiscovery />
            </TabsContent>

            <TabsContent value="profile">
              <div className="text-center py-12 text-gray-500">
                Profile settings and preferences will be available here
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
