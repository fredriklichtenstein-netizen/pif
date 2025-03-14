
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/profile/PhoneInput";

interface AuthFormProps {
  isSignUp: boolean;
  loading: boolean;
  onSubmit: (email: string, password: string, phone?: string, countryCode?: string) => Promise<void>;
  onToggleMode: () => void;
}

export function AuthForm({ isSignUp, loading, onSubmit, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+46"); // Default to Sweden

  // Clear form fields when toggling between signup and signin modes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setPhone("");
  }, [isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await onSubmit(email, password, phone, countryCode);
    } else {
      await onSubmit(email, password);
    }
  };

  const handleToggle = () => {
    // Clear form fields before toggling mode
    setEmail("");
    setPassword("");
    setPhone("");
    onToggleMode();
  };

  const handlePhoneChange = (newPhone: string, newCountryCode: string) => {
    setPhone(newPhone);
    setCountryCode(newCountryCode);
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? "Create an account" : "Sign in to your account"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp
            ? "Start sharing with your community"
            : "Welcome back to PIF"}
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              minLength={6}
            />
          </div>
          
          {isSignUp && (
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <PhoneInput
                value={phone}
                countryCode={countryCode}
                onPhoneChange={handlePhoneChange}
                required={true}
              />
            </div>
          )}
        </div>

        <div>
          <Button
            type="submit"
            className="w-full flex justify-center py-2 px-4"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : isSignUp
              ? "Create account"
              : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={handleToggle}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </Button>
      </div>
    </div>
  );
}
