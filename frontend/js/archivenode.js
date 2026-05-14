// Archive Node Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-archive');
    
    const moduleBtns = document.querySelectorAll('#moduleList button');
    const vaultContent = document.getElementById('vaultContent');
    const currentModuleName = document.getElementById('currentModuleName');
    const token = localStorage.getItem('mts_token');

    async function loadModuleData(module) {
        vaultContent.innerHTML = '<div class="stat-label">QUERYING_DATABASE...</div>';
        currentModuleName.textContent = `${module.toUpperCase()}_RECORDS`;
        
        if (!token) {
            vaultContent.innerHTML = '<div style="color:var(--accent-red)">ERR: ACCESS_DENIED</div>';
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/vault/${module}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const records = data[module] || [];

            vaultContent.innerHTML = '';
            if (records.length === 0) {
                vaultContent.innerHTML = '<div class="stat-label">NO_RECORDS_FOUND_IN_CLUSTER</div>';
                return;
            }

            records.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'panel';
                item.style.background = 'rgba(255,255,255,0.03)';
                item.style.border = '1px solid rgba(0, 242, 255, 0.1)';
                
                const date = new Date(rec.created_at).toLocaleString();
                const content = JSON.stringify(rec.data, null, 2);
                
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.7rem">
                        <span style="color:var(--accent-cyan)">SYNC_DATE: ${date}</span>
                        <span style="color:var(--accent-green)">STATUS: VERIFIED</span>
                    </div>
                    <pre style="margin:0; font-family:'Courier New', monospace; font-size:0.8rem; color:#ccc; white-space:pre-wrap;">${content}</pre>
                `;
                vaultContent.appendChild(item);
            });
        } catch (error) {
            vaultContent.innerHTML = `<div style="color:var(--accent-red)">ERR: KERNEL_UPLINK_TIMEOUT (${error.message})</div>`;
        }
    }

    moduleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            moduleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadModuleData(btn.dataset.module);
        });
    });

    // Initial load
    loadModuleData('analytics');
});
