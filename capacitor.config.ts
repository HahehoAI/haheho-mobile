import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.haheho.app',        // PERMANENT after first store upload — do not change
  appName: 'Haheho AI',
  webDir: 'www',                 // local fallback only; runtime UI is served by Django

  // The shell loads the Django-served UI directly.
  // TEMPORARY DOMAIN — switch to the production domain before store release,
  // then run `npx cap sync` and rebuild both platforms.
  server: {
    url: 'https://stage2.haheho.ai',
    cleartext: false
  },

  // Appended to the WebView user agent so Django / logs / analytics can
  // identify requests coming from the native app.
  appendUserAgent: 'HahehoApp/0.1',

  ios: {
    contentInset: 'automatic'
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;
