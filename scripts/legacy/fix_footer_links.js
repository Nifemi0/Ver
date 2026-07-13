const fs = require('fs');
const files = ['interactive_graph.html', 'docs.html', 'explorer.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');

    const newFooter = `<footer class="py-12 bg-white border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-gray-900">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">hexagon</span>
                <span class="font-serif font-bold text-lg">HashGraph</span>
            </div>
            <div class="text-xs text-gray-400">
                © 2024 HashGraph Protocol.<br>Deterministic by design.
            </div>
        </div>
        
        <div>
            <h4 class="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
            <div class="flex flex-col gap-3 text-sm text-gray-500">
                <a href="explorer.html" class="hover:text-gray-900">Explorer</a>
                <a href="docs.html" class="hover:text-gray-900">Documentation</a>
            </div>
        </div>
        
        <div>
            <h4 class="font-semibold text-gray-900 mb-4 text-sm">Developers</h4>
            <div class="flex flex-col gap-3 text-sm text-gray-500">
                <a href="https://github.com/HashKey/HashGraph" class="hover:text-gray-900">GitHub</a>
                <a href="docs.html#sdk" class="hover:text-gray-900">SDK</a>
                <a href="docs.html#mcp" class="hover:text-gray-900">MCP Server</a>
            </div>
        </div>
        
        <div>
            <h4 class="font-semibold text-gray-900 mb-4 text-sm">Resources</h4>
            <div class="flex flex-col gap-3 text-sm text-gray-500">
                <a href="docs.html#schema" class="hover:text-gray-900">Schema Protocol</a>
                <a href="docs.html#pipeline" class="hover:text-gray-900">Architecture</a>
            </div>
        </div>
    </div>
</footer>`;

    const footerRegex = /<footer[\s\S]*?<\/footer>/;
    html = html.replace(footerRegex, newFooter);
    
    fs.writeFileSync(file, html);
}
