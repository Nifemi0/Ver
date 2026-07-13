const fs = require('fs');

let html = fs.readFileSync('new_design.html', 'utf8');

// Fix Buttons to be Pill Shape
html = html.replace(/rounded /g, 'rounded-full ');
html = html.replace(/rounded</g, 'rounded-full<');

// Fix the Hero Section
const newHero = `
<!-- Hero Section with Canvas Background -->
<section class="relative pt-40 pb-32 overflow-hidden border-b border-gray-200">
    <canvas id="protocolGraph" class="absolute inset-0 w-full h-full"></canvas>
    
    <div class="relative z-10 max-w-3xl mx-auto px-6 text-center pointer-events-none">
        <div class="inline-block text-xs font-bold tracking-widest text-gray-500 uppercase mb-6 pointer-events-auto">The Semantic Layer for HashKey Chain</div>
        <h1 class="text-5xl lg:text-7xl font-bold tracking-tighter leading-[1.1] mb-6 font-serif text-gray-900 pointer-events-auto">
            Understand<br>Smart Contracts.<br>
            <span class="italic font-normal text-gray-600">Not Just Their ABI.</span>
        </h1>
        <p class="text-lg text-gray-500 mb-10 mx-auto pointer-events-auto">
            HashGraph compiles verified smart contracts into deterministic protocol graphs that AI agents, IDEs, and developers can understand instantly.
        </p>
        <div class="flex flex-col sm:flex-row gap-0 rounded-full shadow-sm border border-gray-300 w-full max-w-md mx-auto bg-white overflow-hidden pointer-events-auto">
            <input type="text" placeholder="Paste Contract (0x...)" class="flex-1 px-4 py-3 outline-none text-sm font-mono placeholder-gray-400" />
            <button id="analyzeBtn" class="bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 justify-center rounded-r-full">
                Analyze <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
        </div>
        <div class="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium pointer-events-auto">
            <span class="w-2 h-2 bg-hashkey rounded-full"></span>
            Deterministic by design. Explainable by AI.
        </div>
    </div>
    
    <!-- Tooltip Element for Canvas Hover -->
    <div id="graphTooltip" class="absolute pointer-events-none opacity-0 transition-opacity duration-200 bg-black/90 text-white p-3 rounded-lg shadow-xl text-xs font-mono z-20" style="transform: translate(-50%, -120%);">
        <div id="ttName" class="font-bold text-sm text-hashkey mb-1 border-b border-white/20 pb-1">Vault</div>
        <div class="flex justify-between gap-4"><span class="text-gray-400">Functions</span> <span id="ttFunc">20</span></div>
        <div class="flex justify-between gap-4"><span class="text-gray-400">Dependencies</span> <span id="ttDep">4</span></div>
        <div class="flex justify-between gap-4"><span class="text-gray-400">Events</span> <span id="ttEvt">8</span></div>
    </div>
</section>
`;

const heroRegex = /<!-- Hero Section -->[\s\S]*?(?=<!-- Dark IDE Section -->)/;
html = html.replace(heroRegex, newHero);

// Replace IDE SVG with JSON
const svgRegex = /<div class="glass-dark rounded-xl p-6 h-64 relative">[\s\S]*?<\/div>\s*<\/div>\s*<div class="flex gap-4">/;
const newJsonBox = `<div class="glass-dark rounded-2xl p-6 h-64 relative overflow-y-auto font-mono text-[10px] sm:text-xs text-gray-300">
                <div class="text-gray-500 mb-2 sticky top-0 bg-[#18181b]/90 backdrop-blur z-10 pb-2">Live JSON Output</div>
                <pre id="jsonOutput" class="whitespace-pre-wrap leading-relaxed text-gray-500">Waiting for contract analysis...</pre>
            </div>
            
            <div class="flex gap-4">`;
html = html.replace(svgRegex, newJsonBox);

// Clean Navigation Links
// Remove href="#" entirely from the nav/footer links so we can add the real ones
html = html.replace(/href="#" class="([^"]+)"/g, 'class="$1"');
html = html.replace(/>Documentation<\/a>/g, 'href="docs.html">Documentation</a>');
html = html.replace(/>Schema<\/a>/g, 'href="schema.html">Schema</a>');
html = html.replace(/>SDK<\/a>/g, 'href="sdk.html">SDK</a>');
html = html.replace(/>GitHub<\/a>/g, 'href="https://github.com/HashKey/HashGraph">GitHub</a>');

const jsScript = `
<script>
    const canvas = document.getElementById('protocolGraph');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('graphTooltip');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    let width, height;
    let particles = [];
    
    const mouse = { x: null, y: null, radius: 150 };
    
    // Monochrome / Emerald Accent
    const COLOR_ACCENT = '23, 23, 23'; 
    const COLOR_EMERALD = '16, 185, 129'; 
    
    const coreProtocols = [
        { name: 'Vault', functions: 20, dependencies: 4, events: 8 },
        { name: 'Oracle', functions: 12, dependencies: 2, events: 3 },
        { name: 'Treasury', functions: 35, dependencies: 8, events: 14 },
        { name: 'Router', functions: 8, dependencies: 5, events: 2 },
        { name: 'AccessControl', functions: 15, dependencies: 1, events: 5 }
    ];

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = canvas.width = rect.width;
        height = canvas.height = rect.height;
    }

    window.addEventListener('resize', () => {
        resize();
        initGraph();
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
        tooltip.style.opacity = '0';
    });

    class Node {
        constructor(coreData = null) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            
            this.coreData = coreData;
            this.isCore = !!coreData;
            this.baseRadius = this.isCore ? 5 : Math.random() * 1.5 + 1;
            this.radius = this.baseRadius;
            
            this.active = true; 
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            
            if (this.isCore) {
                ctx.fillStyle = '#171717';
                ctx.shadowBlur = 10;
                ctx.shadowColor = \`rgba(\${COLOR_EMERALD}, 0.4)\`;
                
                ctx.font = "11px JetBrains Mono";
                ctx.fillStyle = "#52525B";
                ctx.fillText(this.coreData.name, this.x + 12, this.y + 4);
            } else {
                ctx.fillStyle = '#71717A';
                ctx.shadowBlur = 0;
            }
            
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        update() {
            if (!this.active) return;
            if (this.x > width || this.x < 0) this.vx = -this.vx;
            if (this.y > height || this.y < 0) this.vy = -this.vy;

            let isHovered = false;

            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    this.x -= forceDirectionX * force * 1.0;
                    this.y -= forceDirectionY * force * 1.0;
                    
                    this.radius = this.baseRadius + (force * (this.isCore ? 3 : 1.5));
                    
                    if (this.isCore && distance < 40) {
                        isHovered = true;
                    }
                } else {
                    if (this.radius > this.baseRadius) this.radius -= 0.1;
                }
            } else {
                if (this.radius > this.baseRadius) this.radius -= 0.1;
            }

            if (isHovered) {
                tooltip.style.opacity = '1';
                tooltip.style.left = (this.x + canvas.getBoundingClientRect().left) + 'px';
                tooltip.style.top = (this.y + canvas.getBoundingClientRect().top - 20) + 'px';
                document.getElementById('ttName').innerText = this.coreData.name;
                document.getElementById('ttFunc').innerText = this.coreData.functions;
                document.getElementById('ttDep').innerText = this.coreData.dependencies;
                document.getElementById('ttEvt').innerText = this.coreData.events;
            }

            this.x += this.vx;
            this.y += this.vy;
            this.draw(ctx);
        }
    }

    function initGraph() {
        particles = [];
        coreProtocols.forEach(data => {
            particles.push(new Node(data));
        });
        
        let numberOfNodes = (width * height) / 18000;
        for (let i = 0; i < numberOfNodes; i++) {
            particles.push(new Node()); 
        }
    }

    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            if (!particles[a].active) continue;
            for (let b = a; b < particles.length; b++) {
                if (!particles[b].active) continue;
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = dx * dx + dy * dy;

                if (distance < (width / 5) * (height / 5)) {
                    opacityValue = 1 - (distance / 25000);
                    if (opacityValue < 0) opacityValue = 0;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = \`rgba(\${COLOR_ACCENT}, \${opacityValue * 0.25})\`;
                    ctx.lineWidth = 1;

                    if (particles[a].isCore || particles[b].isCore) {
                        ctx.lineWidth = 1.2;
                        ctx.strokeStyle = \`rgba(\${COLOR_ACCENT}, \${opacityValue * 0.5})\`;
                    }
                    if (particles[a].isCore && particles[b].isCore) {
                        ctx.lineWidth = 1.5;
                        ctx.strokeStyle = \`rgba(\${COLOR_EMERALD}, \${opacityValue * 0.8})\`;
                    }

                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        connect();
    }

    resize();
    initGraph();
    animate();

    if(analyzeBtn) {
        analyzeBtn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const originalText = btn.innerHTML;
            const jsonOut = document.getElementById('jsonOutput');
            let step = 0;
            
            particles.forEach(p => p.active = false);
            tooltip.style.opacity = '0';
            if(jsonOut) {
                jsonOut.classList.remove('text-gray-500');
                jsonOut.innerHTML = '{\\n  "status": "initializing",\\n  "timestamp": "' + new Date().toISOString() + '"\\n}';
            }
            
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
                        if(jsonOut) jsonOut.innerHTML = '{\\n  "status": "resolving_proxy",\\n  "proxy_detected": true,\\n  "implementation": "0xc0d3..."\\n}';
                    } else if (step === 2) {
                        particles.forEach(p => p.active = true); 
                        if(jsonOut) jsonOut.innerHTML = '{\\n  "status": "extracting_structural_facts",\\n  "functions": 20,\\n  "events": 2\\n}';
                    } else if (step === 3) {
                        if(jsonOut) jsonOut.innerHTML = '{\\n  "status": "semantic_enrichment",\\n  "model": "gpt-4"\\n}';
                    }
                    
                    step++;
                } else {
                    clearInterval(interval);
                    btn.innerHTML = originalText;
                    if(jsonOut) jsonOut.innerHTML = JSON.stringify({
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
        });
    }
</script>
`;

html = html.replace('</body>\n</html>', jsScript + '\n</body>\n</html>');
fs.writeFileSync('interactive_graph.html', html);

// Also rebuild docs, schema, and sdk properly with clean links!
const navRegex = /(<nav[\s\S]*?<\/nav>)/;
const footerRegex = /(<footer[\s\S]*?<\/footer>)/;
const nav = html.match(navRegex)[1];
const footer = html.match(footerRegex)[1];
const head = html.split('<nav')[0];

function createPage(title, content) {
    return head + nav + `
    <main class="pt-32 pb-24 max-w-4xl mx-auto px-6 min-h-[70vh]">
        <h1 class="text-4xl font-serif text-gray-900 mb-8">${title}</h1>
        <div class="prose prose-lg text-gray-600 max-w-none space-y-4">
            ${content}
        </div>
    </main>
    ` + footer + `\n</body>\n</html>`;
}

// Write the child pages
const docsContent = `<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">The HashGraph Architecture</h2><p>HashGraph compiles deterministic blockchain artifacts into an AI-readable Protocol Graph.</p>`;
fs.writeFileSync('docs.html', createPage('Documentation', docsContent));

const schemaContent = `<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">Protocol Schema</h2><p>JSON Schema</p>`;
fs.writeFileSync('schema.html', createPage('Schema Reference', schemaContent));

const sdkContent = `<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">TypeScript SDK</h2><p>npm install @hashgraph/sdk</p>`;
fs.writeFileSync('sdk.html', createPage('SDK Implementation', sdkContent));
