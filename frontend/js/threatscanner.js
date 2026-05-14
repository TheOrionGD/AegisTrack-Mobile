// Threat Scanner Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-scanner');
    
    const scanBtn = document.getElementById('scanBtn');
    const scanLog = document.getElementById('scanLog');
    const token = localStorage.getItem('mts_token');

    async function loadThreats() {
        if (!token) return;
        try {
            const response = await fetch('http://localhost:5000/vault/threats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.threats) {
                data.threats.forEach(t => {
                    const entry = document.createElement('div');
                    entry.textContent = t.data.message;
                    scanLog.appendChild(entry);
                });
            }
        } catch (e) {}
    }

    scanBtn.addEventListener('click', async () => {
        const message = `[${new Date().toLocaleTimeString()}] SCANNING_SECTOR_${Math.floor(Math.random()*100)}... NO_THREATS_FOUND`;
        const entry = document.createElement('div');
        entry.textContent = message;
        scanLog.prepend(entry);
        
        // Save to DB
        if (token) {
            await fetch('http://localhost:5000/vault/threats', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });
        }
        
        scanBtn.textContent = 'SCANNING...';
        scanBtn.disabled = true;
        setTimeout(() => {
            scanBtn.textContent = 'INITIATE DEEP SCAN';
            scanBtn.disabled = false;
        }, 2000);
    });

    loadThreats();
});
