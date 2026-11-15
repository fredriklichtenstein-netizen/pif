import type { CapacitorConfig } from '@capacitor/cli';

// The native apps ship the built web app (dist/) inside the binary. There is
// deliberately no `server.url`: a remote-URL wrapper fails offline and risks
// App Store rejection (guideline 4.2). See CLAUDE.md, "Native apps".
const config: CapacitorConfig = {
  appId: 'community.pif.pif',
  appName: 'PIF',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  plugins: {
    // Native sign-in sheets. Only Apple and Google are built in; the
    // Facebook SDK is left out of the binary entirely.
    SocialLogin: {
      providers: { google: true, apple: true, facebook: false, twitter: false },
      logLevel: 1,
    },
    // Keep the web view below the status bar, like the installed PWA: the
    // page never has to pad for the notch and nothing scrolls under the clock.
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#ffffff',
      style: 'LIGHT',
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 600,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
};

export default config;
