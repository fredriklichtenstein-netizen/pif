import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const TwoFactorSetup = ({ isEnabled, onToggle }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [secretKey] = useState('JBSWY3DPEHPK3PXP'); // Mock secret for demo
  const { toast } = useToast();

  const handleEnable2FA = () => {
    setStep('verify');
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      onToggle(true);
      setStep('complete');
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      });
    }
  };

  const handleDisable2FA = () => {
    onToggle(false);
    setStep('setup');
    toast({
      title: "2FA Disabled",
      description: "Two-factor authentication has been disabled.",
    });
  };

  if (isEnabled && step !== 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Your account is protected with two-factor authentication.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Recovery Codes
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDisable2FA}
            >
              Disable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
          <Badge variant="outline">Disabled</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'setup' && (
          <>
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your account with 2FA.
            </p>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium">Authenticator App Required</p>
                <p className="text-gray-600">Use Google Authenticator, Authy, or similar</p>
              </div>
            </div>
            <Button onClick={handleEnable2FA} className="w-full">
              Set Up 2FA
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <QrCode className="h-24 w-24 text-gray-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app
              </p>
              
              <div className="p-3 bg-gray-50 rounded border font-mono text-sm break-all">
                {secretKey}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <Input
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('setup')}>
                  Back
                </Button>
                <Button onClick={handleVerify} disabled={verificationCode.length !== 6}>
                  Verify & Enable
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-green-800">2FA Successfully Enabled!</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your account is now more secure
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex items-start gap-2">
                <Key className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-left">
                  <p className="font-medium text-yellow-800">Save Your Recovery Codes</p>
                  <p className="text-yellow-700">
                    Store these codes in a safe place in case you lose access to your phone
                  </p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={() => setStep('setup')}>
              Continue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};