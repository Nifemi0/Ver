const fs = require('fs');
const baseHtml = fs.readFileSync('interactive_graph.html', 'utf8');

const navMatch = baseHtml.match(/(<!-- Top Navigation -->[\s\S]*?<\/nav>)/);
const footerMatch = baseHtml.match(/(<footer[\s\S]*?<\/footer>)/);
const scriptMatch = baseHtml.match(/(<script>[\s\S]*?\/\/ Navbar Scroll Effect[\s\S]*?<\/script>)/);

const head = baseHtml.split('<!-- Top Navigation -->')[0];
const nav = navMatch ? navMatch[1] : '';
const footer = footerMatch ? footerMatch[1] : '';
const scrollScript = scriptMatch ? scriptMatch[1] : '';

const explorerContent = `
<main class="pt-32 pb-24 max-w-5xl mx-auto px-6 min-h-[80vh]">
    <div class="mb-10 text-center">
        <h1 class="text-4xl font-serif text-gray-900 mb-4">Protocol Explorer</h1>
        <p class="text-gray-500">Compile any verified HashKey Chain contract into a semantic protocol graph.</p>
    </div>

    <!-- Main Explorer UI -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        <!-- Left Panel: Input & Steps -->
        <div class="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
            <div class="mb-8">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Contract</label>
                <div class="flex gap-2">
                    <input type="text" id="contractInput" placeholder="0x..." class="w-full px-4 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent">
                    <button id="runBtn" class="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center">
                        <span class="material-symbols-outlined text-[18px]">play_arrow</span>
                    </button>
                </div>
                <div id="errorMsg" class="text-red-500 text-xs mt-2 hidden"></div>
            </div>

            <div class="flex-1">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Compilation Pipeline</label>
                <div id="pipelineSteps" class="space-y-4">
                    <!-- Steps will be injected here via JS -->
                    <div class="text-sm text-gray-400 italic">Waiting for input...</div>
                </div>
            </div>
        </div>

        <!-- Right Panel: Output Logs & JSON -->
        <div class="w-full md:w-2/3 bg-[#0A0A0A] p-0 flex flex-col relative">
            <div class="absolute top-0 w-full bg-[#111] border-b border-gray-800 px-4 py-3 flex items-center justify-between z-10">
                <div class="flex gap-2">
                    <div class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div class="text-xs font-mono text-gray-500">compiler.log</div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 pt-16 font-mono text-xs sm:text-sm text-gray-300 space-y-2" id="logOutput">
                <div class="text-gray-600">~ HashGraph Compiler v1.0.0</div>
                <div class="text-gray-600">~ Ready to extract deterministic facts.</div>
            </div>
        </div>
    </div>
</main>

<script>
    const runBtn = document.getElementById('runBtn');
    const contractInput = document.getElementById('contractInput');
    const pipelineSteps = document.getElementById('pipelineSteps');
    const logOutput = document.getElementById('logOutput');
    const errorMsg = document.getElementById('errorMsg');

    const steps = [
        { id: 'fetch', label: 'Fetching ABI...' },
        { id: 'proxy', label: 'Resolving Proxy...' },
        { id: 'extract', label: 'Extracting Events...' },
        { id: 'graph', label: 'Building Graph...' },
        { id: 'semantic', label: 'Semantic Enrichment...' }
    ];

    function appendLog(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = type === 'error' ? 'text-red-400' : (type === 'success' ? 'text-green-400' : 'text-gray-300');
        const time = new Date().toISOString().split('T')[1].slice(0,12);
        div.innerHTML = \`<span class="text-gray-600">[\${time}]</span> \${msg}\`;
        logOutput.appendChild(div);
        logOutput.scrollTop = logOutput.scrollHeight;
    }

    function renderSteps(activeIdx, complete = false) {
        pipelineSteps.innerHTML = '';
        steps.forEach((step, idx) => {
            const isPast = idx < activeIdx || complete;
            const isActive = idx === activeIdx && !complete;
            
            let icon = '<span class="material-symbols-outlined text-[16px] text-gray-300">radio_button_unchecked</span>';
            let textClass = 'text-gray-400';
            
            if (isPast) {
                icon = '<span class="material-symbols-outlined text-[16px] text-green-500">check_circle</span>';
                textClass = 'text-gray-900 font-medium';
            } else if (isActive) {
                icon = '<span class="material-symbols-outlined text-[16px] text-blue-500 animate-spin">progress_activity</span>';
                textClass = 'text-blue-600 font-medium';
            }

            pipelineSteps.innerHTML += \`
                <div class="flex items-center gap-3">
                    \${icon}
                    <span class="text-sm \${textClass}">\${step.label}</span>
                </div>
                \${idx < steps.length - 1 ? \`<div class="w-px h-4 bg-gray-200 ml-[7px] my-1 \${isPast ? 'bg-green-200' : ''}"></div>\` : ''}
            \`;
        });
        
        if (complete) {
            pipelineSteps.innerHTML += \`
                <div class="w-px h-4 bg-green-200 ml-[7px] my-1"></div>
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-[16px] text-green-500">task_alt</span>
                    <span class="text-sm text-green-600 font-bold">Done</span>
                </div>
            \`;
        }
    }

    runBtn.addEventListener('click', async () => {
        const address = contractInput.value.trim();
        errorMsg.classList.add('hidden');
        
        if (!address) {
            errorMsg.innerText = "Please enter an address.";
            errorMsg.classList.remove('hidden');
            return;
        }

        runBtn.disabled = true;
        runBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>';
        logOutput.innerHTML = '';
        appendLog(\`Starting compilation for \${address}\`);
        
        // Start simulated frontend step progression while fetch happens
        let currentStep = 0;
        renderSteps(currentStep);
        
        const stepInterval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                renderSteps(currentStep);
                appendLog(\`\${steps[currentStep].label.replace('...', '')} initialized...\`);
            }
        }, 1500);

        try {
            const response = await fetch(\`/api/analyze?address=\${address}\`);
            const data = await response.json();
            
            clearInterval(stepInterval);
            
            if (data.error) {
                renderSteps(currentStep, false);
                appendLog(JSON.stringify(data, null, 2), 'error');
            } else {
                renderSteps(steps.length, true);
                appendLog("Compilation successful. Generating JSON view...", "success");
                
                // Print the glorious JSON output
                const jsonPre = document.createElement('pre');
                jsonPre.className = 'mt-4 text-green-300 overflow-x-auto';
                jsonPre.textContent = JSON.stringify(data, null, 2);
                logOutput.appendChild(jsonPre);
                logOutput.scrollTop = logOutput.scrollHeight;
            }
        } catch (err) {
            clearInterval(stepInterval);
            appendLog("Network error: Failed to reach compiler API.", 'error');
        } finally {
            runBtn.disabled = false;
            runBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">play_arrow</span>';
        }
    });
</script>
`;

fs.writeFileSync('explorer.html', head + nav + explorerContent + footer + scrollScript + '\n</body>\n</html>');
