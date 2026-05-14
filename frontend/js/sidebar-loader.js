// ─────────────────────────────────────────────────────────────────────────────
//  MTS ZERO-TRUST SIDEBAR CONTROLLER
//  All pages require a valid session token except dashboard.html (login page).
//  Unauthenticated visitors are immediately redirected to dashboard.html.
//  Sidebar links are rendered as LOCKED (non-navigable) when no session exists.
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_PAGES  = ['dashboard.html', 'index.html', ''];   // No auth required
const BACKEND_URL_SB = 'http://10.171.58.245:5000';

const leftFeatures = [
    { id: 'nav-nexus',    href: 'dashboard.html',    title: 'C2 Control Nexus',        icon: 'fa-grip' },
    { id: 'nav-hardware', href: 'hardwarenexus.html', title: 'Node Infrastructure',     icon: 'fa-microchip' },
    { id: 'nav-registry', href: 'deviceregistry.html',title: 'Asset Provisioning',      icon: 'fa-list-check' },
    { id: 'nav-tracking', href: 'geotracker.html',    title: 'Tactical Surveillance',   icon: 'fa-location-dot' },
    { id: 'nav-telemetry',href: 'telemetry.html',     title: 'Encrypted Telemetry',     icon: 'fa-wave-square' },
    { id: 'nav-map',      href: 'mapview.html',       title: 'Global Threat Map',       icon: 'fa-globe' },
    { id: 'nav-security', href: 'sentinel.html',       title: 'Zero-Trust Sentinel',    icon: 'fa-shield-halved' },
    { id: 'nav-alerts',   href: 'threatmatrix.html',  title: 'Alert Incident Matrix',   icon: 'fa-bell' },
    { id: 'nav-scanner',  href: 'threatscanner.html', title: 'Neural Threat Scanner',   icon: 'fa-satellite-dish' },
    { id: 'nav-network',  href: 'networkmatrix.html', title: 'Secure Topology',         icon: 'fa-network-wired' }
];

const rightFeatures = [
    { id: 'nav-monitor',  href: 'networkmonitor.html', title: 'Traffic Integrity',      icon: 'fa-chart-line' },
    { id: 'nav-analytics',href: 'aianalytics.html',   title: 'Intelligence Analytics',  icon: 'fa-brain' },
    { id: 'nav-archive',  href: 'archivenode.html',   title: 'Immutable Vault',         icon: 'fa-box-archive' },
    { id: 'nav-sessions', href: 'sessionlogs.html',   title: 'Forensic Audit Logs',     icon: 'fa-user-clock' },
    { id: 'nav-ops',      href: 'remoteops.html',     title: 'Cyber Operations',        icon: 'fa-terminal' },
    { id: 'nav-commands', href: 'remotecommands.html',title: 'Remote C2 Execution',     icon: 'fa-code' },
    { id: 'nav-export',   href: 'dataexport.html',    title: 'Secure Data Export',      icon: 'fa-file-export' },
    { id: 'nav-cloud',    href: 'cloudsync.html',     title: 'Relay Synchronization',   icon: 'fa-cloud-arrow-up' },
    { id: 'nav-admin',    href: 'operatorconsole.html',title: 'Admin Oversight',        icon: 'fa-user-shield' },
    { id: 'nav-forge',    href: 'systemforge.html',   title: 'Kernel Configuration',    icon: 'fa-gear' }
];

// ── Token validation: decode JWT expiry without a library ────────────────────
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp && Date.now() / 1000 > payload.exp;
    } catch (e) {
        return true;   // Treat malformed tokens as expired
    }
}

function getOperatorFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.identity || 'UNKNOWN';
    } catch (e) {
        return 'UNKNOWN';
    }
}

// ── Link renderer ─────────────────────────────────────────────────────────────
function generateLink(f, activeId, isAuthenticated) {
    const isDashboard = f.href === 'dashboard.html';

    if (!isAuthenticated && !isDashboard) {
        // Render as a locked, non-navigable item
        return `
          <a href="#" id="${f.id}"
             title="ACCESS DENIED — Login required"
             class="nav-locked"
             onclick="event.preventDefault(); showAuthWarning();">
            <i class="fa-solid ${f.icon}"></i>
            <i class="fa-solid fa-lock nav-lock-badge"></i>
          </a>`;
    }

    return `<a href="${f.href}" id="${f.id}" title="${f.title}"
               class="${f.id === activeId ? 'active' : ''}">
              <i class="fa-solid ${f.icon}"></i>
            </a>`;
}

// ── Flash warning when locked links are clicked ──────────────────────────────
function showAuthWarning() {
    let banner = document.getElementById('mts-auth-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'mts-auth-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
            background: rgba(255, 95, 95, 0.15);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #ff5f5f;
            color: #ff5f5f;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 2px;
            padding: 10px 20px;
            text-align: center;
            transition: opacity 0.4s ease;
        `;
        document.body.appendChild(banner);
    }
    banner.textContent = '⛔  ACCESS DENIED — OPERATOR AUTHENTICATION REQUIRED. Navigate to C2 NEXUS to login.';
    banner.style.opacity = '1';
    setTimeout(() => { banner.style.opacity = '0'; }, 3000);
}

// ── Main sidebar injector ─────────────────────────────────────────────────────
function injectSidebar(activeId) {
    const token       = localStorage.getItem('mts_token');
    const currentPage = window.location.pathname.split('/').pop();
    const isPublic    = PUBLIC_PAGES.includes(currentPage);

    // ── Step 1: Hard redirect if unauthenticated on a protected page ─────────
    if (!isPublic) {
        if (!token || isTokenExpired(token)) {
            localStorage.removeItem('mts_token');
            localStorage.removeItem('mts_user');
            window.location.replace('dashboard.html');
            return;
        }
    }

    const isAuthenticated = !!(token && !isTokenExpired(token));
    const operator        = isAuthenticated ? getOperatorFromToken(token) : null;

    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;

    // Hide legacy single sidebar if present
    const legacySidebar = document.querySelector('.sidebar:not(.left-sidebar):not(.right-sidebar)');
    if (legacySidebar) legacySidebar.style.display = 'none';

    // ── Build Left Sidebar ────────────────────────────────────────────────────
    let leftSidebar = document.querySelector('.sidebar.left-sidebar');
    if (!leftSidebar) {
        leftSidebar = document.createElement('nav');
        leftSidebar.className = 'sidebar left-sidebar';
        appContainer.insertBefore(leftSidebar, appContainer.firstChild);
    }

    const isRoot   = currentPage === 'index.html' || currentPage === '';
    const logoPath = isRoot ? 'favicon.png' : '../favicon.png';

    // Operator identity badge (only shown when authenticated)
    const operatorBadge = isAuthenticated ? `
        <div class="operator-badge" title="Logged in as ${operator}">
            <i class="fa-solid fa-circle-user"></i>
            <span>${operator}</span>
        </div>` : `
        <div class="operator-badge locked-badge" title="Not authenticated">
            <i class="fa-solid fa-user-slash"></i>
            <span>LOCKED</span>
        </div>`;

    const logo = `
        <div class="side-logo" onclick="window.location.href='${isRoot ? 'pages/dashboard.html' : 'dashboard.html'}'">
            <img src="${logoPath}" alt="MTS Logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">
        </div>`;

    leftSidebar.innerHTML = logo + operatorBadge
        + '<div class="side-links">'
        + leftFeatures.map(f => generateLink(f, activeId, isAuthenticated)).join('')
        + '</div>';

    // Logout button (only when authenticated)
    if (isAuthenticated) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className  = 'sidebar-logout-btn';
        logoutBtn.title      = 'End Session';
        logoutBtn.innerHTML  = '<i class="fa-solid fa-arrow-right-from-bracket"></i>';
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('mts_token');
            localStorage.removeItem('mts_user');
            window.location.replace('dashboard.html');
        });
        leftSidebar.appendChild(logoutBtn);
    }

    // ── Build Right Sidebar ───────────────────────────────────────────────────
    let rightSidebar = document.querySelector('.sidebar.right-sidebar');
    if (!rightSidebar) {
        rightSidebar = document.createElement('nav');
        rightSidebar.className = 'sidebar right-sidebar';
        appContainer.appendChild(rightSidebar);
    }
    rightSidebar.innerHTML = '<div class="side-links">'
        + rightFeatures.map(f => generateLink(f, activeId, isAuthenticated)).join('')
        + '</div>';

    // ── Mobile Menubar ────────────────────────────────────────────────────────
    let mobileMenu = document.querySelector('.mobile-menubar');
    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menubar';
        document.body.appendChild(mobileMenu);
    }
    const allFeatures = [...leftFeatures, ...rightFeatures];
    mobileMenu.innerHTML = allFeatures.map(f => generateLink(f, activeId, isAuthenticated)).join('');
}

// ── UTC Clock ─────────────────────────────────────────────────────────────────
function updateUTC() {
    const utcEl = document.getElementById('utcTime');
    if (utcEl) {
        const now = new Date();
        utcEl.textContent = `UTC ${now.toUTCString().split(' ')[4]} ${now.getUTCDate()}/${now.getUTCMonth()+1}/${now.getUTCFullYear()}`;
    }
}
setInterval(updateUTC, 1000);
updateUTC();

// ── Vault Activity Logger ─────────────────────────────────────────────────────
async function logActivity(msg, type = 'INFO') {
    console.log(`[MTS_${type}] ${msg}`);
    const token = localStorage.getItem('mts_token');
    if (token && !isTokenExpired(token)) {
        try {
            await fetch(`${BACKEND_URL_SB}/vault/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ event: msg, type: type, ip: 'WEB_CLIENT' })
            });
        } catch (e) {}
    }
}

// ── Global Auth Event System ───────────────────────────────────────────────────
// Pages can define window.onMtsAuth(event) to react to login/logout events.
// Fires from: BroadcastChannel (cross-tab) + storage event (same-tab fallback).

(function initAuthListener() {
    function handleAuthEvent(eventName) {
        if (typeof window.onMtsAuth === 'function') {
            window.onMtsAuth(eventName);
        }
        // Re-inject sidebar to update lock/unlock state
        const currentActive = document.querySelector('.side-links a.active');
        const activeId = currentActive ? currentActive.id : '';
        if (activeId) injectSidebar(activeId);
    }

    // BroadcastChannel: cross-tab login/logout notifications
    try {
        const channel = new BroadcastChannel('mts_auth');
        channel.addEventListener('message', (e) => {
            if (e.data && e.data.event) handleAuthEvent(e.data.event);
        });
    } catch (e) {}

    // Storage event: fires when localStorage changes (works within same origin)
    window.addEventListener('storage', (e) => {
        if (e.key === 'mts_token') {
            handleAuthEvent(e.newValue ? 'login' : 'logout');
        }
    });
})();
