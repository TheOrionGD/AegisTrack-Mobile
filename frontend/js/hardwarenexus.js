// Hardware Nexus Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-hardware');
    
    const initBtn = document.getElementById('initBtn');
    const keyDisplay = document.getElementById('keyDisplay');

    const BACKEND_URL = 'http://10.171.58.245:5000';

    initBtn.addEventListener('click', async () => {
        const id = document.getElementById('deviceId').value;
        const token = localStorage.getItem('mts_token');

        if (!id || !token) {
            alert('REQUIRED: DEVICE_ID & AUTH_TOKEN');
            return;
        }
        
        initBtn.textContent = 'CONNECTING...';
        initBtn.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/devices/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_id: id })
            });

            const data = await response.json();
            if (response.ok) {
                keyDisplay.textContent = data.api_key;
                keyDisplay.style.color = 'var(--accent-green)';
                logActivity(`NODE_${id}_REGISTERED_SUCCESS`);
            } else {
                keyDisplay.textContent = `ERR: ${data.error}`;
                keyDisplay.style.color = 'var(--accent-red)';
            }
        } catch (e) {
            keyDisplay.textContent = 'ERR: UPLINK_TIMEOUT';
            keyDisplay.style.color = 'var(--accent-red)';
        } finally {
            initBtn.textContent = 'INITIALIZE LINK';
            initBtn.disabled = false;
        }
    });
});
