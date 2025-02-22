
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.afa641b49b2840d19e3f5a968badbb5f',
  appName: 'pifapp',
  webDir: 'dist',
  server: {
    url: 'https://afa641b4-9b28-40d1-9e3f-5a968badbb5f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: true
    }
  }
};

export default config;
