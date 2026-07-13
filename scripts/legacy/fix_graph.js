const fs = require('fs');
let html = fs.readFileSync('interactive_graph.html', 'utf8');

// 1. Fix Canvas Opacity
html = html.replace('class="absolute inset-0 w-full h-full opacity-[0.15]"', 'class="absolute inset-0 w-full h-full"');

// 2. Fix JS Colors & Opacity
html = html.replace("const COLOR_ACCENT = '23, 23, 23';", "const COLOR_ACCENT = '23, 23, 23';");
html = html.replace('ctx.strokeStyle = `rgba(${COLOR_ACCENT}, ${opacityValue * 0.15})`;', 'ctx.strokeStyle = `rgba(${COLOR_ACCENT}, ${opacityValue * 0.25})`;');
html = html.replace('ctx.strokeStyle = `rgba(${COLOR_ACCENT}, ${opacityValue * 0.3})`;', 'ctx.strokeStyle = `rgba(${COLOR_ACCENT}, ${opacityValue * 0.5})`;');
html = html.replace('ctx.strokeStyle = `rgba(${COLOR_EMERALD}, ${opacityValue * 0.4})`;', 'ctx.strokeStyle = `rgba(${COLOR_EMERALD}, ${opacityValue * 0.8})`;');
html = html.replace('ctx.fillStyle = \'#A1A1AA\';', 'ctx.fillStyle = \'#71717A\';'); // Darker dust particles

// 3. Replace Static SVG Graph in IDE with JSON Output
const svgRegex = /<div class="glass-dark rounded-xl p-6 h-64 relative">[\s\S]*?<\/div>\s*<\/div>\s*<div class="flex gap-4">/;
const newJsonBox = `<div class="glass-dark rounded-xl p-6 h-64 relative overflow-y-auto font-mono text-[10px] sm:text-xs text-gray-300">
                <div class="text-gray-500 mb-2 sticky top-0 bg-[#18181b]/90 backdrop-blur z-10 pb-2">Live JSON Output</div>
                <pre id="jsonOutput" class="whitespace-pre-wrap leading-relaxed text-gray-500">Waiting for contract analysis...</pre>
            </div>
            
            <div class="flex gap-4">`;
html = html.replace(svgRegex, newJsonBox);

// 4. Update Nav Links
html = html.replace(/>Documentation<\/a>/g, 'href="docs.html">Documentation</a>');
html = html.replace(/>Schema<\/a>/g, 'href="schema.html">Schema</a>');
html = html.replace(/>SDK<\/a>/g, 'href="sdk.html">SDK</a>');
html = html.replace(/>GitHub<\/a>/g, 'href="https://github.com/HashKey/HashGraph">GitHub</a>');

// 5. Connect 'Analyze' button to JSON feed
const analyzeRegex = /document\.getElementById\('analyzeBtn'\)\.addEventListener\('click', \(e\) => \{[\s\S]*?\}\);/;

const newAnalyze = `document.getElementById('analyzeBtn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        const jsonOut = document.getElementById('jsonOutput');
        let step = 0;
        
        particles.forEach(p => p.active = false);
        tooltip.style.opacity = '0';
        jsonOut.classList.remove('text-gray-500');
        jsonOut.innerHTML = '{\\n  "status": "initializing",\\n  "timestamp": "' + new Date().toISOString() + '"\\n}';
        
        const steps = [
            "Loading ABI...",
            "Scanning...",
            "Building Graph...",
            "Semantic Layer...",
            "✓ Complete"
        ];
        
        const interval = setInterval(() => {
            if (step < steps.length) {
                btn.innerHTML = \`<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> \${steps[step]}\`;
                
                if (step === 1) {
                    particles.forEach(p => { if(!p.isCore) p.active = true; }); 
                    jsonOut.innerHTML = '{\\n  "status": "resolving_proxy",\\n  "proxy_detected": true,\\n  "implementation": "0xc0d3..."\\n}';
                } else if (step === 2) {
                    particles.forEach(p => p.active = true); 
                    jsonOut.innerHTML = '{\\n  "status": "extracting_structural_facts",\\n  "functions": 20,\\n  "events": 2\\n}';
                } else if (step === 3) {
                    jsonOut.innerHTML = '{\\n  "status": "semantic_enrichment",\\n  "model": "gpt-4"\\n}';
                }
                
                step++;
            } else {
                clearInterval(interval);
                btn.innerHTML = originalText;
                jsonOut.innerHTML = JSON.stringify({
                    metadata: {
                        protocol_name: "L1Block",
                        contract_address: "0x4200000000000000000000000000000000000015",
                        is_proxy: true
                    },
                    structural: {
                        functions: 20,
                        events: 2,
                        dependencies: []
                    },
                    semantic: {
                        intent: "Stores L1 block attributes.",
                        verified: true
                    }
                }, null, 2);
            }
        }, 800);
    });`;

html = html.replace(analyzeRegex, newAnalyze);

fs.writeFileSync('interactive_graph.html', html);
