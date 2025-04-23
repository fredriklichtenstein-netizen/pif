import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPasswordSettings } from "@/components/settings/EmailPasswordSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { DangerZone } from "@/components/settings/DangerZone";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MainNav } from "@/components/MainNav";

const SettingsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-2/3 mb-2" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center">
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft size={16} />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mx-auto pr-10">
              Account Settings
            </h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="danger" className="text-destructive">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email & Password</CardTitle>
                  <CardDescription>
                    Manage your email address and password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<SettingsSkeleton />}>
                    <EmailPasswordSettings />
                  </Suspense>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sign Out</CardTitle>
                  <CardDescription>
                    Sign out from your current session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignOutButton />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<SettingsSkeleton />}>
                    <NotificationSettings />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Review our privacy policies and manage your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<SettingsSkeleton />}>
                    <PrivacySettings />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="danger" className="space-y-6">
              <Card className="border-destructive/50">
                <CardHeader className="text-destructive">
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<SettingsSkeleton />}>
                    <DangerZone />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <MainNav />
    </>
  );
}
