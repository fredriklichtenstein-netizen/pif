
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export function EmailPasswordSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useState(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email || "");
      }
    };
    fetchUserEmail();
  });

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;

      setSuccess(t('settings.email_update_requested_description'));
      toast({
        title: t('settings.email_update_requested'),
        description: t('settings.email_update_requested_description'),
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: t('settings.email_update_failed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwords_dont_match'));
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) throw new Error(t('settings.current_password_incorrect'));

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccess(t('settings.password_updated'));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: t('status.success'),
        description: t('settings.password_update_success'),
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: t('settings.password_update_failed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-primary/10 text-primary border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={updateEmail} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('settings.email_address')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {t('settings.update_email')}
        </Button>
      </form>

      <div className="my-6 border-t border-border" />

      <form onSubmit={updatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">{t('settings.current_password')}</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-password">{t('settings.new_password')}</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t('settings.confirm_new_password')}</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <Button type="submit" disabled={loading}>
          {t('settings.update_password')}
        </Button>
      </form>
    </div>
  );
}
