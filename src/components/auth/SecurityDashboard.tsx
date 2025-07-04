import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Smartphone, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Monitor
} from "lucide-react";
import { TwoFactorSetup } from "./TwoFactorSetup";

interface LoginSession {
  id: string;
  device: string;
  location: string;
  timestamp: string;
  current: boolean;
  browser: string;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'password_change' | '2fa_enabled' | 'suspicious';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export const SecurityDashboard = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const loginSessions: LoginSession[] = [
    {
      id: '1',
      device: 'MacBook Pro',
      location: 'Stockholm, Sweden',
      timestamp: '2024-01-15 14:30',
      current: true,
      browser: 'Chrome 120'
    },
    {
      id: '2',
      device: 'iPhone 15',
      location: 'Stockholm, Sweden',
      timestamp: '2024-01-15 09:15',
      current: false,
      browser: 'Safari Mobile'
    },
    {
      id: '3',
      device: 'Windows PC',
      location: 'Gothenburg, Sweden',
      timestamp: '2024-01-14 16:45',
      current: false,
      browser: 'Edge 120'
    }
  ];

  const securityEvents: SecurityEvent[] = [
    {
      id: '1',
      type: 'login',
      description: 'Successful login from new device',
      timestamp: '2024-01-15 14:30',
      severity: 'low'
    },
    {
      id: '2',
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: '2024-01-12 10:20',
      severity: 'medium'
    },
    {
      id: '3',
      type: 'suspicious',
      description: 'Multiple failed login attempts',
      timestamp: '2024-01-10 22:15',
      severity: 'high'
    }
  ];

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
        return <Monitor className="h-4 w-4" />;
      case 'password_change':
        return <Shield className="h-4 w-4" />;
      case '2fa_enabled':
        return <Smartphone className="h-4 w-4" />;
      case 'suspicious':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
        <p className="text-gray-600">Manage your account security and view activity</p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg">
                <Shield className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Security</p>
                <p className="text-lg font-semibold text-accent-foreground">Strong</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-lg font-semibold">{loginSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Alerts</p>
                <p className="text-lg font-semibold">
                  {securityEvents.filter(e => e.severity === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="activity">Security Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <TwoFactorSetup 
            isEnabled={twoFactorEnabled}
            onToggle={setTwoFactorEnabled}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password Strength</p>
                  <p className="text-sm text-gray-600">Last changed 3 days ago</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Strong</Badge>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-gray-600">Sign in with Google account</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded">
                    <Globe className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Apple</p>
                    <p className="text-sm text-gray-600">Sign in with Apple ID</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Login Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.current && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{session.browser}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded ${getSeverityColor(event.severity)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.timestamp}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityColor(event.severity)}`}
                      >
                        {event.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};