// Threat Matrix Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-alerts');
    
    const feed = document.getElementById('incidentFeed');
    
    function addIncident(msg, type = 'INFO') {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const color = type === 'WARN' ? 'var(--accent-orange)' : 'var(--accent-cyan)';
        entry.style.color = color;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${type}: ${msg}`;
        feed.prepend(entry);
    }

    // Simulate random incidents
    setInterval(() => {
        if (Math.random() > 0.7) {
            addIncident('SIGNAL_JITTER_DETECTED_IN_SECTOR_04', 'WARN');
        }
    }, 10000);
});
