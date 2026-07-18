// config.js – Admin config helper (read/write config from Firestore or localStorage)
// NOTE: This script must be loaded AFTER Firebase is initialised and DbTracker is defined.

const ConfigHelper = {
  COLLECTION: 'config',
  DOC: 'settings',

  /** Load all settings from Firestore (primary) or localStorage (fallback) */
  load: async function () {
    if (typeof DbTracker !== 'undefined' && DbTracker.isConfigured && DbTracker.isConfigured() && DbTracker.db) {
      try {
        const doc = await DbTracker.db.collection(this.COLLECTION).doc(this.DOC).get();
        if (doc.exists) return doc.data();
      } catch (e) {
        console.error('[ConfigHelper] Firestore read failed:', e);
      }
    }
    // localStorage fallback
    try { return JSON.parse(localStorage.getItem('chatscroll_config') || '{}'); } catch (_) { return {}; }
  },

  /** Save a single key/value to Firestore + localStorage */
  save: async function (key, value) {
    // Firestore (primary)
    if (typeof DbTracker !== 'undefined' && DbTracker.isConfigured && DbTracker.isConfigured() && DbTracker.db) {
      try {
        await DbTracker.db
          .collection(this.COLLECTION)
          .doc(this.DOC)
          .set({ [key]: value }, { merge: true });
        console.log(`[ConfigHelper] Saved ${key}=${value} to Firestore`);
      } catch (e) {
        console.error('[ConfigHelper] Firestore write failed:', e);
      }
    }
    // localStorage fallback (always keep in sync)
    try {
      const cfg = JSON.parse(localStorage.getItem('chatscroll_config') || '{}');
      cfg[key] = value;
      localStorage.setItem('chatscroll_config', JSON.stringify(cfg));
    } catch (_) {}
  }
};
