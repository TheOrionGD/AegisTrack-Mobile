// Remote Commands Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-commands');
    
    const terminal = document.getElementById('terminal');
    const input = document.getElementById('cmdInput');
    const btn = document.getElementById('sendBtn');

    btn.addEventListener('click', () => {
        const cmd = input.value;
        if (!cmd) return;
        
        const userLine = document.createElement('div');
        userLine.textContent = `> ${cmd}`;
        userLine.style.color = '#fff';
        terminal.appendChild(userLine);
        
        const respLine = document.createElement('div');
        respLine.textContent = `[SYS] EXECUTING_${cmd.toUpperCase()}... SUCCESS.`;
        terminal.appendChild(respLine);
        
        input.value = '';
        terminal.scrollTop = terminal.scrollHeight;
    });
});
