
import './utils/browserPolyfills';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Add version timestamp for cache busting
const version = `v=${Date.now()}`;
console.log(`App initialized with version: ${version}`);

// Set document title
document.title = "PIF - Pay It Forward";

// Create root with error handling
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
} catch (error) {
  console.error("Failed to render app:", error);
  // Fallback rendering in case of catastrophic error
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
      <h1 style="color: #d32f2f; margin-bottom: 16px;">Something went wrong</h1>
      <p>Please try refreshing the page or come back later.</p>
      <button 
        onclick="window.location.reload()" 
        style="margin-top: 24px; padding: 8px 16px; background-color: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        Refresh Page
      </button>
    </div>
  `;
}
