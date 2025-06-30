
import { AdvancedAuthSettings } from '@/components/auth/AdvancedAuthSettings';
import { MainHeader } from '@/components/layout/MainHeader';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdvancedAuth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/account-settings')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Security & Authentication
            </h1>
            <p className="text-gray-600">
              Manage your account security, authentication methods, and privacy settings.
            </p>
          </div>

          <AdvancedAuthSettings />
        </div>
      </main>
    </div>
  );
}
