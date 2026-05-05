const SUPABASE_URL = 'https://rayqkicmlgbjawnyxjml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheXFraWNtbGdiamF3bnl4am1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTQxNDgsImV4cCI6MjA5MzE5MDE0OH0.Sa1KJGVGNL9m7m60FNup3SF66u8HudYFo9AR0CSSuik';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── FAVICON ─────────────────────────────────────────────────────────────────

(function addFavicon() {
  if (document.querySelector('link[rel~="icon"]')) return;
  const link32 = document.createElement('link');
  link32.rel = 'icon'; link32.type = 'image/png'; link32.sizes = '32x32';
  link32.href = '/icons/icon-32.png';
  document.head.appendChild(link32);
  const link192 = document.createElement('link');
  link192.rel = 'icon'; link192.type = 'image/png'; link192.sizes = '192x192';
  link192.href = '/icons/icon-192.png';
  document.head.appendChild(link192);
})();

// ─── PWA META + SERVICE WORKER ───────────────────────────────────────────────

(function initPWA() {
  const head = document.head;
  function meta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    const m = document.createElement('meta'); m.name = name; m.content = content;
    head.appendChild(m);
  }
  function link(rel, href, extra) {
    if (document.querySelector('link[rel="' + rel + '"]')) return;
    const l = document.createElement('link'); l.rel = rel; l.href = href;
    if (extra) Object.assign(l, extra);
    head.appendChild(l);
  }

  meta('theme-color', '#0a0a0a');
  meta('apple-mobile-web-app-capable', 'yes');
  meta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  meta('apple-mobile-web-app-title', 'Shop Your Agent');
  meta('mobile-web-app-capable', 'yes');
  meta('msapplication-TileColor', '#0a0a0a');
  meta('msapplication-TileImage', '/icons/icon-144.png');

  link('apple-touch-icon', '/icons/icon-180.png', { sizes: '180x180' });
  link('manifest', '/manifest.json');

  // Apple splash screens
  var splashes = [
    ['(device-width:390px)and(device-height:844px)and(-webkit-device-pixel-ratio:3)',   'iphone-12-13-14'],
    ['(device-width:428px)and(device-height:926px)and(-webkit-device-pixel-ratio:3)',   'iphone-12-13-pro-max'],
    ['(device-width:393px)and(device-height:852px)and(-webkit-device-pixel-ratio:3)',   'iphone-14-pro'],
    ['(device-width:430px)and(device-height:932px)and(-webkit-device-pixel-ratio:3)',   'iphone-14-pro-max'],
    ['(device-width:375px)and(device-height:667px)and(-webkit-device-pixel-ratio:2)',   'iphone-8'],
    ['(device-width:375px)and(device-height:812px)and(-webkit-device-pixel-ratio:3)',   'iphone-x-xs'],
    ['(device-width:414px)and(device-height:896px)and(-webkit-device-pixel-ratio:2)',   'iphone-xr-11'],
    ['(device-width:1024px)and(device-height:1366px)and(-webkit-device-pixel-ratio:2)', 'ipad-pro-12'],
    ['(device-width:834px)and(device-height:1194px)and(-webkit-device-pixel-ratio:2)',  'ipad-pro-11'],
    ['(device-width:768px)and(device-height:1024px)and(-webkit-device-pixel-ratio:2)',  'ipad-air']
  ];
  splashes.forEach(function(s) {
    var l = document.createElement('link');
    l.rel = 'apple-touch-startup-image';
    l.href = '/splash/apple-splash-' + s[1] + '.png';
    l.media = s[0] + 'and(orientation:portrait)';
    head.appendChild(l);
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
    });
  }
})();

// ─── COOKIE BANNER ───────────────────────────────────────────────────────────

(function initCookieBanner() {
  if (localStorage.getItem('sya-cookies')) return;
  document.addEventListener('DOMContentLoaded', function() {
    const banner = document.createElement('div');
    banner.id = 'sya-cookie-banner';
    banner.innerHTML = `
      <span style="flex:1;min-width:200px;">
        🍪 Usiamo cookie tecnici necessari al funzionamento del sito.
        <a href="privacy.html" style="color:#c8f55a;text-decoration:none;white-space:nowrap;">Privacy Policy</a>
      </span>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button id="sya-cookie-reject" style="background:transparent;border:1px solid rgba(255,255,255,0.12);color:#888;font-family:'DM Sans',sans-serif;font-size:13px;padding:8px 14px;border-radius:6px;cursor:pointer;white-space:nowrap;">Solo necessari</button>
        <button id="sya-cookie-accept" style="background:#c8f55a;border:none;color:#0a0a0a;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 14px;border-radius:6px;cursor:pointer;white-space:nowrap;">Accetta</button>
      </div>
    `;
    Object.assign(banner.style, {
      position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: '9990',
      background: 'rgba(14,14,14,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center',
      gap: '1rem', flexWrap: 'wrap', fontFamily: "'DM Sans',sans-serif",
      fontSize: '13px', color: '#888', backdropFilter: 'blur(8px)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.4)'
    });
    document.body.appendChild(banner);
    function dismiss(val) {
      localStorage.setItem('sya-cookies', val);
      banner.style.transform = 'translateY(100%)';
      banner.style.transition = 'transform 0.3s ease';
      setTimeout(() => banner.remove(), 300);
    }
    document.getElementById('sya-cookie-accept').onclick = () => dismiss('accepted');
    document.getElementById('sya-cookie-reject').onclick = () => dismiss('rejected');
  });
})();

// ─── MOBILE NAV (public pages) ───────────────────────────────────────────────

function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  if (!nav) return;
  const isOpen = nav.classList.toggle('open');
  const btn = document.querySelector('.mobile-menu-btn');
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}
function closeMobileNav() {
  document.getElementById('mobile-nav')?.classList.remove('open');
  const btn = document.querySelector('.mobile-menu-btn');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

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
    @keyframes shimmer {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @media (max-width: 640px) {
      #toast-container { right: auto; left: 1rem; bottom: 7rem; }
    }
  `;
  document.head.appendChild(s);
})();

function showToast(message, type = 'success', subtitle = '', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-relevant', 'additions');
    container.setAttribute('aria-atomic', 'false');
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

// ─── GRAIN TEXTURE ────────────────────────────────────────────────────────────

(function injectGrain() {
  if (document.getElementById('sya-grain-styles')) return;
  const s = document.createElement('style');
  s.id = 'sya-grain-styles';
  s.textContent = `
    body::after {
      content: '';
      position: fixed; inset: 0;
      pointer-events: none; z-index: 9997;
      opacity: 0.038;
      background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='250' height='250'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='250' height='250' filter='url(%23g)'/></svg>");
      background-repeat: repeat;
      background-size: 250px 250px;
    }
    html.light body::after { opacity: 0.022; }
  `;
  document.head.appendChild(s);
})();

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
      transition: transform 0.25s ease, opacity 0.2s ease;
    }
    tr:hover td { background: rgba(255,255,255,0.05) !important; }
    html.light tr:hover td { background: rgba(0,0,0,0.04) !important; }
    @media (max-width: 768px) {
      html, body { overflow-x: hidden; }
      .hamburger { display: flex; }
      .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; z-index: 100; }
      .sidebar.open { transform: translateX(0); }
      .main { margin-left: 0 !important; }
      .tbl-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; border-radius: 12px; }
      .tbl-scroll > table { min-width: 480px; border-radius: 0; }
      img, video, iframe { max-width: 100% !important; }
      .page-header { flex-direction: column !important; align-items: flex-start !important; }
      .agents-grid { grid-template-columns: 1fr !important; }
      .modal { width: 100% !important; }
    }
  `;
  document.head.appendChild(s);

  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    // Skip injection on pages that already have their own mobile-topbar + hamburger
    if (document.querySelector('.mobile-topbar')) return;

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
  const hamburger = document.querySelector('.hamburger');
  sidebar?.classList.toggle('open');
  overlay?.classList.toggle('open');
  hamburger?.classList.toggle('open');
}
function closeMobileMenu() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');
  document.querySelector('.hamburger')?.classList.remove('open');
}

// ─── MOBILE TABLE SCROLL ─────────────────────────────────────────────────────

(function initTableScroll() {
  function wrapTables() {
    // Upgrade any .table-wrap to also use .tbl-scroll so the CSS min-width kicks in
    document.querySelectorAll('.table-wrap:not(.tbl-scroll)').forEach(function(w) {
      w.classList.add('tbl-scroll');
    });
    // Wrap any table not already inside a .tbl-scroll container
    document.querySelectorAll('table').forEach(function(table) {
      if (table.closest('.tbl-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'tbl-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }
  document.addEventListener('DOMContentLoaded', function() {
    wrapTables();
    new MutationObserver(wrapTables).observe(document.body, { childList: true, subtree: true });
  });
})();

// ─── BUTTON LOADING ───────────────────────────────────────────────────────────

function setBtnLoading(btn, loading, originalText) {
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.7' : '1';
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="display:inline-block;vertical-align:middle;animation:sya-spin 0.7s linear infinite;margin-right:7px;"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="2" opacity="0.25"/><path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span style="vertical-align:middle;">Caricamento…</span>`;
    if (!document.getElementById('sya-spin-kf')) {
      const kf = document.createElement('style');
      kf.id = 'sya-spin-kf';
      kf.textContent = '@keyframes sya-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(kf);
    }
  } else {
    btn.innerHTML = originalText || btn.dataset.originalHtml || btn.innerHTML;
  }
}

// ─── THEME & FRONTEND ENHANCEMENTS ────────────────────────────────────────────

(function initTheme() {
  // Apply saved theme immediately — before DOMContentLoaded — to prevent flash
  if (localStorage.getItem('sya-theme') === 'light') {
    document.documentElement.classList.add('light');
  }

  const s = document.createElement('style');
  s.id = 'sya-theme-styles';
  s.textContent = `
    /* ── Light theme variables ── */
    html.light {
      --bg: #f5f5f2; --surface: #ffffff; --surface2: #ececea;
      --border: rgba(0,0,0,0.07); --border2: rgba(0,0,0,0.15);
      --text: #111111; --muted: #666666;
      --accent: #5a8a00; --accent-dark: #3d6000;
    }
    html.light body { background: var(--bg); color: var(--text); }

    /* ── Transitions only during theme switch — avoids polluting hover/animation ── */
    html.theme-switching, html.theme-switching * {
      transition: background-color 0.3s ease, color 0.25s ease,
                  border-color 0.25s ease, box-shadow 0.25s ease !important;
    }

    /* ── Light mode: structural components ── */
    html.light .sidebar { background: var(--surface) !important; border-right-color: var(--border) !important; }
    html.light .hamburger { background: var(--surface) !important; border-color: var(--border2) !important; }
    html.light .hamburger span { background: var(--text) !important; }
    html.light .sidebar-overlay { background: rgba(0,0,0,0.3) !important; }
    html.light .mobile-topbar { background: var(--surface) !important; border-bottom-color: var(--border) !important; }

    /* ── Light mode: skeleton ── */
    html.light .skel {
      background: linear-gradient(90deg, #e0e0de 25%, #ebebea 50%, #e0e0de 75%);
      background-size: 200% 100%;
      animation: skel-shimmer 1.6s infinite;
    }
    html.light .skel-card { background: var(--surface) !important; border-color: var(--border) !important; }

    /* ── Light mode: toasts ── */
    html.light .sya-toast-success { background: rgba(255,255,255,0.97) !important; border-color: rgba(90,138,0,0.3) !important; color: #3d6000 !important; }
    html.light .sya-toast-error   { background: rgba(255,255,255,0.97) !important; border-color: rgba(200,50,50,0.3)  !important; color: #b01c1c !important; }
    html.light .sya-toast-info    { background: rgba(255,255,255,0.97) !important; border-color: rgba(90,138,0,0.3)   !important; color: #5a8a00 !important; }
    html.light .toast-msg { color: #111111 !important; }
    html.light .toast-sub { color: #666666 !important; }

    /* ── Light mode: cookie banner ── */
    /* ── Light mode: mobile nav ── */
    html.light .mobile-nav { box-shadow: -8px 0 40px rgba(0,0,0,0.12) !important; }
    html.light .mobile-nav-close { background: var(--surface2) !important; border-color: var(--border) !important; }
    html.light .mobile-nav-backdrop { background: rgba(0,0,0,0.3) !important; }
    /* ── Light mode: product preview ── */
    html.light .preview-window { box-shadow: 0 24px 64px rgba(0,0,0,0.12) !important; }
    html.light .preview-bot .preview-bubble { background: #f0f0ee !important; }
    /* ── Light mode: testimonials ── */
    html.light .testimonial-card { border-color: var(--border) !important; }

    html.light #sya-cookie-banner {
      background: rgba(255,255,255,0.97) !important;
      border-top-color: rgba(0,0,0,0.1) !important;
      color: #555 !important;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.1) !important;
    }

    /* ── Page fade-in ── */
    @keyframes sya-page-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    body { animation: sya-page-in 0.25s ease forwards; }

    /* ── Input focus glow ── */
    input:focus, textarea:focus, select:focus {
      box-shadow: 0 0 0 3px rgba(200,245,90,0.15) !important;
      outline: none !important;
    }
    html.light input:focus, html.light textarea:focus, html.light select:focus {
      box-shadow: 0 0 0 3px rgba(90,138,0,0.15) !important;
    }

    /* ── Button press micro-interaction ── */
    button:active, a.btn-main:active, a.btn-ghost:active { transform: scale(0.97) !important; }

    /* ── Agent card hover depth ── */
    .agent-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .agent-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.28) !important; }
    html.light .agent-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important; }

    /* ── Light mode: public page nav ── */
    html.light nav { background: rgba(245,245,242,0.9) !important; border-bottom-color: rgba(0,0,0,0.1) !important; }

    /* ── Skip navigation link ── */
    .sya-skip-link {
      position: fixed; top: -100%; left: 1rem; z-index: 10000;
      background: var(--accent, #c8f55a); color: #0a0a0a;
      font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
      padding: 10px 18px; border-radius: 8px; text-decoration: none;
      transition: top 0.2s; outline: none;
    }
    .sya-skip-link:focus { top: 1rem; }

    /* ── Logout button reset (converts <a> to <button> safely) ── */
    button.logout-btn { background: transparent; font-family: var(--font-body, 'DM Sans', sans-serif); width: 100%; }

    /* ── Password show/hide toggle ── */
    .sya-pwd-wrap { position: relative; display: flex; align-items: center; }
    .sya-pwd-wrap input { padding-right: 2.75rem !important; width: 100%; }
    .sya-pwd-eye {
      position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--muted, #999); font-size: 16px; line-height: 1;
      padding: 4px; transition: color 0.15s; user-select: none;
      display: flex; align-items: center; justify-content: center;
    }
    .sya-pwd-eye:hover { color: var(--text, #f0ede8); }

    /* ── Theme toggle button ── */
    #sya-theme-btn {
      position: fixed; bottom: 5.25rem; right: 1.25rem; z-index: 998;
      width: 40px; height: 40px;
      background: var(--surface, #141414);
      border: 1px solid var(--border2, rgba(255,255,255,0.22));
      border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; line-height: 1;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      transition: box-shadow 0.2s, transform 0.15s;
      user-select: none;
    }
    #sya-theme-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.35); }
    #sya-theme-btn:active { transform: scale(0.92) !important; }

    /* ── Back-to-top button ── */
    #sya-back-top {
      position: fixed; bottom: 1.5rem; right: 1.25rem; z-index: 997;
      width: 40px; height: 40px;
      background: var(--surface, #141414);
      border: 1px solid var(--border2, rgba(255,255,255,0.22));
      border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: var(--text, #f0ede8);
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      opacity: 0; pointer-events: none;
      transition: opacity 0.25s ease, transform 0.15s, box-shadow 0.2s;
      user-select: none;
    }
    #sya-back-top.visible { opacity: 1; pointer-events: all; }
    #sya-back-top:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.35); }
    #sya-back-top:active { transform: scale(0.92) !important; }

    /* ── Hamburger → X animation ── */
    .hamburger span { transition: transform 0.25s ease, opacity 0.2s ease; }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* ── Dashboard section fade-in ── */
    @keyframes sya-section-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .section-content.active { animation: sya-section-in 0.22s ease forwards; }

    /* ── Search clear (×) button ── */
    .sya-search-wrap { position: relative; display: inline-flex; align-items: center; width: 100%; }
    .sya-search-wrap input { padding-right: 2.25rem !important; width: 100%; }
    #sya-search-clear {
      position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--muted, #999); font-size: 18px; line-height: 1;
      padding: 2px 4px; display: none; transition: color 0.15s;
    }
    #sya-search-clear.visible { display: block; }
    #sya-search-clear:hover { color: var(--text, #f0ede8); }
  `;
  document.head.appendChild(s);

  document.addEventListener('DOMContentLoaded', function() {
    // ── Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.id = 'sya-theme-btn';
    themeBtn.setAttribute('aria-label', 'Cambia tema');
    themeBtn.title = 'Cambia tema';
    function syncThemeIcon() {
      themeBtn.textContent = document.documentElement.classList.contains('light') ? '🌙' : '☀️';
    }
    syncThemeIcon();
    themeBtn.onclick = function() {
      const isLight = document.documentElement.classList.contains('light');
      document.documentElement.classList.add('theme-switching');
      document.documentElement.classList.toggle('light', !isLight);
      localStorage.setItem('sya-theme', isLight ? 'dark' : 'light');
      syncThemeIcon();
      const tcMeta = document.querySelector('meta[name="theme-color"]');
      if (tcMeta) tcMeta.content = isLight ? '#f5f5f2' : '#0a0a0a';
      setTimeout(function() { document.documentElement.classList.remove('theme-switching'); }, 400);
    };
    document.body.appendChild(themeBtn);

    // ── Back-to-top
    const backTop = document.createElement('button');
    backTop.id = 'sya-back-top';
    backTop.setAttribute('aria-label', 'Torna su');
    backTop.title = 'Torna su';
    backTop.textContent = '↑';
    backTop.onclick = function() { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    document.body.appendChild(backTop);
    window.addEventListener('scroll', function() {
      backTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    // ── Skip navigation link
    const mainEl = document.querySelector('main, .main, [role="main"]');
    if (mainEl) {
      if (!mainEl.id) mainEl.id = 'sya-main-content';
      const skip = document.createElement('a');
      skip.className = 'sya-skip-link';
      skip.href = '#' + mainEl.id;
      skip.textContent = 'Vai al contenuto principale';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // ── Fix target="_blank" links missing rel
    document.querySelectorAll('a[target="_blank"]').forEach(function(a) {
      const rel = a.getAttribute('rel') || '';
      if (!rel.includes('noopener')) a.setAttribute('rel', (rel + ' noopener noreferrer').trim());
    });

    // ── Search clear (only when #search-input is present)
    const searchInput = document.getElementById('search-input');
    if (searchInput && !searchInput.closest('.sya-search-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'sya-search-wrap';
      searchInput.parentNode.insertBefore(wrap, searchInput);
      wrap.appendChild(searchInput);
      const clearBtn = document.createElement('button');
      clearBtn.id = 'sya-search-clear';
      clearBtn.type = 'button';
      clearBtn.setAttribute('aria-label', 'Cancella ricerca');
      clearBtn.textContent = '×';
      wrap.appendChild(clearBtn);
      searchInput.addEventListener('input', function() {
        clearBtn.classList.toggle('visible', this.value.length > 0);
      });
      clearBtn.onclick = function() {
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
      };
    }
  });
})();

// ─── ANIMATE NUMBER ───────────────────────────────────────────────────────────

function animateNumber(el, target, duration, fmt) {
  if (!el) return;
  const start = performance.now();
  const from = parseFloat(String(el.textContent).replace(/[^\d.-]/g, '')) || 0;
  if (!fmt) fmt = function(n) { return Math.round(n).toLocaleString('it-IT'); };
  (function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(from + (target - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = fmt(target);
  })(performance.now());
}

// ─── PASSWORD SHOW/HIDE ───────────────────────────────────────────────────────

(function initPasswordToggles() {
  function wrapInput(input) {
    if (!input || input.closest('.sya-pwd-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'sya-pwd-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sya-pwd-eye';
    btn.setAttribute('aria-label', 'Mostra/nascondi password');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    btn.onclick = function() {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    };
    wrap.appendChild(btn);
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[type="password"]').forEach(wrapInput);
  });
})();

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────

(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const s = document.createElement('style');
  s.textContent = `
    .sya-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.55s ease, transform 0.55s ease; }
    .sya-reveal.sya-revealed { opacity: 1; transform: translateY(0); }
    .sya-reveal-d1 { transition-delay: 0.08s; }
    .sya-reveal-d2 { transition-delay: 0.16s; }
    .sya-reveal-d3 { transition-delay: 0.24s; }
  `;
  document.head.appendChild(s);

  const SELECTORS = ['.agent-card', '.step', '.testimonial-card', '.stat-card', '.settings-block'];
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('sya-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });

  function addReveal(el, delay) {
    if (el.closest && el.closest('.hero')) return;
    if (el.classList.contains('fade-in')) return;
    if (el.classList.contains('sya-reveal')) return;
    el.classList.add('sya-reveal');
    if (delay === 1) el.classList.add('sya-reveal-d1');
    else if (delay === 2) el.classList.add('sya-reveal-d2');
    else if (delay === 3) el.classList.add('sya-reveal-d3');
    observer.observe(el);
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll(SELECTORS.join(',')).forEach(function(el, i) {
      addReveal(el, (i % 3) + 1);
    });
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          SELECTORS.forEach(function(sel) {
            if (node.matches && node.matches(sel)) addReveal(node, 1);
            (node.querySelectorAll ? node.querySelectorAll(sel) : []).forEach(function(child, i) {
              addReveal(child, (i % 3) + 1);
            });
          });
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();

// ─── CHIP ARIA-PRESSED ────────────────────────────────────────────────────────

(function initChipAria() {
  function syncChips() {
    document.querySelectorAll('.chip').forEach(function(c) {
      c.setAttribute('aria-pressed', c.classList.contains('active') ? 'true' : 'false');
    });
  }
  document.addEventListener('DOMContentLoaded', function() {
    syncChips();
    document.addEventListener('click', function(e) {
      if (e.target.closest('.chip')) setTimeout(syncChips, 0);
    });
  });
})();
