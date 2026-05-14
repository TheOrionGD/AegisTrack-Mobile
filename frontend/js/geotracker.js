const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-tracking');
    
    const syncBtn = document.getElementById('syncBtn');
    const latEl = document.getElementById('lat');
    const lngEl = document.getElementById('lng');
    const accEl = document.getElementById('acc');

    syncBtn.addEventListener('click', () => {
        const token = localStorage.getItem('mts_token');
        if (!token) {
            alert('CRITICAL: AUTH_REQUIRED. Return to Dashboard.');
            return;
        }

        syncBtn.textContent = 'ACQUIRING_SIGNAL...';
        syncBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = pos.coords.accuracy;

            latEl.textContent = lat.toFixed(6);
            lngEl.textContent = lng.toFixed(6);
            accEl.textContent = acc.toFixed(1) + ' M';

            // BROADCAST TO BACKEND
            try {
                await fetch(`${BACKEND_URL}/location`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        device_id: 'COMMAND_CONSOLE', // Identifying the web dashboard as a node
                        latitude: lat,
                        longitude: lng,
                        accuracy: acc,
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
                    syncBtn.disabled = false;
                }, 2000);
            }
        }, err => {
            syncBtn.textContent = 'GPS_FIX_FAILED';
            syncBtn.disabled = false;
        }, { enableHighAccuracy: true });
    });
});
