
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add version timestamp for cache busting
const version = `v=${Date.now()}`;
console.log(`App initialized with version: ${version}`);

// Set document title
document.title = "PIF - Pay It Forward";

createRoot(document.getElementById("root")!).render(<App />);

// Add cache busting parameter to all favicon links
const updateFaviconLinks = () => {
  const links = document.querySelectorAll("link[rel*='icon']");
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.includes('?v=')) {
      link.setAttribute('href', `${href}?v=${Date.now()}`);
    }
  });
};

// Run cache busting for favicons
updateFaviconLinks();
