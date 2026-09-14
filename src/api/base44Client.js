import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  // serverUrl is what the SDK actually uses to build API request URLs
  // (`${serverUrl}/api/...`). Left as '' it defaults to same-origin requests,
  // which only works when the app is served from Base44's own domain.
  // When the app is self-hosted elsewhere (GitHub Pages, Vercel, etc.),
  // appBaseUrl (from VITE_BASE44_APP_BASE_URL) must be used instead so
  // requests go to the real Base44 backend.
  serverUrl: appBaseUrl || '',
  requiresAuth: false,
  appBaseUrl
});
