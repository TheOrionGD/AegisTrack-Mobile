const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-tracking');

    const syncBtn      = document.getElementById('syncBtn');
    const latEl        = document.getElementById('lat');
    const lngEl        = document.getElementById('lng');
    const accEl        = document.getElementById('acc');
    const deviceSelect = document.getElementById('deviceSelect');

    let pollTimer      = null;   // auto-refresh interval handle
    let activeDeviceId = '';

    // ── Auth-event hook: fires when login/logout happens in any tab ───────────
    window.onMtsAuth = function(eventName) {
        if (eventName === 'login') {
            loadDevices(); // reload dropdown and apply any pre-selection
        } else if (eventName === 'logout') {
            stopPolling();
            deviceSelect.innerHTML = '<option value="">-- SELECT NODE --</option>';
            latEl.textContent = '--';
            lngEl.textContent = '--';
            accEl.textContent = '--';
            liveIndicator.textContent = 'SESSION TERMINATED — LOGIN REQUIRED';
        }
    };

    // ── Inject a "LIVE" pulse indicator under the dropdown ───────────────────
    const liveIndicator = document.createElement('div');
    liveIndicator.id    = 'liveIndicator';
    liveIndicator.style.cssText =
        'font-family:var(--font-mono);font-size:0.55rem;color:var(--text-secondary);' +
        'margin-top:6px;letter-spacing:1px;';
    liveIndicator.textContent = 'SELECT A NODE TO BEGIN LIVE TRACKING';
    deviceSelect.parentElement.parentElement.appendChild(liveIndicator);

    // ── Fetch latest location for the active device ───────────────────────────
    async function fetchLocation(deviceId) {
        const token = localStorage.getItem('mts_token');
        if (!token || !deviceId) return;
        try {
            const res  = await fetch(`${BACKEND_URL}/location/${deviceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // 429 — rate limited, pause and retry after 60s
            if (res.status === 429) {
                liveIndicator.innerHTML =
                    '<span style="color:var(--accent-orange)">⚠ RATE_LIMITED</span>' +
                    '&nbsp;&nbsp;Cooling down 60s...';
                stopPolling();
                setTimeout(() => startPolling(deviceId), 60000);
                return;
            }

            if (res.ok && data.latitude) {
                latEl.textContent = data.latitude.toFixed(6);
                lngEl.textContent = data.longitude.toFixed(6);
                accEl.textContent = data.accuracy ? data.accuracy.toFixed(1) + ' M' : 'N/A';
                liveIndicator.innerHTML =
                    `<span style="color:var(--accent-green)">● LIVE</span>` +
                    `&nbsp;&nbsp;LAST_POLL: ${new Date().toLocaleTimeString()}` +
                    `&nbsp;|&nbsp;AUTO-REFRESH: 8s`;
            } else {
                latEl.textContent = 'OFFLINE';
                lngEl.textContent = 'OFFLINE';
                accEl.textContent = '--';
                liveIndicator.innerHTML =
                    `<span style="color:var(--accent-red)">○ NO_SIGNAL</span>` +
                    `&nbsp;&nbsp;Last attempt: ${new Date().toLocaleTimeString()}`;
            }
        } catch (e) {
            liveIndicator.innerHTML =
                `<span style="color:var(--accent-red)">✕ UPLINK_ERROR</span>`;
        }
    }

    // ── Start / stop polling ──────────────────────────────────────────────────
    function startPolling(deviceId) {
        stopPolling();
        if (!deviceId) return;
        activeDeviceId = deviceId;
        fetchLocation(deviceId);                               // immediate first fetch
        pollTimer = setInterval(() => fetchLocation(activeDeviceId), 30000); // every 30s
    }

    function stopPolling() {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        activeDeviceId = '';
    }

    // ── Load device list into dropdown ────────────────────────────────────────
    async function loadDevices() {
        const token = localStorage.getItem('mts_token');
        if (!token) return;
        try {
            const res  = await fetch(`${BACKEND_URL}/devices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.devices) {
                const prev = deviceSelect.value;           // preserve current selection
                deviceSelect.innerHTML = '<option value="">-- SELECT NODE --</option>';
                data.devices.forEach(d => {
                    const opt       = document.createElement('option');
                    opt.value       = d.device_id;
                    opt.textContent = `${d.device_id} [ACTIVE]`;
                    deviceSelect.appendChild(opt);
                });
                if (prev) deviceSelect.value = prev;       // restore after refresh

                // ── Handover from Device Registry via localStorage ─────────
                const preSelected = localStorage.getItem('mts_track_device');
                if (preSelected) {
                    deviceSelect.value = preSelected;
                    localStorage.removeItem('mts_track_device');
                    startPolling(preSelected);
                }
            }
        } catch (e) { console.error('DEVICE_LIST_FETCH_FAILED'); }
    }

    // ── Dropdown selection ────────────────────────────────────────────────────
    deviceSelect.addEventListener('change', () => {
        const deviceId = deviceSelect.value;
        if (!deviceId || deviceId === 'none' || deviceId === 'null') {
            stopPolling();
            latEl.textContent = '--';
            lngEl.textContent = '--';
            accEl.textContent = '--';
            liveIndicator.textContent = 'SELECT A NODE TO BEGIN LIVE TRACKING';
            return;
        }
        startPolling(deviceId);
    });

    // ── Manual GPS broadcast (this browser/device) ────────────────────────────
    syncBtn.addEventListener('click', () => {
        const token = localStorage.getItem('mts_token');
        if (!token) { alert('CRITICAL: AUTH_REQUIRED. Return to Dashboard.'); return; }

        syncBtn.textContent = 'ACQUIRING_SIGNAL...';
        syncBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = pos.coords.accuracy;

            latEl.textContent = lat.toFixed(6);
            lngEl.textContent = lng.toFixed(6);
            accEl.textContent = acc.toFixed(1) + ' M';

            try {
                await fetch(`${BACKEND_URL}/location`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        device_id: activeDeviceId || 'COMMAND_CONSOLE',
                        latitude: lat, longitude: lng, accuracy: acc,
                        timestamp: new Date().toISOString()
                    })
                });
                syncBtn.textContent = 'TELEMETRY_BROADCAST_SUCCESS';
                syncBtn.style.background = 'var(--accent-green)';
            } catch (e) {
                syncBtn.textContent = 'BROADCAST_FAILED';
            } finally {
                setTimeout(() => {
                    syncBtn.textContent = 'SYNC CURRENT LOCATION';
                    syncBtn.style.background = '';
                    syncBtn.disabled = false;
                }, 2000);
            }
        }, () => {
            syncBtn.textContent = 'GPS_FIX_FAILED';
            syncBtn.disabled = false;
        }, { enableHighAccuracy: true });
    });

    loadDevices();
});
