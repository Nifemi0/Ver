const fs = require('fs');
const files = ['interactive_graph.html', 'docs.html', 'schema.html', 'sdk.html', 'explorer.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');

    const oldNavLinksRegex = /<div id="navLinks" class="([^"]+)">[\s\S]*?<\/div>/;
    
    // We keep the exact same classes but swap the links inside
    const newNavLinks = `<div id="navLinks" class="$1">
                <a href="explorer.html" class="hover:text-gray-900 transition-colors">Explorer</a>
                <a href="schema.html" class="hover:text-gray-900 transition-colors">Schema</a>
                <a href="sdk.html" class="hover:text-gray-900 transition-colors">SDK</a>
                <a href="docs.html" class="hover:text-gray-900 transition-colors">Docs</a>
            </div>`;

    html = html.replace(oldNavLinksRegex, newNavLinks);
    fs.writeFileSync(file, html);
}
