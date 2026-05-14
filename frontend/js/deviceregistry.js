const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-registry');
    
    const container = document.getElementById('deviceContainer');
    const token = localStorage.getItem('mts_token');

    async function fetchDevices() {
        if (!token) {
            container.innerHTML = '<div style="color:var(--accent-red)">ERR: ACCESS_DENIED. LOGIN_REQUIRED.</div>';
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/devices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const deviceList = data.devices || [];
            
            container.innerHTML = '';
            deviceList.forEach(dev => {
                const card = document.createElement('div');
                card.className = 'panel';
                card.style.background = 'rgba(0, 242, 255, 0.03)';
                card.innerHTML = `
                    <div class="panel-header">
                        <i class="fa-solid fa-microchip"></i>
                        <h3 style="font-size:0.6rem">${dev.device_id}</h3>
                    </div>
                    <div class="stat-box" style="margin-bottom:10px">
                        <div class="stat-label">LAST_SYNC</div>
                        <div class="stat-val">${dev.last_updated || 'NEVER'}</div>
                    </div>
                    <div class="telemetry-grid">
                        <div class="stat-box"><div class="stat-label">LAT</div><div class="stat-val">${dev.latitude ? dev.latitude.toFixed(4) : '--'}</div></div>
                        <div class="stat-box"><div class="stat-label">LNG</div><div class="stat-val">${dev.longitude ? dev.longitude.toFixed(4) : '--'}</div></div>
                    </div>
                    <button class="btn-subtle" style="margin-top:10px; width:100%" onclick="window.location.href='geotracker.html'">TRACK_NODE</button>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            container.innerHTML = '<div style="color:var(--accent-red)">ERR: KERNEL_UPLINK_OFFLINE</div>';
        }
    }

    fetchDevices();
});
