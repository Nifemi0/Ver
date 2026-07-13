const fs = require('fs');
const files = ['interactive_graph.html', 'docs.html', 'schema.html', 'sdk.html'];

for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');

    // Replace old footer
    const oldFooterRegex = /<footer[\s\S]*?<\/footer>/;
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
                <a href="sdk.html" class="hover:text-gray-900">SDK</a>
                <a href="schema.html" class="hover:text-gray-900">Schema</a>
            </div>
        </div>
        
        <div>
            <h4 class="font-semibold text-gray-900 mb-4 text-sm">Developers</h4>
            <div class="flex flex-col gap-3 text-sm text-gray-500">
                <a href="docs.html" class="hover:text-gray-900">Documentation</a>
                <a href="https://github.com/HashKey/HashGraph" class="hover:text-gray-900">GitHub</a>
                <a href="mcp.html" class="hover:text-gray-900">MCP Server</a>
            </div>
        </div>
        
        <div>
            <h4 class="font-semibold text-gray-900 mb-4 text-sm">Resources</h4>
            <div class="flex flex-col gap-3 text-sm text-gray-500">
                <a href="examples.html" class="hover:text-gray-900">Examples</a>
                <a href="benchmarks.html" class="hover:text-gray-900">Benchmarks</a>
                <a href="architecture.html" class="hover:text-gray-900">Architecture</a>
            </div>
        </div>
    </div>
</footer>`;

    html = html.replace(oldFooterRegex, newFooter);
    fs.writeFileSync(file, html);
}
