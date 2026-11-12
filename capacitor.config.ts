import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.haheho.app',        // PERMANENT after first store upload — do not change
  appName: 'Haheho AI',
  webDir: 'www',                 // local fallback only; runtime UI is served by Django

  // The shell loads the Django-served UI directly. Shared by BOTH apps
  // (Haheho AI + Inpatient AI Agent).
  // Test builds → dev. Before store-submission builds, switch this ONE line to
  // stage (https://stage2.haheho.ai), then `npx cap sync` and rebuild.
  server: {
    url: 'https://dev.haheho.ai',
    cleartext: false,
    // Page the app opens on — same as the home-screen web app (manifest start_url).
    // The login page resumes a saved session / remembered ward itself; starting on
    // "/" would load patient home first and bounce back here on every launch.
    appStartPath: '/auth/login/',
    // Shown (from www/) when the site can't be loaded, e.g. no internet.
    errorPath: 'offline.html'
  },

  // Appended to the WebView user agent so Django / logs / analytics can
  // identify requests coming from the native app (server matches "HahehoApp/").
  // The inpatient app adds " HahehoInpatient" after this, natively
  // (Android: USER_AGENT_TAG in app/build.gradle).
  appendUserAgent: 'HahehoApp/0.1',

  android: {
    flavor: 'haheho'             // default for `npx cap run android`; use --flavor inpatient for the other app
  },

  ios: {
    contentInset: 'automatic'
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 500,   // soft fade into the site instead of a hard cut
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;
