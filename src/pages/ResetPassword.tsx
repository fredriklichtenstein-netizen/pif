
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenVerified, setTokenVerified] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const checkToken = async () => {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes("access_token")) {
        console.error("Invalid or missing token in URL:", window.location.href);
        setTokenVerified(false);
        setError(t('auth.link_expired_description'));
        return;
      }
      
      try {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (!accessToken) {
          throw new Error("No access token found in URL");
        }
        
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });
        
        if (error) {
          console.error("Error verifying token:", error);
          throw error;
        }
        
        if (!data.session) {
          throw new Error("No session returned when verifying token");
        }
        
        console.log("Token verified successfully");
        setTokenVerified(true);
        
      } catch (err: any) {
        console.error("Token verification failed:", err);
        setTokenVerified(false);
        setError(err.message || t('auth.link_expired_description'));
      }
    };
    
    checkToken();
  }, []);

  const validateForm = () => {
    if (password.length < 6) {
      setError(t('auth.password_min_length'));
      return false;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwords_do_not_match'));
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      toast({
        title: t('auth.password_updated'),
        description: t('auth.password_updated_description'),
      });
      
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setError(error.message || t('auth.failed_reset_password'));
    } finally {
      setLoading(false);
    }
  };

  if (tokenVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t('auth.verifying_reset_link')}</h2>
          <p className="text-muted-foreground">{t('auth.verifying_reset_link_description')}</p>
        </div>
      </div>
    );
  }

  if (tokenVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('auth.link_expired')}</AlertTitle>
            <AlertDescription>{error || t('auth.link_expired_description')}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              {t('auth.back_to_login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t('auth.password_reset_successful')}</h2>
          <p className="text-muted-foreground">
            {t('auth.password_reset_redirect')}
          </p>
          <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
            {t('auth.go_to_login')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            {t('auth.reset_password_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t('auth.reset_password_subtitle')}
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="password">{t('auth.new_password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.new_password_placeholder')}
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="confirm-password">{t('auth.confirm_password')}</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirm_password_placeholder')}
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('auth.reset_password')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
