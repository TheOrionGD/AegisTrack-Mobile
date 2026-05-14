const BACKEND_URL = 'http://10.171.58.245:5000';

document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-nexus');
    
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authStatus = document.getElementById('authStatus');

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
});
