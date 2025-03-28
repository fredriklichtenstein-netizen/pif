
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AuthButtonFooterProps {
  isSignUp: boolean;
  isLoading: boolean;
  onToggleMode: () => void;
  disabled: boolean;
}

export function AuthButtonFooter({
  isSignUp,
  isLoading,
  onToggleMode,
  disabled
}: AuthButtonFooterProps) {
  const buttonText = isLoading 
    ? "Processing..." 
    : (isSignUp ? "Create account" : "Sign in");

  return (
    <>
      <div>
        <Button
          type="submit"
          className="w-full flex justify-center py-2 px-4 bg-green-500 hover:bg-green-600"
          disabled={disabled}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {buttonText}
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={onToggleMode}
          className="text-green-600 hover:text-green-700"
          disabled={disabled}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </Button>
      </div>
    </>
  );
}
