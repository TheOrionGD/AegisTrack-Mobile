// Map View Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-map');
    
    const marker = document.getElementById('marker');
    
    // Simulate movement
    setInterval(() => {
        const top = 40 + Math.random() * 20;
        const left = 40 + Math.random() * 20;
        marker.style.top = top + '%';
        marker.style.left = left + '%';
    }, 5000);
});
