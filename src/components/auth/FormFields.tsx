
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/profile/PhoneInput";

interface FormFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  phone: string;
  countryCode: string;
  onPhoneChange: (newPhone: string, newCountryCode: string) => void;
  isSignUp: boolean;
  disabled: boolean;
  clearFormError: () => void;
}

export function FormFields({
  email,
  setEmail,
  password,
  setPassword,
  phone,
  countryCode,
  onPhoneChange,
  isSignUp,
  disabled,
  clearFormError
}: FormFieldsProps) {
  return (
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
          onChange={(e) => {
            setEmail(e.target.value);
            clearFormError();
          }}
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
          placeholder="Enter your email"
          disabled={disabled}
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
          onChange={(e) => {
            setPassword(e.target.value);
            clearFormError();
          }}
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
          placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
          minLength={6}
          disabled={disabled}
        />
      </div>
      
      {isSignUp && (
        <div>
          <Label htmlFor="phone">Phone number (optional)</Label>
          <PhoneInput
            value={phone}
            countryCode={countryCode}
            onPhoneChange={(newPhone, newCountryCode) => {
              onPhoneChange(newPhone, newCountryCode);
              clearFormError();
            }}
            required={false}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
