const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-registry');

    const container   = document.getElementById('deviceContainer');
    const searchInput = document.getElementById('deviceSearch');
    let allDevices    = [];
    let searchTerm    = '';

    // ── Auth-event hook: fires when login/logout happens in any tab ───────────
    window.onMtsAuth = function(eventName) {
        if (eventName === 'login') {
            container.innerHTML = ''; // clear ACCESS_DENIED message
            fetchDevices();
        } else if (eventName === 'logout') {
            clearInterval(refreshTimer);
            container.innerHTML = '<div style="color:var(--accent-red)">ERR: SESSION_TERMINATED. LOGIN_REQUIRED.</div>';
        }
    };

    // ── Fetch device list + enrich each with real-time /location data ─────────
    async function fetchDevices() {
        const token = localStorage.getItem('mts_token'); // always read fresh
        if (!token) {
            container.innerHTML = '<div style="color:var(--accent-red)">ERR: ACCESS_DENIED. LOGIN_REQUIRED.</div>';
            return;
        }
        try {
            const res  = await fetch(`${BACKEND_URL}/devices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Enrich each device with its latest location in parallel
            const enriched = await Promise.all(
                (data.devices || []).map(async dev => {
                    // Skip sentinel/placeholder device IDs
                    if (!dev.device_id || ['none','null','undefined'].includes(dev.device_id)) {
                        return { ...dev, live: false };
                    }
                    try {
                        const locRes = await fetch(`${BACKEND_URL}/location/${dev.device_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        // 429 — rate limited, return stale data rather than error
                        if (locRes.status === 429) return { ...dev, live: false, rateLimited: true };
                        const loc = await locRes.json();
                        if (locRes.ok && loc.latitude) {
                            return {
                                ...dev,
                                latitude:     loc.latitude,
                                longitude:    loc.longitude,
                                accuracy:     loc.accuracy,
                                last_updated: loc.timestamp || dev.last_updated,
                                live: true
                            };
                        }
                    } catch (e) {}
                    return { ...dev, live: false };
                })
            );

            allDevices = enriched;
            updateCards(allDevices.filter(d =>
                !searchTerm ||
                d.device_id.toLowerCase().includes(searchTerm) ||
                (d.owner && d.owner.toLowerCase().includes(searchTerm))
            ));
        } catch (error) {
            container.innerHTML = '<div style="color:var(--accent-red)">ERR: KERNEL_UPLINK_OFFLINE</div>';
        }
    }

    // ── In-place DOM update — create cards if missing, update values if present
    function updateCards(deviceList) {
        // Remove cards for devices no longer in list
        const existingIds = new Set(deviceList.map(d => d.device_id));
        container.querySelectorAll('[data-device-id]').forEach(el => {
            if (!existingIds.has(el.dataset.deviceId)) el.remove();
        });

        if (deviceList.length === 0 && container.children.length === 0) {
            container.innerHTML = '<div id="emptyMsg" style="color:var(--text-secondary);grid-column:span 3;text-align:center;padding:20px;">NO_MATCHING_NODES_FOUND</div>';
            return;
        }
        const emptyMsg = document.getElementById('emptyMsg');
        if (emptyMsg) emptyMsg.remove();

        deviceList.forEach(dev => {
            const signalColor = dev.live ? 'var(--accent-green)' : 'var(--accent-red)';
            const signalLabel = dev.live ? '● ONLINE' : '○ NO_SIGNAL';
            const lat = dev.latitude  ? dev.latitude.toFixed(6)  : '--';
            const lng = dev.longitude ? dev.longitude.toFixed(6) : '--';
            const acc = dev.accuracy  ? dev.accuracy.toFixed(1) + ' M' : '--';
            const ts  = dev.last_updated || 'NEVER';

            let card = container.querySelector(`[data-device-id="${dev.device_id}"]`);

            if (!card) {
                // ── Create card for first time ────────────────────────────
                card = document.createElement('div');
                card.className = 'panel';
                card.dataset.deviceId = dev.device_id;
                card.style.background = 'rgba(0, 242, 255, 0.03)';
                card.innerHTML = `
                    <div class="panel-header">
                        <i class="fa-solid fa-microchip"></i>
                        <h3 style="font-size:0.6rem;flex:1;">${dev.device_id}</h3>
                        <span class="sig-badge" style="font-size:0.5rem;font-family:var(--font-mono);color:${signalColor};">${signalLabel}</span>
                    </div>
                    <div class="stat-box" style="margin-bottom:10px">
                        <div class="stat-label">LAST_SYNC</div>
                        <div class="ts-val stat-val" style="font-size:0.55rem;word-break:break-all;">${ts}</div>
                    </div>
                    <div class="telemetry-grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px;">
                        <div class="stat-box"><div class="stat-label">LAT</div><div class="lat-val stat-val" style="font-size:0.65rem;">${lat}</div></div>
                        <div class="stat-box"><div class="stat-label">LNG</div><div class="lng-val stat-val" style="font-size:0.65rem;">${lng}</div></div>
                        <div class="stat-box"><div class="stat-label">ACC</div><div class="acc-val stat-val" style="font-size:0.65rem;">${acc}</div></div>
                    </div>
                    <button class="btn-subtle" style="margin-top:10px;width:100%"
                        onclick="trackNode('${dev.device_id}')">
                        <i class="fa-solid fa-location-crosshairs"></i> TRACK_NODE
                    </button>
                `;
                container.appendChild(card);
            } else {
                // ── Update values in-place (no flicker) ──────────────────
                card.querySelector('.sig-badge').textContent  = signalLabel;
                card.querySelector('.sig-badge').style.color  = signalColor;
                card.querySelector('.ts-val').textContent     = ts;
                card.querySelector('.lat-val').textContent    = lat;
                card.querySelector('.lng-val').textContent    = lng;
                card.querySelector('.acc-val').textContent    = acc;
            }
        });
    }

    // ── Navigate to Geo Tracker with device pre-selected ─────────────────────
    window.trackNode = function(deviceId) {
        localStorage.setItem('mts_track_device', deviceId);
        window.location.href = 'geotracker.html';
    };

    // ── Search filter ─────────────────────────────────────────────────────────
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        const filtered = allDevices.filter(d =>
            d.device_id.toLowerCase().includes(searchTerm) ||
            (d.owner && d.owner.toLowerCase().includes(searchTerm))
        );
        updateCards(filtered);
    });

    // ── Initial load + auto-refresh every 30 seconds ───────────────────────────
    let refreshTimer = null;
    fetchDevices();
    refreshTimer = setInterval(fetchDevices, 30000); // 30s to avoid rate-limiting
});
