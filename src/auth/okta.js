import { ref } from 'vue'
import { OktaAuth } from '@okta/okta-auth-js'

// Werte aus der Okta-Admin-Konsole, siehe .env.development
export const oktaAuth = new OktaAuth({
  issuer: import.meta.env.VITE_OKTA_ISSUER, // z. B. https://integrator-1234567.okta.com/oauth2/default
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email'],
  pkce: true,
  // Als App vom Home-Bildschirm öffnet iOS die Okta-Anmeldung in einem eigenen Fenster.
  // Im localStorage bleiben PKCE-Daten und Tokens dabei sicher erhalten.
  storageManager: {
    token: { storageType: 'localStorage' },
    transaction: { storageType: 'localStorage' },
  },
})

// Anmeldestatus für alle Komponenten
export const angemeldet = ref(false)
export const benutzer = ref(null) // { name, email, ... } aus dem ID-Token

oktaAuth.authStateManager.subscribe(async (authState) => {
  angemeldet.value = authState.isAuthenticated
  benutzer.value = authState.isAuthenticated ? await oktaAuth.getUser() : null
})

// Prüft beim Start, ob noch gültige Tokens im Browser liegen
export async function authStarten() {
  await oktaAuth.start()
  angemeldet.value = await oktaAuth.isAuthenticated()
}

export function anmelden(zielseite = '/listen') {
  oktaAuth.setOriginalUri(zielseite)
  return oktaAuth.signInWithRedirect()
}

export function abmelden() {
  return oktaAuth.signOut({ postLogoutRedirectUri: window.location.origin + '/' })
}

// Wird für den Header "Authorization: Bearer ..." an das Backend gebraucht
export function accessToken() {
  return oktaAuth.getAccessToken()
}
