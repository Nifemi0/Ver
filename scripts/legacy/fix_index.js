const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the broken head script (Tailwind)
const badHeadRegex = /<script src="https:\/\/cdn\.tailwindcss\.com">[\s\S]*?<script>\s*tailwind\.config/m;
const goodHead = `<script src="https://cdn.tailwindcss.com"></script>
    <script>
    // Navbar Scroll Effect
    const navLinks = document.getElementById('navLinks');
    const navLeft = document.getElementById('navLeft');
    const navRight = document.getElementById('navRight');
    
    if(navLinks) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                const pillClasses = ['bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200'];
                navLinks.classList.add(...pillClasses);
                navLinks.classList.remove('border-transparent');
                if(navLeft) { navLeft.classList.add(...pillClasses); navLeft.classList.remove('border-transparent'); }
                if(navRight) { navRight.classList.add(...pillClasses); navRight.classList.remove('border-transparent'); }
            } else {
                const pillClasses = ['bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200'];
                navLinks.classList.remove(...pillClasses);
                navLinks.classList.add('border-transparent');
                if(navLeft) { navLeft.classList.remove(...pillClasses); navLeft.classList.add('border-transparent'); }
                if(navRight) { navRight.classList.remove(...pillClasses); navRight.classList.add('border-transparent'); }
            }
        });
    }
    </script>
    <script>
        tailwind.config`;

html = html.replace(badHeadRegex, goodHead);

// 2. Fix the syntax error at the bottom (remove the orphaned code)
const badSyntaxRegex = /\}\);\s*if\(jsonOut\) jsonOut\.innerHTML = '\{\\n  "status": "resolving_proxy"[\s\S]*?\}, 800\);\s*\n\s*\}/m;
// Let's just do a simpler replace because that block is huge and weird.
// It starts at "}); \n if(jsonOut) jsonOut.innerHTML = '{\n  "status": "resolving_proxy"," and ends at "}, 800);\n        });\n    }"
const startStr = "        }); \n                        if(jsonOut) jsonOut.innerHTML = '{\\n  \"status\": \"resolving_proxy\"";
const endStr = "            }, 800);\n        });\n    }";

// Since the whole click handler is a bit messed up, let's just replace the entire analyzeBtn.addEventListener block
const clickHandlerRegex = /analyzeBtn\.addEventListener\('click', async \(e\) => \{[\s\S]*?\}\);/m;
const goodClickHandler = `analyzeBtn.addEventListener('click', async (e) => {
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

html = html.replace(clickHandlerRegex, goodClickHandler);

// Just to be sure we also removed the dangling code below it that caused the syntax error
// We'll just slice the string from the end of the script tag and reassemble.
const scriptEndRegex = /analyzeBtn\.addEventListener\('click'[\s\S]*?<\/script>/m;
html = html.replace(scriptEndRegex, goodClickHandler + '\n    }\n</script>');

fs.writeFileSync('index.html', html);
