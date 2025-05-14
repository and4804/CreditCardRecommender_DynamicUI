// Auth0 configuration
// Export constants to ensure we have consistent configuration across the app

// The current Replit domain from the URL
const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

export const auth0Config = {
  domain: "dev-v4g3q7uma25d66c2.us.auth0.com",
  clientId: "uOMkgc6m0jAcRd6Z3Z56g1PA1eZnlHhQ", 
  // Use dynamic origin to handle different Replit environments
  redirectUri: `${currentDomain}/callback`,
  // Enable additional debugging for Auth0
  advancedOptions: {
    defaultScope: "openid profile email"
  }
};