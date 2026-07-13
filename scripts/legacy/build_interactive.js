const fs = require('fs');

let html = fs.readFileSync('new_design.html', 'utf8');

const newHero = `
<!-- Hero Section with Canvas Background -->
<section class="relative pt-40 pb-32 overflow-hidden border-b border-gray-200">
    <!-- Interactive Graph Canvas -->
    <canvas id="protocolGraph" class="absolute inset-0 w-full h-full opacity-[0.15]"></canvas>
    
    <div class="relative z-10 max-w-3xl mx-auto px-6 text-center pointer-events-none">
        <div class="inline-block text-xs font-bold tracking-widest text-gray-500 uppercase mb-6 pointer-events-auto">The Semantic Layer for HashKey Chain</div>
        <h1 class="text-5xl lg:text-7xl font-bold tracking-tighter leading-[1.1] mb-6 font-serif text-gray-900 pointer-events-auto">
            Understand<br>Smart Contracts.<br>
            <span class="italic font-normal text-gray-600">Not Just Their ABI.</span>
        </h1>
        <p class="text-lg text-gray-500 mb-10 mx-auto pointer-events-auto">
            HashGraph compiles verified smart contracts into deterministic protocol graphs that AI agents, IDEs, and developers can understand instantly.
        </p>
        <div class="flex flex-col sm:flex-row gap-0 rounded shadow-sm border border-gray-300 w-full max-w-md mx-auto bg-white overflow-hidden pointer-events-auto">
            <input type="text" placeholder="Paste Contract Address (0x...)" class="flex-1 px-4 py-3 outline-none text-sm font-mono placeholder-gray-400" />
            <button id="analyzeBtn" class="bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 justify-center">
                Analyze Contract <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
        </div>
        <div class="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium pointer-events-auto">
            <span class="w-2 h-2 bg-hashkey rounded-full"></span>
            Deterministic by design. Explainable by AI.
        </div>
    </div>
    
    <!-- Tooltip Element for Canvas Hover -->
    <div id="graphTooltip" class="absolute pointer-events-none opacity-0 transition-opacity duration-200 bg-black/90 text-white p-3 rounded shadow-xl text-xs font-mono z-20" style="transform: translate(-50%, -120%);">
        <div id="ttName" class="font-bold text-sm text-hashkey mb-1 border-b border-white/20 pb-1">Vault</div>
        <div class="flex justify-between gap-4"><span class="text-gray-400">Functions</span> <span id="ttFunc">20</span></div>
        <div class="flex justify-between gap-4"><span class="text-gray-400">Dependencies</span> <span id="ttDep">4</span></div>
        <div class="flex justify-between gap-4"><span class="text-gray-400">Events</span> <span id="ttEvt">8</span></div>
    </div>
</section>
`;

// Replace hero
const heroRegex = /<!-- Hero Section -->[\s\S]*?(?=<!-- Dark IDE Section -->)/;
html = html.replace(heroRegex, newHero);

const newScript = `
<script>
    const canvas = document.getElementById('protocolGraph');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('graphTooltip');
    
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
                ctx.fillStyle = '#A1A1AA';
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
                    ctx.strokeStyle = \`rgba(\${COLOR_ACCENT}, \${opacityValue * 0.15})\`;
                    ctx.lineWidth = 1;

                    if (particles[a].isCore || particles[b].isCore) {
                        ctx.lineWidth = 1.2;
                        ctx.strokeStyle = \`rgba(\${COLOR_ACCENT}, \${opacityValue * 0.3})\`;
                    }
                    if (particles[a].isCore && particles[b].isCore) {
                        ctx.lineWidth = 1.5;
                        ctx.strokeStyle = \`rgba(\${COLOR_EMERALD}, \${opacityValue * 0.4})\`;
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

    document.getElementById('analyzeBtn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        let step = 0;
        
        particles.forEach(p => p.active = false);
        tooltip.style.opacity = '0';
        
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
                } else if (step === 2) {
                    particles.forEach(p => p.active = true); 
                }
                
                step++;
            } else {
                clearInterval(interval);
                btn.innerHTML = originalText;
            }
        }, 800);
    });
</script>
</body>
</html>
`;

html = html.replace('</body>\n</html>', newScript);
fs.writeFileSync('interactive_graph.html', html);
