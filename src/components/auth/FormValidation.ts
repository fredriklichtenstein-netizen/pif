
export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export function validateAuthForm(email: string, password: string): ValidationResult {
  if (!email) {
    return {
      isValid: false,
      error: "Email is required"
    };
  }
  
  if (!password) {
    return {
      isValid: false,
      error: "Password is required"
    };
  }
  
  if (password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters"
    };
  }
  
  return {
    isValid: true,
    error: ""
  };
}
