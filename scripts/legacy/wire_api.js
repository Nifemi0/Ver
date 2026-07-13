const fs = require('fs');
let html = fs.readFileSync('interactive_graph.html', 'utf8');

const analyzeLogicRegex = /if\(analyzeBtn\) \{[\s\S]*?\}\);/m;
const newAnalyzeLogic = `if(analyzeBtn) {
        analyzeBtn.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const originalText = btn.innerHTML;
            const jsonOut = document.getElementById('jsonOutput');
            const input = document.querySelector('input[type="text"]');
            const address = input ? input.value.trim() : '';
            
            particles.forEach(p => p.active = false);
            tooltip.style.opacity = '0';
            
            if (!address) {
                if(jsonOut) {
                    jsonOut.classList.remove('text-gray-500');
                    jsonOut.innerHTML = '{\\n  "error": "Please enter a valid contract address"\\n}';
                }
                return;
            }

            if(jsonOut) {
                jsonOut.classList.remove('text-gray-500');
                jsonOut.innerHTML = '{\\n  "status": "fetching_abi",\\n  "timestamp": "' + new Date().toISOString() + '"\\n}';
            }
            
            btn.innerHTML = \`<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Compiling...\`;
            
            // Show background particles
            particles.forEach(p => { if(!p.isCore) p.active = true; });

            try {
                const response = await fetch(\`/api/analyze?address=\${address}\`);
                const data = await response.json();
                
                if (data.error) {
                    if(jsonOut) jsonOut.innerHTML = JSON.stringify(data, null, 2);
                    btn.innerHTML = originalText;
                    return;
                }
                
                // Show core particles on success
                particles.forEach(p => p.active = true); 
                
                if(jsonOut) jsonOut.innerHTML = JSON.stringify(data, null, 2);
                btn.innerHTML = originalText;
                
            } catch (err) {
                if(jsonOut) jsonOut.innerHTML = '{\\n  "error": "Failed to connect to backend engine."\\n}';
                btn.innerHTML = originalText;
            }
        });`;

html = html.replace(analyzeLogicRegex, newAnalyzeLogic);
fs.writeFileSync('interactive_graph.html', html);
