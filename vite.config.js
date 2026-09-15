import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      // These dev-tooling features only make sense when the app is running
      // inside Base44's own hosted editor/preview (they call back to Base44
      // over relative, same-origin paths). This app is self-hosted on
      // GitHub Pages, so those relative calls always hit the wrong domain
      // and fail with harmless-but-noisy 404/405 console errors. Disabling
      // them removes the dead calls entirely instead of just tolerating
      // the errors.
      hmrNotifier: false,
      navigationNotifier: false,
      analyticsTracker: false,
      visualEditAgent: false
    }),
    react(),
  ]
});