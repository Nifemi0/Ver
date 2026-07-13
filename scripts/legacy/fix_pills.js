const fs = require('fs');
const files = ['interactive_graph.html', 'docs.html', 'schema.html', 'sdk.html'];

for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');

    // Add IDs and transition classes to the left and right nav containers
    const leftRegex = /<div class="flex items-center gap-2 w-1\/3">/;
    const newLeft = '<div id="navLeft" class="flex items-center gap-2 w-1/3 transition-all duration-300 px-4 py-2 rounded-full border border-transparent">';
    html = html.replace(leftRegex, newLeft);

    const rightRegex = /<div class="flex items-center justify-end gap-4 w-1\/3">/;
    const newRight = '<div id="navRight" class="flex items-center justify-end gap-4 w-1/3 transition-all duration-300 px-4 py-2 rounded-full border border-transparent">';
    html = html.replace(rightRegex, newRight);

    // Update the scroll script
    const oldScriptRegex = /\/\/ Navbar Scroll Effect[\s\S]*?\}\);/m;
    const newScript = `// Navbar Scroll Effect
    const navLinks = document.getElementById('navLinks');
    const navLeft = document.getElementById('navLeft');
    const navRight = document.getElementById('navRight');
    
    if(navLinks) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                const pillClasses = ['bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200'];
                navLinks.classList.add(...pillClasses);
                navLinks.classList.remove('border-transparent');
                
                if(navLeft) {
                    navLeft.classList.add(...pillClasses);
                    navLeft.classList.remove('border-transparent');
                }
                if(navRight) {
                    navRight.classList.add(...pillClasses);
                    navRight.classList.remove('border-transparent');
                }
            } else {
                const pillClasses = ['bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'border-gray-200'];
                navLinks.classList.remove(...pillClasses);
                navLinks.classList.add('border-transparent');
                
                if(navLeft) {
                    navLeft.classList.remove(...pillClasses);
                    navLeft.classList.add('border-transparent');
                }
                if(navRight) {
                    navRight.classList.remove(...pillClasses);
                    navRight.classList.add('border-transparent');
                }
            }
        });`;
    
    html = html.replace(oldScriptRegex, newScript);
    fs.writeFileSync(file, html);
}
