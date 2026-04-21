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
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/common/LanguageSelector";

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
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center">
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft size={16} />
                {t('nav.back_to_profile')}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mx-auto pr-10">
              {t('settings.title')}
            </h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="account">{t('settings.account')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
              <TabsTrigger value="privacy">{t('settings.privacy')}</TabsTrigger>
              <TabsTrigger value="danger" className="text-destructive">{t('settings.danger_zone')}</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.email_password')}</CardTitle>
                  <CardDescription>
                    {t('settings.email_password_description')}
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
                  <CardTitle>{t('settings.language')}</CardTitle>
                  <CardDescription>
                    {t('settings.language_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <LanguageSelector />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.sign_out')}</CardTitle>
                  <CardDescription>
                    {t('settings.sign_out_description')}
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
                  <CardTitle>{t('settings.notification_preferences')}</CardTitle>
                  <CardDescription>
                    {t('settings.notification_preferences_description')}
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
                  <CardTitle>{t('settings.privacy_settings')}</CardTitle>
                  <CardDescription>
                    {t('settings.privacy_settings_description')}
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
                  <CardTitle>{t('settings.danger_zone')}</CardTitle>
                  <CardDescription>
                    {t('settings.danger_zone_description')}
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
