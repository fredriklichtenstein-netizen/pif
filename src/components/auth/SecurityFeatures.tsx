
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, MapPin, Smartphone, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface LoginAttempt {
  id: string;
  timestamp: string;
  location?: string;
  device?: string;
  success: boolean;
  ip_address?: string;
}

interface SecuritySession {
  id: string;
  created_at: string;
  last_activity: string;
  device_info: string;
  location?: string;
  is_current: boolean;
}

export function SecurityFeatures() {
  const { toast } = useToast();
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [activeSessions, setActiveSessions] = useState<SecuritySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    
    // Mock data for demonstration
    const mockLoginAttempts: LoginAttempt[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        location: 'Stockholm, Sweden',
        device: 'Chrome on Windows',
        success: true,
        ip_address: '192.168.1.1'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        location: 'Göteborg, Sweden',
        device: 'Safari on iPhone',
        success: false,
        ip_address: '192.168.1.2'
      }
    ];

    const mockSessions: SecuritySession[] = [
      {
        id: '1',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        last_activity: new Date().toISOString(),
        device_info: 'Chrome 120 on Windows 11',
        location: 'Stockholm, Sweden',
        is_current: true
      },
      {
        id: '2',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        last_activity: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        device_info: 'Safari on iPhone 15',
        location: 'Malmö, Sweden',
        is_current: false
      }
    ];

    setTimeout(() => {
      setLoginAttempts(mockLoginAttempts);
      setActiveSessions(mockSessions);
      setLoading(false);
    }, 800);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // In a real implementation, this would revoke the session
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session revoked",
        description: "The session has been successfully terminated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggle2FA = async () => {
    try {
      setTwoFactorEnabled(!twoFactorEnabled);
      
      toast({
        title: twoFactorEnabled ? "2FA Disabled" : "2FA Enabled",
        description: twoFactorEnabled 
          ? "Two-factor authentication has been disabled." 
          : "Two-factor authentication has been enabled for added security.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update two-factor authentication settings.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
          </div>
          <Button
            variant={twoFactorEnabled ? "destructive" : "default"}
            onClick={handleToggle2FA}
          >
            {twoFactorEnabled ? "Disable" : "Enable"} 2FA
          </Button>
        </div>
        
        {twoFactorEnabled && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is active. You'll need your authenticator app to sign in.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Recent Login Attempts */}
      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          Recent Login Attempts
        </h3>
        
        <div className="space-y-3">
          {loginAttempts.map((attempt) => (
            <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${attempt.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {attempt.success ? (
                    <Shield className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {attempt.success ? 'Successful login' : 'Failed login attempt'}
                    </span>
                    <Badge variant={attempt.success ? "default" : "destructive"}>
                      {attempt.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-500 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(attempt.timestamp), { addSuffix: true })}
                    </span>
                    
                    {attempt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {attempt.location}
                      </span>
                    )}
                    
                    {attempt.device && (
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {attempt.device}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5" />
          Active Sessions
        </h3>
        
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${session.is_current ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Smartphone className={`h-4 w-4 ${session.is_current ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.device_info}</span>
                    {session.is_current && (
                      <Badge variant="default">Current Session</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last active {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                    </span>
                    
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {!session.is_current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
