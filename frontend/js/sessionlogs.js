// Session Logs Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-sessions');
    
    const body = document.getElementById('logBody');
    const token = localStorage.getItem('mts_token');

    async function loadLogs() {
        let logs = [
            { time: '14:22:01', op: 'ADMIN', event: 'SYS_LOGIN', ip: '10.171.58.245' },
            { time: '14:25:33', op: 'ARUN', event: 'DEVICE_REG', ip: '192.168.1.10' },
            { time: '14:30:12', op: 'ADMIN', event: 'GEOLOCK_ARM', ip: '10.171.58.245' }
        ];

        if (token) {
            try {
                const response = await fetch('http://localhost:5000/vault/logs', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.logs && data.logs.length > 0) {
                    logs = data.logs.map(l => ({
                        time: new Date(l.created_at).toLocaleTimeString(),
                        op: l.owner.toUpperCase(),
                        event: l.data.event,
                        ip: l.data.ip || 'INTERNAL'
                    }));
                }
            } catch (e) { console.error('LOG_FETCH_ERR', e); }
        }

        body.innerHTML = '';
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding:10px">${log.time}</td>
                <td style="color:var(--accent-cyan)">${log.op}</td>
                <td>${log.event}</td>
                <td>${log.ip}</td>
            `;
            body.appendChild(row);
        });
    }

    loadLogs();
});
