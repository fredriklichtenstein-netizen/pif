
// Browser polyfills for compatibility
console.log('Loading browser polyfills...');

// Ensure global objects exist
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Add any other necessary polyfills
console.log('Browser polyfills loaded successfully');
