const leftFeatures = [
    { id: 'nav-nexus', href: 'dashboard.html', title: 'Command Nexus', icon: 'fa-grip' },
    { id: 'nav-telemetry', href: 'telemetry.html', title: 'Telemetry Stream', icon: 'fa-wave-square' },
    { id: 'nav-tracking', href: 'geotracker.html', title: 'Geo-Mapping', icon: 'fa-location-dot' },
    { id: 'nav-map', href: 'mapview.html', title: 'Map View', icon: 'fa-globe' },
    { id: 'nav-security', href: 'sentinel.html', title: 'Sentinel Core', icon: 'fa-shield-halved' },
    { id: 'nav-alerts', href: 'threatmatrix.html', title: 'Threat Matrix', icon: 'fa-bell' },
    { id: 'nav-scanner', href: 'threatscanner.html', title: 'Threat Scanner', icon: 'fa-satellite-dish' },
    { id: 'nav-hardware', href: 'hardwarenexus.html', title: 'Hardware Nexus', icon: 'fa-microchip' },
    { id: 'nav-registry', href: 'deviceregistry.html', title: 'Device Registry', icon: 'fa-list-check' },
    { id: 'nav-network', href: 'networkmatrix.html', title: 'Network Matrix', icon: 'fa-network-wired' }
];

const rightFeatures = [
    { id: 'nav-monitor', href: 'networkmonitor.html', title: 'Network Monitor', icon: 'fa-chart-line' },
    { id: 'nav-analytics', href: 'aianalytics.html', title: 'AI Analytics', icon: 'fa-brain' },
    { id: 'nav-archive', href: 'archivenode.html', title: 'Archive Node', icon: 'fa-box-archive' },
    { id: 'nav-sessions', href: 'sessionlogs.html', title: 'Session Logs', icon: 'fa-user-clock' },
    { id: 'nav-ops', href: 'remoteops.html', title: 'Remote Ops', icon: 'fa-terminal' },
    { id: 'nav-commands', href: 'remotecommands.html', title: 'Remote Commands', icon: 'fa-code' },
    { id: 'nav-export', href: 'dataexport.html', title: 'Data Export', icon: 'fa-file-export' },
    { id: 'nav-cloud', href: 'cloudsync.html', title: 'Cloud Sync', icon: 'fa-cloud-arrow-up' },
    { id: 'nav-admin', href: 'operatorconsole.html', title: 'Operator Console', icon: 'fa-user-shield' },
    { id: 'nav-forge', href: 'systemforge.html', title: 'System Forge', icon: 'fa-gear' }
];

function generateLink(f, activeId) {
    return `<a href="${f.href}" id="${f.id}" title="${f.title}" class="${f.id === activeId ? 'active' : ''}"><i class="fa-solid ${f.icon}"></i></a>`;
}

function injectSidebar(activeId) {
    const token = localStorage.getItem('mts_token');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!token && currentPage !== 'dashboard.html' && currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'dashboard.html';
        return;
    }

    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;

    // Check if we already have sidebars
    let leftSidebar = document.querySelector('.sidebar.left-sidebar');
    let rightSidebar = document.querySelector('.sidebar.right-sidebar');
    let legacySidebar = document.querySelector('.sidebar:not(.left-sidebar):not(.right-sidebar)');

    if (legacySidebar) legacySidebar.style.display = 'none';

    if (!leftSidebar) {
        leftSidebar = document.createElement('nav');
        leftSidebar.className = 'sidebar left-sidebar';
        appContainer.insertBefore(leftSidebar, appContainer.firstChild);
    }

    if (!rightSidebar) {
        rightSidebar = document.createElement('nav');
        rightSidebar.className = 'sidebar right-sidebar';
        appContainer.appendChild(rightSidebar);
    }

    // Logo for left sidebar
    const isRoot = currentPage === 'index.html' || currentPage === '';
    const logoPath = isRoot ? 'favicon.png' : '../favicon.png';
    
    const logo = `
        <div class="side-logo" onclick="window.location.href='${isRoot ? 'pages/dashboard.html' : 'dashboard.html'}'">
            <img src="${logoPath}" alt="MTS Logo" style="width:100%; height:100%; object-fit:contain; border-radius:4px;">
        </div>
    `;

    leftSidebar.innerHTML = logo + '<div class="side-links">' + leftFeatures.map(f => generateLink(f, activeId)).join('') + '</div>';
    rightSidebar.innerHTML = '<div class="side-links">' + rightFeatures.map(f => generateLink(f, activeId)).join('') + '</div>';

    // Mobile Menubar (hidden on desktop)
    let mobileMenu = document.querySelector('.mobile-menubar');
    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menubar';
        document.body.appendChild(mobileMenu);
    }
    const allFeatures = [...leftFeatures, ...rightFeatures];
    mobileMenu.innerHTML = allFeatures.map(f => generateLink(f, activeId)).join('');
}

function updateUTC() {
    const utcEl = document.getElementById('utcTime');
    if (utcEl) {
        const now = new Date();
        utcEl.textContent = `UTC ${now.toUTCString().split(' ')[4]} ${now.getUTCDate()}/${now.getUTCMonth()+1}/${now.getUTCFullYear()}`;
    }
}

setInterval(updateUTC, 1000);
updateUTC();

async function logActivity(msg, type = 'INFO') {
    console.log(`[MTS_${type}] ${msg}`);
    const token = localStorage.getItem('mts_token');
    if (token) {
        try {
            await fetch('http://localhost:5000/vault/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ event: msg, type: type, ip: 'WEB_CLIENT' })
            });
        } catch (e) {}
    }
}
