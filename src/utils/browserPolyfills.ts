
// Browser-compatible polyfills for Node.js globals
// This fixes the "global is not defined" error

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
}

export {};
