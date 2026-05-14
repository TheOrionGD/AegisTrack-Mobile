// Data Export Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-export');
    
    const btns = document.querySelectorAll('.btn-primary');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const report = btn.parentElement.querySelector('.stat-label').textContent;
            btn.textContent = 'GENERATING...';
            setTimeout(() => {
                btn.textContent = 'DOWNLOAD READY';
                btn.style.background = 'var(--accent-green)';
                logActivity(`REPORT_${report}_GENERATED`, 'SUCCESS');
            }, 2000);
        });
    });
});
