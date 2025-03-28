
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  // Check if we have the access token in the URL
  useEffect(() => {
    const checkToken = async () => {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes("access_token")) {
        console.error("Invalid or missing token in URL:", window.location.href);
        setTokenVerified(false);
        setError("Invalid or expired password reset link. Please request a new one.");
        return;
      }
      
      try {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (!accessToken) {
          throw new Error("No access token found in URL");
        }
        
        // Verify the token by trying to set the session
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
        setError(err.message || "Invalid or expired password reset link. Please request a new one.");
      }
    };
    
    checkToken();
  }, []);

  const validateForm = () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      // Redirect to login page after short delay
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while token verification is in progress
  if (tokenVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Verifying your reset link</h2>
          <p className="text-gray-600">Please wait while we verify your password reset link.</p>
        </div>
      </div>
    );
  }

  // Error state for invalid or expired token
  if (tokenVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Link expired or invalid</AlertTitle>
            <AlertDescription>{error || "Your password reset link is invalid or has expired. Please request a new one."}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => navigate("/auth")} className="bg-green-500 hover:bg-green-600">
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Password Reset Successful</h2>
          <p className="text-gray-600">
            Your password has been updated. You will be redirected to the login page shortly.
          </p>
          <Button onClick={() => navigate("/auth")} className="bg-green-500 hover:bg-green-600">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter a new password for your account.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Enter your new password (min 6 characters)"
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Confirm your new password"
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 bg-green-500 hover:bg-green-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
