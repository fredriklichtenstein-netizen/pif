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
    // Edge to edge: the web view runs under the status bar so the feed and the
    // map show through behind the clock. The page pads its own top with
    // env(safe-area-inset-top) (see "Native app shell" in src/index.css).
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
    // Show pushes as a banner even while PIF is open (iOS hides them by
    // default for the app in front).
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
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
