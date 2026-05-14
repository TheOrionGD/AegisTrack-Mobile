// AI Analytics Logic
document.addEventListener('DOMContentLoaded', () => {
    injectSidebar('nav-analytics');
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const aiResponse = document.getElementById('aiResponse');
    const BACKEND_URL = 'http://localhost:5000'; // Fallback if not globally defined

    analyzeBtn.addEventListener('click', async () => {
        aiResponse.textContent = 'CONNECTING_TO_NEURAL_GRID...';
        analyzeBtn.disabled = true;

        const token = localStorage.getItem('mts_token');
        if (!token) {
            aiResponse.textContent = 'NEURAL_LINK_ERROR: NO_AUTH_TOKEN';
            analyzeBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/proxy/groq`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model: "mixtral-8x7b-32768",
                    messages: [{
                        role: "system",
                        content: "You are the MTS Tactical AI. Provide a 2-sentence highly tactical analysis of a tracking node operating in a high-security zone. Use technical cyberpunk jargon."
                    }, {
                        role: "user",
                        content: "Analyze Node_01 status: Static, Signal 98%, encrypted uplink active."
                    }],
                    temperature: 0.6
                })
            });

            const data = await response.json();
            const analysis = data.choices[0].message.content;
            aiResponse.textContent = analysis;

            // SAVE TO DATABASE VAULT
            const token = localStorage.getItem('mts_token');
            if (token) {
                await fetch('http://localhost:5000/vault/analytics', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        analysis: analysis,
                        node: 'Node_01',
                        timestamp: new Date().toISOString()
                    })
                });
            }
        } catch (error) {
            aiResponse.textContent = 'NEURAL_LINK_ERROR: ' + error.message;
        } finally {
            analyzeBtn.disabled = false;
        }
    });
});
