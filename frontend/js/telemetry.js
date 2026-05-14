const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-telemetry');
    
    const feed = document.getElementById('liveFeed');
    const token = localStorage.getItem('mts_token');

    if (!token) {
        feed.innerHTML = '<div style="color:var(--accent-red)">ERR: SECURE_UPLINK_REQUIRED. LOGIN_FIRST.</div>';
        return;
    }

    const wsUrl = BACKEND_URL.replace('http', 'ws') + '/ws?token=' + token;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] UPLINK_ESTABLISHED_SECURE`;
        entry.style.color = 'var(--accent-green)';
        feed.prepend(entry);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        if (data.event === 'location_updated') {
            const p = data.payload;
            entry.textContent = `[${new Date().toLocaleTimeString()}] PKT_RECV: NODE_${p.device_id} | LAT:${p.latitude.toFixed(4)} | LNG:${p.longitude.toFixed(4)}`;
        } else {
            entry.textContent = `[${new Date().toLocaleTimeString()}] MSG_RECV: ${data.event.toUpperCase()}`;
        }
        
        feed.prepend(entry);
        if (feed.children.length > 50) feed.lastChild.remove();
    };

    socket.onerror = () => {
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] UPLINK_INTERRUPTED_BY_KERNEL`;
        entry.style.color = 'var(--accent-red)';
        feed.prepend(entry);
    };
});
