const fs = require('fs');
let html = fs.readFileSync('explorer.html', 'utf8');

// The head is corrupted around line 11. 
// We will just replace the bad tailwind script block and everything before the config.
const badHeadRegex = /<script src="https:\/\/cdn\.tailwindcss\.com">[\s\S]*?<script>\s*tailwind\.config/m;
const goodHead = `<script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config`;

html = html.replace(badHeadRegex, goodHead);

// Now we need to append the scroll script properly at the bottom right before </body>, 
// because we just deleted it from the head.
const scrollScript = `
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
</body>`;

html = html.replace('</body>', scrollScript);

fs.writeFileSync('explorer.html', html);
