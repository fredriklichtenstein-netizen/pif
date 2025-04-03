
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add version timestamp for cache busting
const version = `v=${Date.now()}`;
console.log(`App initialized with version: ${version}`);

// Performance timing
const startTime = performance.now();
window.addEventListener('load', () => {
  const loadTime = Math.round(performance.now() - startTime);
  console.log(`App loaded in ${loadTime}ms`);
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent default to avoid double-reporting
  event.preventDefault();
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default to avoid double-reporting
  event.preventDefault();
});

// Set document title
document.title = "PIF - Pay It Forward";

// Create root with concurrent mode
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  try {
    createRoot(rootElement).render(<App />);
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
}

// Add cache busting parameter to all favicon links
const updateFaviconLinks = () => {
  const links = document.querySelectorAll("link[rel*='icon']");
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.includes('?v=')) {
      try {
        // Make sure we're using encodeURI to handle any special characters
        const encodedHref = encodeURI(href);
        link.setAttribute('href', `${encodedHref}?v=${Date.now()}`);
      } catch (error) {
        console.error("Error updating favicon link:", error);
      }
    }
  });
};

// Run cache busting for favicons
updateFaviconLinks();
