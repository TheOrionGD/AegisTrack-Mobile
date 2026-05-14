// Remote Ops Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-ops');
    
    const purgeBtn = document.querySelector('.btn-danger');
    purgeBtn.addEventListener('click', () => {
        if(confirm('CONFIRM_SYSTEM_PURGE? This will terminate all active telemetry streams.')) {
            logActivity('SYSTEM_PURGE_EXECUTED', 'ERROR');
        }
    });
});
