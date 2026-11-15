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
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 600,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
};

export default config;
