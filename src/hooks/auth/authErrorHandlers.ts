
export function getAuthErrorMessage(error: any): string {
  if (!error) return "";
  
  if (error.message?.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  } else if (
    error.message?.includes("Load failed") || 
    error.message?.includes("fetch failed") ||
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("Network Error")
  ) {
    return "Connection error. Please check your internet and try again.";
  } else if (error.message?.includes("Email not confirmed")) {
    return "Email not confirmed. Please check your inbox and confirm your email before signing in.";
  } else {
    return error.message || "Authentication failed. Please try again.";
  }
}

export function isNetworkError(error: any): boolean {
  if (!error?.message) return false;
  
  return (
    error.message.includes("Load failed") || 
    error.message.includes("fetch failed") ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("Network Error")
  );
}
