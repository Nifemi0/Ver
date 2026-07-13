const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix CTA "Try Live Demo"
html = html.replace(
    /<a class="bg-black text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">\s*Try Live Demo/g,
    `<a href="explorer.html" class="bg-black text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">\n                    Try Live Demo`
);

// 2. Fix CTA "View GitHub"
html = html.replace(
    /<a class="border border-gray-300 text-gray-900 px-6 py-3 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2">\s*View GitHub/g,
    `<a href="https://github.com/HashKey/HashGraph" class="border border-gray-300 text-gray-900 px-6 py-3 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2">\n                    View GitHub`
);

// 3. Fix the three "Learn more" buttons in the dark features section
// 01 Deterministic Compiler -> href="docs.html#compiler"
html = html.replace(
    /Deterministic<br>Compiler<\/h3>\s*<p class="[^"]*">[^<]*<\/p>\s*<a class="inline-flex items-center gap-2 text-xs/g,
    `Deterministic<br>Compiler</h3>\n            <p class="text-gray-400 text-sm mb-8">Extracts contracts, functions, events, roles, and dependencies directly from verified bytecode.</p>\n            <a href="docs.html#compiler" class="inline-flex items-center gap-2 text-xs`
);
// 02 Semantic Engine -> href="docs.html#schema"
html = html.replace(
    /Semantic<br>Engine<\/h3>\s*<p class="[^"]*">[^<]*<\/p>\s*<a class="inline-flex items-center gap-2 text-xs/g,
    `Semantic<br>Engine</h3>\n            <p class="text-gray-400 text-sm mb-8">Converts deterministic facts into AI-readable knowledge with citations and explainability.</p>\n            <a href="docs.html#schema" class="inline-flex items-center gap-2 text-xs`
);
// 03 MCP Interface -> href="docs.html#mcp"
html = html.replace(
    /MCP<br>Interface<\/h3>\s*<p class="[^"]*">[^<]*<\/p>\s*<a class="inline-flex items-center gap-2 text-xs/g,
    `MCP<br>Interface</h3>\n            <p class="text-gray-400 text-sm mb-8">Expose protocol graphs to Cursor, Claude, and other AI agents via the Model Context Protocol.</p>\n            <a href="docs.html#mcp" class="inline-flex items-center gap-2 text-xs`
);

fs.writeFileSync('index.html', html);
