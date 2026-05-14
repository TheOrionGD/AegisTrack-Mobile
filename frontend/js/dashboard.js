const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-nexus');
    
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authStatus = document.getElementById('authStatus');
    const copyTokenBtn = document.getElementById('copyTokenBtn');

    // Check if token already exists to show button
    if (localStorage.getItem('mts_token')) {
        copyTokenBtn.style.display = 'block';
    }

    async function handleAuth(endpoint) {
        const username = document.getElementById('username').value;
        const accessCode = document.getElementById('password').value;

        if (!username || !accessCode) {
            authStatus.textContent = 'ERROR: MISSING_CREDENTIALS';
            authStatus.style.color = 'var(--accent-red)';
            return;
        }

        authStatus.textContent = 'COMMUNICATING_WITH_KERNEL...';
        authStatus.style.color = 'var(--accent-cyan)';

        try {
            const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: accessCode })
            });

            const data = await response.json();

            if (response.ok) {
                authStatus.textContent = 'ACCESS_GRANTED. TOKEN_LOCKED.';
                authStatus.style.color = 'var(--accent-green)';
                localStorage.setItem('mts_token', data.access_token || data.token);
                localStorage.setItem('mts_user', username);
                copyTokenBtn.style.display = 'block';

                // Notify all open MTS tabs to re-initialize their data
                try {
                    new BroadcastChannel('mts_auth').postMessage({ event: 'login', user: username });
                } catch (e) {}
            } else {
                authStatus.textContent = `DENIED: ${data.error || 'INVALID_AUTH'}`;
                authStatus.style.color = 'var(--accent-red)';
            }
        } catch (error) {
            authStatus.textContent = 'ERROR: BACKEND_OFFLINE';
            authStatus.style.color = 'var(--accent-red)';
        }
    }

    loginBtn.addEventListener('click', () => handleAuth('login'));
    registerBtn.addEventListener('click', () => handleAuth('register'));

    copyTokenBtn.addEventListener('click', () => {
        const token = localStorage.getItem('mts_token');
        if (token) {
            navigator.clipboard.writeText(token).then(() => {
                const originalText = copyTokenBtn.innerHTML;
                copyTokenBtn.innerHTML = '<i class="fa-solid fa-check"></i> TOKEN_COPIED';
                copyTokenBtn.style.color = 'var(--accent-green)';
                setTimeout(() => {
                    copyTokenBtn.innerHTML = originalText;
                    copyTokenBtn.style.color = '';
                }, 2000);
            });
        }
    });
});
