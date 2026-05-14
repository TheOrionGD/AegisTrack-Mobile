// Cloud Sync Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-cloud');
    
    const syncBtn = document.getElementById('syncBtn');
    const storageVal = document.getElementById('storageVal');
    const token = localStorage.getItem('mts_token');

    syncBtn.addEventListener('click', async () => {
        syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SYNCING...';
        syncBtn.disabled = true;
        
        setTimeout(async () => {
            syncBtn.innerHTML = '<i class="fa-solid fa-check"></i> SYNC_COMPLETE';
            syncBtn.style.background = 'var(--accent-green)';
            const usage = (42.9 + Math.random()).toFixed(1) + ' GB / 1 TB';
            storageVal.textContent = usage;
            
            if (token) {
                // Log the sync activity
                await fetch('http://localhost:5000/vault/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ event: 'CLOUD_SYNC_SUCCESSFUL', ip: 'REMOTE_CLIENT' })
                });

                // Update storage config
                await fetch('http://localhost:5000/vault/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ key: 'cloud_storage_usage', value: usage })
                });
            }
        }, 3000);
    });
});
