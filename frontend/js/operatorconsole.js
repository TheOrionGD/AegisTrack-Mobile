// Operator Console Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-admin');
    
    const list = document.getElementById('operatorList');
    const token = localStorage.getItem('mts_token');

    async function loadOperators() {
        let ops = [
            { name: 'GODFREY', role: 'Chief Engineer', status: 'Active' },
            { name: 'ARUN', role: 'Tactical Officer', status: 'Active' },
            { name: 'GUEST_01', role: 'Observer', status: 'Idle' }
        ];

        if (token) {
            try {
                const response = await fetch('http://localhost:5000/vault/operators', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.operators && data.operators.length > 0) {
                    ops = data.operators.map(o => o.data);
                }
            } catch (e) { console.error('OP_FETCH_ERR', e); }
        }

        list.innerHTML = '';
        ops.forEach(op => {
            const card = document.createElement('div');
            card.className = 'panel';
            card.style.background = 'rgba(255,255,255,0.02)';
            card.innerHTML = `
                <div class="panel-header">
                    <i class="fa-solid fa-user-shield"></i>
                    <h3 style="font-size:0.7rem">${op.name}</h3>
                </div>
                <div class="stat-label">ROLE: ${op.role}</div>
                <div class="stat-val" style="font-size: 0.8rem; color: var(--accent-green)">${op.status.toUpperCase()}</div>
                <button class="btn-subtle" style="margin-top:10px; width:100%">MANAGE PERMS</button>
            `;
            list.appendChild(card);
        });
    }

    loadOperators();
});
