import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.62540ff32df84ad5a58c0892f80772f9',
  appName: 'EletroPro',
  webDir: 'dist',
  server: {
    url: 'https://62540ff3-2df8-4ad5-a58c-0892f80772f9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
