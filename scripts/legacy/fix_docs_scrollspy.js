const fs = require('fs');

let html = fs.readFileSync('docs.html', 'utf8');

const scrollSpyScript = `
<script>
    // Docs ScrollSpy
    const sections = document.querySelectorAll('section[id]');
    const navLinksList = document.querySelectorAll('.hidden.md\\\\:block.w-64 a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinksList.forEach(link => {
                    link.classList.remove('text-gray-900', 'font-bold');
                    link.classList.add('text-gray-500', 'font-medium');
                    if (link.getAttribute('href') === '#' + entry.target.id) {
                        link.classList.remove('text-gray-500', 'font-medium');
                        link.classList.add('text-gray-900', 'font-bold');
                    }
                });
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(section => observer.observe(section));
</script>
`;

// Insert it right before the closing main or body tag, but docs.html ends with </body>\n</html>
html = html.replace('</body>', scrollSpyScript + '\n</body>');
fs.writeFileSync('docs.html', html);
