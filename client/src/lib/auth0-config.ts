// Auth0 configuration
// Export constants to ensure we have consistent configuration across the app

// The current Replit domain from the URL
const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

export const auth0Config = {
  domain: "dev-x5xghr0sc8y81r2o.us.auth0.com",
  clientId: "WwgTEXitcFJKLbaFd0GasKvyqv8Qs3it", 
  // Use dynamic origin to handle different Replit environments
  redirectUri: `${currentDomain}/callback`,
  // Enable additional debugging for Auth0
  advancedOptions: {
    defaultScope: "openid profile email"
  }
};