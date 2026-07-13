const fs = require('fs');
let html = fs.readFileSync('interactive_graph.html', 'utf8');

// Replace the old Nav
const oldNavRegex = /<nav[\s\S]*?<\/nav>/;
const newNav = `<!-- Top Navigation -->
<nav class="fixed top-0 w-full z-50 transition-all duration-300 pt-6">
    <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2 w-1/3">
            <span class="material-symbols-outlined text-gray-900" style="font-variation-settings: 'FILL' 1;">hexagon</span>
            <span class="font-serif font-bold text-xl tracking-tight">HashGraph</span>
        </div>
        
        <div class="flex-1 flex justify-center w-1/3">
            <div id="navLinks" class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500 transition-all duration-300 px-8 py-3 rounded-full border border-transparent">
                <a href="docs.html" class="hover:text-gray-900 transition-colors">Documentation</a>
                <a href="schema.html" class="hover:text-gray-900 transition-colors">Schema</a>
                <a href="sdk.html" class="hover:text-gray-900 transition-colors">SDK</a>
                <a href="https://github.com/HashKey/HashGraph" class="hover:text-gray-900 transition-colors">GitHub</a>
            </div>
        </div>
        
        <div class="flex items-center justify-end gap-4 w-1/3">
            <span class="hidden xl:inline-block text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Built for HashKey Chain</span>
            <a href="#" class="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
                Launch App <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
        </div>
    </div>
</nav>`;
html = html.replace(oldNavRegex, newNav);

// Append the scroll listener in the script
const scrollScript = `
    // Navbar Scroll Effect
    const navLinks = document.getElementById('navLinks');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navLinks.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200');
            navLinks.classList.remove('border-transparent');
        } else {
            navLinks.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200');
            navLinks.classList.add('border-transparent');
        }
    });
</script>
`;
html = html.replace('</script>', scrollScript);

fs.writeFileSync('interactive_graph.html', html);
