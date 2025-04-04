
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add version timestamp for cache busting
const version = `v=${Date.now()}`;
console.log(`App initialized with version: ${version}`);

// Performance tracking metrics
const metrics = {
  startTime: performance.now(),
  firstContentfulPaint: 0,
  timeToInteractive: 0,
  totalLoadTime: 0
};

// Performance monitoring
window.addEventListener('load', () => {
  metrics.totalLoadTime = Math.round(performance.now() - metrics.startTime);
  console.log(`App loaded in ${metrics.totalLoadTime}ms`);
  
  // Report performance metrics
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = Math.round(entry.startTime);
          console.log(`First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
        }
        if (entry.name === 'first-input-delay') {
          console.log(`First Input Delay: ${Math.round(entry.duration)}ms`);
        }
      });
    });
    
    observer.observe({ type: 'paint', buffered: true });
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.log('Performance API not fully supported');
  }
  
  // Add resource hints for commonly needed resources
  const addResourceHint = (url: string, type: 'preconnect' | 'dns-prefetch' | 'preload') => {
    const link = document.createElement('link');
    link.rel = type;
    link.href = url;
    if (type === 'preload') {
      link.as = url.includes('.css') ? 'style' : 
                url.includes('.js') ? 'script' : 
                url.includes('.jpg') || url.includes('.png') ? 'image' : 'fetch';
    }
    document.head.appendChild(link);
  };
  
  // Add preconnect for Supabase and Mapbox
  addResourceHint('https://fzejimpdheswqrojjvmf.supabase.co', 'preconnect');
  addResourceHint('https://api.mapbox.com', 'preconnect');
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Track error
  try {
    const errorDetails = {
      message: event.error?.message || 'Unknown error',
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    localStorage.setItem('last_error', JSON.stringify(errorDetails));
    
    // If we have multiple errors in short succession, refresh the page
    const errorCount = parseInt(localStorage.getItem('error_count') || '0');
    if (errorCount > 5) {
      localStorage.setItem('error_count', '0');
      // Add a small delay before reload to avoid reload loops
      setTimeout(() => window.location.reload(), 1000);
    } else {
      localStorage.setItem('error_count', (errorCount + 1).toString());
      setTimeout(() => localStorage.setItem('error_count', '0'), 30000);
    }
  } catch (e) {
    // Ignore errors in the error handler
  }
  
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
