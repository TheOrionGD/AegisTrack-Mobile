// Sentinel Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-security');
    
    const armBtn = document.getElementById('armBtn');
    const status = document.getElementById('sentinelStatus');

    armBtn.addEventListener('click', () => {
        armBtn.textContent = 'ARMING...';
        setTimeout(() => {
            status.textContent = 'PERIMETER_LOCKED';
            status.style.color = 'var(--accent-cyan)';
            armBtn.textContent = 'ARM PERIMETER';
        }, 1500);
    });
});
