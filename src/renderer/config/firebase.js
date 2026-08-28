/**
 * ProTech ERP - Firebase SDK Initializer & Firestore Binding
 */

window.GarageFlowFirebase = {
  initialized: false,
  db: null,
  auth: null,
  storage: null,

  init: async function() {
    const statusText = document.getElementById('firebase-status-text');
    const statusDot = document.querySelector('.status-indicator-badge .dot');

    try {
      let config = {};
      if (window.electronAPI && window.electronAPI.getFirebaseConfig) {
        config = await window.electronAPI.getFirebaseConfig();
      }

      if (!config.apiKey || config.apiKey === 'YOUR_FIREBASE_API_KEY') {
        console.warn('[Firebase] Valid credentials not found in .env. Operating in Local Memory Mode.');
        if (statusText) statusText.textContent = 'Firebase Credentials Pending';
        if (statusDot) statusDot.style.background = '#eab308';
        return;
      }

      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.storage = firebase.storage();

        // Sign in anonymously if no active user to bypass basic auth rules
        try {
          if (!this.auth.currentUser) {
            await this.auth.signInAnonymously();
            console.log('[Firebase] Anonymous Auth Session Established');
          }
        } catch (authErr) {
          console.warn('[Firebase] Anonymous Auth note:', authErr.message);
        }

        // Enable offline persistence
        try {
          await this.db.enablePersistence({ synchronizeTabs: true });
          console.log('[Firebase] IndexedDB Offline Persistence Enabled.');
        } catch (persErr) {
          if (persErr.code === 'failed-precondition') {
            console.warn('[Firebase] Persistence active in primary window tab.');
          } else if (persErr.code === 'unimplemented') {
            console.warn('[Firebase] Persistence unsupported by browser.');
          }
        }

        this.initialized = true;
        console.log('[Firebase] Connected to Project:', config.projectId);
        if (statusText) statusText.textContent = `Firebase Sync Active (${config.projectId})`;
        if (statusDot) statusDot.style.background = '#10b981';
      } else {
        console.error('[Firebase] SDK scripts not loaded.');
        if (statusText) statusText.textContent = 'Firebase SDK Missing';
      }
    } catch (err) {
      console.error('[Firebase] Initialization error:', err);
      if (statusText) statusText.textContent = 'Firebase Sync Error';
      if (statusDot) statusDot.style.background = '#ef4444';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.GarageFlowFirebase) {
    window.GarageFlowFirebase.init();
  }
});
