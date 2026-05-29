// ═══════════════════════════════════════════
// config.js — single source of truth
// Import this in every JS file
// ═══════════════════════════════════════════

const API_BASE = 'https://suraksharoad.onrender.com';

export const CONFIG = {

  API_BASE,

  // Build full URL with optional query params
  url(endpoint, params = {}) {
    const base  = API_BASE + endpoint;
    const query = new URLSearchParams(params).toString();
    return query ? `${base}?${query}` : base;
  },

  // Check if user has completed signup
  isSignedUp() {
    return localStorage.getItem('sr_signup_done') === 'true';
  },

  // Redirect to landing if not signed up — call at top of every protected page
  requireAuth() {
    if (!this.isSignedUp()) {
      window.location.replace('landing.html');
      return false;
    }
    return true;
  },

  // Redirect to home if already signed up — call on landing + signup pages
  redirectIfLoggedIn() {
    if (this.isSignedUp()) {
      window.location.replace('index.html');
    }
  }
};