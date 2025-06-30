
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Shield, Github, Chrome } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthMethod {
  id: string;
  type: 'email' | 'phone' | 'oauth';
  provider?: string;
  value: string;
  verified: boolean;
  primary: boolean;
  added_at: string;
}

export function AuthMethodSelector() {
  const { toast } = useToast();
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([
    {
      id: '1',
      type: 'email',
      value: 'user@example.com',
      verified: true,
      primary: true,
      added_at: new Date().toISOString()
    },
    {
      id: '2',
      type: 'phone',
      value: '+46 70 123 4567',
      verified: false,
      primary: false,
      added_at: new Date().toISOString()
    }
  ]);

  const [showAddMethod, setShowAddMethod] = useState(false);

  const getMethodIcon = (method: AuthMethod) => {
    switch (method.type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'oauth':
        if (method.provider === 'google') return <Chrome className="h-4 w-4" />;
        if (method.provider === 'github') return <Github className="h-4 w-4" />;
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleSetPrimary = async (methodId: string) => {
    setAuthMethods(prev => 
      prev.map(method => ({
        ...method,
        primary: method.id === methodId
      }))
    );

    toast({
      title: "Primary method updated",
      description: "Your primary authentication method has been changed.",
    });
  };

  const handleRemoveMethod = async (methodId: string) => {
    const method = authMethods.find(m => m.id === methodId);
    if (method?.primary) {
      toast({
        title: "Cannot remove primary method",
        description: "Set another method as primary before removing this one.",
        variant: "destructive",
      });
      return;
    }

    setAuthMethods(prev => prev.filter(m => m.id !== methodId));
    
    toast({
      title: "Authentication method removed",
      description: "The authentication method has been removed from your account.",
    });
  };

  const handleVerifyMethod = async (methodId: string) => {
    setAuthMethods(prev =>
      prev.map(method =>
        method.id === methodId ? { ...method, verified: true } : method
      )
    );

    toast({
      title: "Verification sent",
      description: "Please check your email or phone for verification instructions.",
    });
  };

  const handleAddOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;

      toast({
        title: "OAuth method added",
        description: `${provider} authentication has been linked to your account.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to add OAuth method",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">Authentication Methods</h3>
          <p className="text-sm text-gray-500">Manage how you sign in to your account</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAddMethod(!showAddMethod)}
        >
          {showAddMethod ? 'Cancel' : 'Add Method'}
        </Button>
      </div>

      <div className="space-y-3">
        {authMethods.map((method) => (
          <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                {getMethodIcon(method)}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.value}</span>
                  {method.primary && (
                    <Badge variant="default">Primary</Badge>
                  )}
                  {method.verified ? (
                    <Badge variant="secondary">Verified</Badge>
                  ) : (
                    <Badge variant="outline">Unverified</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 capitalize">
                  {method.type} {method.provider && `(${method.provider})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!method.verified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerifyMethod(method.id)}
                >
                  Verify
                </Button>
              )}
              
              {!method.primary && method.verified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetPrimary(method.id)}
                >
                  Set Primary
                </Button>
              )}
              
              {!method.primary && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveMethod(method.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddMethod && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Add Authentication Method</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleAddOAuth('google')}
              className="flex items-center gap-2"
            >
              <Chrome className="h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddOAuth('github')}
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
