// config-loader.js
// Runs on the PUBLIC site (index.html) at startup.
// Reads config/settings from Firestore (or localStorage) and applies every flag.

(async function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const FIREBASE_CFG = {
    apiKey: "AIzaSyB0BWEEHzCYdU50578Kz9gGLQ1GxDGI7cg",
    authDomain: "chatscroll-c7aa0.firebaseapp.com",
    projectId: "chatscroll-c7aa0",
    storageBucket: "chatscroll-c7aa0.firebasestorage.app",
    messagingSenderId: "210681479894",
    appId: "1:210681479894:web:d3cbcaec22f9409cb3ff77"
  };

  async function fetchConfig() {
    // Try Firestore first
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CFG);
        const db = firebase.firestore();
        const doc = await db.collection('config').doc('settings').get();
        if (doc.exists) return doc.data();
      }
    } catch (e) {
      console.warn('[config-loader] Firestore unavailable, using localStorage:', e.message);
    }
    // Fallback to localStorage (set by admin panel when Firestore also fails)
    try { return JSON.parse(localStorage.getItem('chatscroll_config') || '{}'); } catch (_) { return {}; }
  }

  // ── Apply settings ─────────────────────────────────────────────────────────
  const cfg = await fetchConfig();
  window._appConfig = cfg; // expose globally for other scripts

  if (window.DEBUG || cfg.debug) {
    window.DEBUG = true;
    console.log('[config-loader] Config loaded:', cfg);
  }

  // ── 1. MAINTENANCE MODE ──────────────────────────────────────────────────
  if (cfg.maintenance) {
    document.documentElement.innerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ChatScroll – Under Maintenance</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#0a0a12;color:#f0f2f5;min-height:100vh;
         display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;
         background-image:radial-gradient(ellipse at 20% 20%,rgba(37,211,102,.12) 0,transparent 50%),
                          radial-gradient(ellipse at 80% 80%,rgba(124,58,237,.12) 0,transparent 50%)}
    .icon{font-size:64px;margin-bottom:24px;animation:pulse 2s ease-in-out infinite}
    @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.8}}
    h1{font-size:clamp(28px,5vw,48px);font-weight:800;background:linear-gradient(135deg,#25d366,#00bfa5);
       -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px}
    p{font-size:16px;color:#9aa3ae;max-width:480px;line-height:1.6;margin-bottom:32px}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(37,211,102,.15);
           border:1px solid rgba(37,211,102,.3);border-radius:999px;padding:10px 20px;
           color:#25d366;font-weight:600;font-size:14px}
    .dot{width:8px;height:8px;border-radius:50%;background:#25d366;animation:blink 1.4s ease infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
    .note{margin-top:40px;font-size:13px;color:#5a6270}
  </style>
</head>
<body>
  <div class="icon">🚧</div>
  <h1>We'll Be Back Soon</h1>
  <p>ChatScroll is currently undergoing scheduled maintenance. We're working hard to bring you an improved experience. Please check back shortly.</p>
  <div class="badge"><span class="dot"></span> Maintenance in progress</div>
  <p class="note">If you have an urgent query, email us at chatscroll@support.com</p>
</body>
</html>`;
    return; // Stop all further execution
  }

  // ── 2. BANNER MESSAGE ────────────────────────────────────────────────────
  if (cfg.bannerText && cfg.bannerText.trim()) {
    const banner = document.createElement('div');
    banner.id = 'app-banner';
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9998',
      'background:linear-gradient(90deg,#25d366,#00bfa5)',
      'color:#fff', 'font-family:Inter,sans-serif', 'font-size:14px',
      'font-weight:600', 'text-align:center', 'padding:10px 48px 10px 16px',
      'box-shadow:0 2px 12px rgba(37,211,102,.35)'
    ].join(';');
    banner.innerHTML = `📢 ${cfg.bannerText}
      <button onclick="this.parentElement.remove()" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);
        background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">✕</button>`;
    // Insert after body loads
    if (document.body) {
      document.body.prepend(banner);
      document.body.style.paddingTop = (document.body.style.paddingTop || '0px');
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.prepend(banner));
    }
  }

  // ── 3. DISABLE PDF DOWNLOADS ─────────────────────────────────────────────
  if (cfg.disablePdf) {
    // Override downloadPDF globally before it is called
    window._pdfDisabled = true;
    // Also hide buttons after DOM is ready
    function hidePdfBtns() {
      document.querySelectorAll('.btn-pdf, [onclick*="downloadPDF"]').forEach(el => {
        el.style.display = 'none';
        el.disabled = true;
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hidePdfBtns);
    } else {
      hidePdfBtns();
      // Re-run after a delay for dynamically added buttons
      setTimeout(hidePdfBtns, 1500);
    }
  }

  // ── 4. DISABLE FEEDBACK FORMS ────────────────────────────────────────────
  if (cfg.disableFeedback) {
    window._feedbackDisabled = true;
    function disableFeedbackForms() {
      // Hide submit buttons and show notice
      document.querySelectorAll('form').forEach(form => {
        const isContact = form.id && (form.id.toLowerCase().includes('contact') || form.id.toLowerCase().includes('feedback'));
        if (!isContact) return;
        const notice = document.createElement('p');
        notice.style.cssText = 'color:#f59e0b;font-size:13px;text-align:center;margin-top:8px;padding:8px;background:rgba(245,158,11,.1);border-radius:8px;';
        notice.textContent = '⚠️ Feedback submission is temporarily unavailable. Please try again later.';
        form.appendChild(notice);
        form.querySelectorAll('[type="submit"]').forEach(btn => btn.disabled = true);
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', disableFeedbackForms);
    } else {
      setTimeout(disableFeedbackForms, 500);
    }
  }

  // ── 5. READ-ONLY MODE ────────────────────────────────────────────────────
  if (cfg.readOnly) {
    window._readOnly = true;
    function applyReadOnly() {
      // Disable all action buttons except theme/language toggles
      document.querySelectorAll('.btn-action, .btn-pdf, button[onclick*="download"]').forEach(btn => {
        if (!btn.closest('.theme-btn') && !btn.id?.includes('lang')) {
          btn.disabled = true;
          btn.title = 'Temporarily unavailable (read-only mode)';
          btn.style.opacity = '0.45';
          btn.style.cursor = 'not-allowed';
        }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyReadOnly);
    } else {
      setTimeout(applyReadOnly, 500);
    }
  }

})();
