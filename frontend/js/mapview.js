const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-map');

    const deviceSelect  = document.getElementById('deviceSelect');
    const googleMap     = document.getElementById('googleMap');
    const mapStandby    = document.getElementById('mapStandby');
    const hudCoords     = document.getElementById('hudCoords');
    const hudMode       = document.getElementById('hudMode');
    const hudLastSync   = document.getElementById('hudLastSync');
    const token         = localStorage.getItem('mts_token');

    let pollInterval = null;   // holds the setInterval handle
    let currentDeviceId = '';

    // ── Load registered device list into dropdown ──────────────────────────
    async function loadDevices() {
        if (!token) return;
        try {
            const res  = await fetch(`${BACKEND_URL}/devices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.devices) {
                deviceSelect.innerHTML = '<option value="">-- SELECT ACTIVE NODE --</option>';
                data.devices.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value       = d.device_id;
                    opt.textContent = `${d.device_id}  [${d.latitude ? 'ONLINE' : 'PENDING'}]`;
                    deviceSelect.appendChild(opt);
                });
            }
        } catch (e) {}
    }

    // ── Fetch location for a device and update map + HUD ──────────────────
    async function lockOnDevice(deviceId) {
        if (!deviceId) return;

        hudMode.textContent  = 'LOCKING...';
        hudMode.style.color  = 'var(--accent-cyan)';

        try {
            const res  = await fetch(`${BACKEND_URL}/location/${deviceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data.latitude) {
                const lat = data.latitude;
                const lng = data.longitude;

                // Show map, hide standby
                mapStandby.style.display = 'none';
                googleMap.style.display  = 'block';

                // Re-orbit satellite to device's stored coordinates
                googleMap.src = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=15&ie=UTF8&iwloc=&output=embed`;

                // Update HUD
                hudCoords.textContent    = `${lat.toFixed(6)} / ${lng.toFixed(6)}`;
                hudMode.textContent      = 'LOCKED';
                hudMode.style.color      = 'var(--accent-green)';
                hudLastSync.textContent  = new Date().toLocaleTimeString();
            } else {
                // No location stored yet — keep standby
                mapStandby.style.display = 'flex';
                googleMap.style.display  = 'none';
                hudMode.textContent      = 'NO_SIGNAL';
                hudMode.style.color      = 'var(--accent-red)';
                hudCoords.textContent    = '-- / --';
            }
        } catch (e) {
            hudMode.textContent = 'UPLINK_ERR';
            hudMode.style.color = 'var(--accent-red)';
        }
    }

    // ── Device selector change ─────────────────────────────────────────────
    deviceSelect.addEventListener('change', () => {
        const deviceId = deviceSelect.value;

        // Clear previous poll
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }

        // Guard: block empty, null, 'none', 'undefined' values
        if (!deviceId || deviceId === 'none' || deviceId === 'null' || deviceId === 'undefined') {
            // Reset to standby
            mapStandby.style.display  = 'flex';
            googleMap.style.display   = 'none';
            googleMap.src             = 'about:blank';
            hudMode.textContent     = 'IDLE';
            hudMode.style.color     = '';
            hudCoords.textContent   = '-- / --';
            hudLastSync.textContent = '--:--:--';
            currentDeviceId = '';
            return;
        }

        currentDeviceId = deviceId;

        // Immediate fetch on selection
        lockOnDevice(deviceId);

        // Live polling every 15 seconds
        pollInterval = setInterval(() => lockOnDevice(currentDeviceId), 15000);
    });

    loadDevices();
});
