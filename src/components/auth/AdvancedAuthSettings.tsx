
import { SecurityFeatures } from './SecurityFeatures';
import { AuthMethodSelector } from './AuthMethodSelector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Clock, Bell, Download } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AdvancedAuthSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    sessionTimeout: '24',
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    dataDownload: false
  });

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    toast({
      title: "Setting updated",
      description: "Your security preference has been saved.",
    });
  };

  const handleExportData = async () => {
    try {
      // Mock data export
      const userData = {
        profile: { name: "User", email: "user@example.com" },
        posts: [],
        interactions: [],
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pif-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Features */}
      <SecurityFeatures />
      
      {/* Authentication Methods */}
      <AuthMethodSelector />
      
      {/* Privacy & Security Settings */}
      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5" />
          Privacy & Security Settings
        </h3>
        
        <div className="space-y-6">
          {/* Session Timeout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-gray-500">How long to stay signed in</p>
              </div>
            </div>
            <Select
              value={settings.sessionTimeout}
              onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
                <SelectItem value="720">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Login Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Login Notifications</Label>
                <p className="text-sm text-gray-500">Get notified of new sign-ins</p>
              </div>
            </div>
            <Switch
              checked={settings.loginNotifications}
              onCheckedChange={(checked) => handleSettingChange('loginNotifications', checked)}
            />
          </div>

          {/* Suspicious Activity Alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-gray-500" />
              <div>
                <Label>Suspicious Activity Alerts</Label>
                <p className="text-sm text-gray-500">Alert for unusual account activity</p>
              </div>
            </div>
            <Switch
              checked={settings.suspiciousActivityAlerts}
              onCheckedChange={(checked) => handleSettingChange('suspiciousActivityAlerts', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Data Export */}
      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Download className="h-5 w-5" />
          Data Export
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Download a copy of your PIF data including your profile, posts, and interactions.
        </p>
        
        <Button onClick={handleExportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export My Data
        </Button>
      </Card>
    </div>
  );
}
