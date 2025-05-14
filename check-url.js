// Script to check the origin and callback URL
console.log("Current origin:", typeof window !== 'undefined' ? window.location.origin : 'Not in browser context');
console.log("Callback URL:", typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'Not in browser context'); 