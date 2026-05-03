const SUPABASE_URL = 'https://rayqkicmlgbjawnyxjml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXFraWNtbGdiamF3bnl4am1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTQxNDgsImV4cCI6MjA5MzE5MDE0OH0.Sa1KJGVGNL9m7m60FNup3SF66u8HudYFo9AR0CSSuik';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function requireAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }
  return session;
}

async function signOut() {
  await db.auth.signOut();
  window.location.href = 'login.html';
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function translateAuthError(message) {
  const map = {
    'Invalid login credentials': 'Email o password errati',
    'Email not confirmed': 'Conferma prima la tua email',
    'User already registered': 'Email già registrata',
    'Password should be at least 6 characters': 'Password di almeno 6 caratteri',
    'signup is disabled': 'Registrazioni momentaneamente disabilitate',
    'over_email_send_rate_limit': 'Troppi tentativi, riprova tra qualche minuto',
  };
  for (const [key, val] of Object.entries(map)) {
    if (message.includes(key)) return val;
  }
  return message;
}

// ─── TOAST NOTIFICATIONS ─────────────────────────────────────────────────────

(function initToastStyles() {
  if (document.getElementById('sya-toast-styles')) return;
  const s = document.createElement('style');
  s.id = 'sya-toast-styles';
  s.textContent = `
    #toast-container {
      position: fixed; bottom: 2rem; right: 2rem;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 9999; pointer-events: none;
    }
    .sya-toast {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 18px; border-radius: 10px;
      font-family: 'DM Sans', sans-serif; font-size: 14px;
      min-width: 260px; max-width: 380px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      backdrop-filter: blur(12px);
      pointer-events: all; cursor: pointer;
      transform: translateX(120%); opacity: 0;
      transition: transform 0.35s cubic-bezier(.175,.885,.32,1.275), opacity 0.35s ease;
    }
    .sya-toast.show { transform: translateX(0); opacity: 1; }
    .sya-toast-success { background: rgba(10,10,10,0.95); border: 1px solid rgba(95,255,154,0.3); color: #5fff9a; }
    .sya-toast-error   { background: rgba(10,10,10,0.95); border: 1px solid rgba(255,95,95,0.3); color: #ff5f5f; }
    .sya-toast-info    { background: rgba(10,10,10,0.95); border: 1px solid rgba(200,245,90,0.3); color: #c8f55a; }
    .toast-icon { font-size: 16px; flex-shrink: 0; }
    .toast-msg { color: #f0ede8; }
    .toast-sub { font-size: 12px; color: #888; margin-top: 2px; }
  `;
  document.head.appendChild(s);
})();

function showToast(message, type = 'success', subtitle = '', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `sya-toast sya-toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div><div class="toast-msg">${message}</div>${subtitle ? `<div class="toast-sub">${subtitle}</div>` : ''}</div>
  `;
  toast.onclick = () => dismissToast(toast);
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 350);
}

// ─── SKELETON LOADING ─────────────────────────────────────────────────────────

(function initSkeletonStyles() {
  if (document.getElementById('sya-skel-styles')) return;
  const s = document.createElement('style');
  s.id = 'sya-skel-styles';
  s.textContent = `
    .skel {
      background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
      background-size: 200% 100%;
      animation: skel-shimmer 1.6s infinite;
      border-radius: 6px;
    }
    @keyframes skel-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skel-card {
      background: #141414; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 1.25rem;
    }
    .skel-icon { width: 36px; height: 36px; border-radius: 8px; margin-bottom: 12px; }
    .skel-title { height: 16px; width: 60%; margin-bottom: 10px; }
    .skel-text  { height: 12px; width: 100%; margin-bottom: 6px; }
    .skel-text.short { width: 40%; }
    .skel-row   { height: 48px; border-radius: 8px; margin-bottom: 8px; }
    .skel-stat  { height: 80px; border-radius: 12px; }
  `;
  document.head.appendChild(s);
})();

function skeletonCards(count = 6) {
  return Array(count).fill(0).map(() => `
    <div class="skel-card">
      <div class="skel skel-icon"></div>
      <div class="skel skel-title"></div>
      <div class="skel skel-text"></div>
      <div class="skel skel-text short"></div>
    </div>`).join('');
}

function skeletonRows(count = 4) {
  return Array(count).fill(0).map(() => `<div class="skel skel-row"></div>`).join('');
}

function skeletonStats(count = 3) {
  return Array(count).fill(0).map(() => `<div class="skel skel-stat"></div>`).join('');
}

// ─── MOBILE SIDEBAR ───────────────────────────────────────────────────────────

(function initMobileMenu() {
  if (document.getElementById('sya-mobile-styles')) return;
  const s = document.createElement('style');
  s.id = 'sya-mobile-styles';
  s.textContent = `
    .sidebar-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); z-index: 99;
      backdrop-filter: blur(2px);
    }
    .sidebar-overlay.open { display: block; }
    .hamburger {
      display: none; position: fixed; top: 1rem; left: 1rem; z-index: 101;
      width: 40px; height: 40px; background: #141414;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
      cursor: pointer; align-items: center; justify-content: center;
      flex-direction: column; gap: 5px; padding: 10px;
    }
    .hamburger span {
      display: block; width: 100%; height: 2px;
      background: #f0ede8; border-radius: 2px;
      transition: all 0.25s ease;
    }
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; z-index: 100; }
      .sidebar.open { transform: translateX(0); }
      .main { margin-left: 0 !important; }
    }
  `;
  document.head.appendChild(s);

  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = closeMobileMenu;
    document.body.appendChild(overlay);

    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    hamburger.onclick = toggleMobileMenu;
    document.body.appendChild(hamburger);
  });
})();

function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar?.classList.toggle('open');
  overlay?.classList.toggle('open');
}
function closeMobileMenu() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');
}

// ─── BUTTON LOADING ───────────────────────────────────────────────────────────

function setBtnLoading(btn, loading, originalText) {
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.65' : '1';
  if (loading) { btn.dataset.originalText = btn.textContent; btn.textContent = 'Caricamento...'; }
  else { btn.textContent = originalText || btn.dataset.originalText || btn.textContent; }
}
