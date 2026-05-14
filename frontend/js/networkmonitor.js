// Network Monitor Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-monitor');
    
    const graph = document.getElementById('latencyGraph');
    const uplink = document.getElementById('uplink');
    const downlink = document.getElementById('downlink');

    // Simulate latency graph
    function updateGraph() {
        const bar = document.createElement('div');
        const height = 20 + Math.random() * 80;
        bar.style.width = '10px';
        bar.style.height = height + '%';
        bar.style.background = 'var(--accent-cyan)';
        bar.style.opacity = '0.5';
        graph.appendChild(bar);
        
        if (graph.children.length > 30) graph.firstChild.remove();
        
        uplink.textContent = (10 + Math.random() * 5).toFixed(1) + ' MB/s';
        downlink.textContent = (5 + Math.random() * 3).toFixed(1) + ' MB/s';
    }

    setInterval(updateGraph, 1000);
});
